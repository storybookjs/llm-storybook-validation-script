#!/usr/bin/env node

/**
 * Storybook Story Validation Script
 *
 * This script validates LLM-generated Storybook stories against multiple quality gates:
 * 1. Syntactic Correctness (ESLint)
 * 2. Type Safety (TypeScript compilation)
 * 3. Render Test (Storybook test-runner)
 * 4. Component Story Format (CSF) compliance
 *
 * Usage: node validate_story.js <story_file_path> [--json]
 *
 * Options:
 *   --json    Output results in JSON format for programmatic use
 *
 * Exit Codes:
 *   0 - All checks passed
 *   1 - Critical failures (overall status: FAIL)
 *   2 - Warnings (overall status: WARNING)
 */

const { execSync, spawn } = require("child_process");
const fs = require("fs");
const path = require("path");
const { promisify } = require("util");
const sleep = promisify(setTimeout);

class StoryValidator {
  constructor(storyFilePath) {
    this.storyFilePath = storyFilePath;
    this.projectRoot = this.findProjectRoot();
    this.results = {
      storyFile: storyFilePath,
      timestamp: new Date().toISOString(),
      checks: {},
    };
    this.storybookProcess = null;
    this.storybookPort = 6006;
  }

  /**
   * Find the project root by looking for package.json
   */
  findProjectRoot() {
    let currentDir = path.dirname(this.storyFilePath);
    while (currentDir !== path.dirname(currentDir)) {
      if (fs.existsSync(path.join(currentDir, "package.json"))) {
        return currentDir;
      }
      currentDir = path.dirname(currentDir);
    }
    throw new Error("Could not find project root with package.json");
  }

  /**
   * Check if a file exists
   */
  fileExists(filePath) {
    return fs.existsSync(filePath);
  }

  /**
   * Check if ESLint is configured in the project
   */
  hasESLintConfig() {
    const eslintConfigs = [
      ".eslintrc.js",
      ".eslintrc.json",
      ".eslintrc.yml",
      ".eslintrc.yaml",
      "eslint.config.js",
    ];
    return eslintConfigs.some((config) =>
      this.fileExists(path.join(this.projectRoot, config))
    );
  }

  /**
   * Check if TypeScript is configured in the project
   */
  hasTypeScriptConfig() {
    return this.fileExists(path.join(this.projectRoot, "tsconfig.json"));
  }

  /**
   * Check if Storybook is configured in the project
   */
  hasStorybookConfig() {
    return this.fileExists(path.join(this.projectRoot, ".storybook"));
  }

  /**
   * Check if test-runner is available
   */
  hasTestRunner() {
    try {
      const packageJson = JSON.parse(
        fs.readFileSync(path.join(this.projectRoot, "package.json"), "utf8")
      );
      return (
        packageJson.devDependencies &&
        (packageJson.devDependencies["@storybook/test-runner"] ||
          packageJson.devDependencies["@storybook/testing-library"])
      );
    } catch (error) {
      return false;
    }
  }

  /**
   * Start Storybook in the background
   */
  async startStorybook(silent = false) {
    if (this.storybookProcess) {
      return; // Already running
    }

    try {
      if (!silent) {
        console.log("🚀 Starting Storybook for test-runner...");
      }

      // Start Storybook in the background
      this.storybookProcess = spawn("npm", ["run", "storybook"], {
        cwd: this.projectRoot,
        stdio: "pipe",
        detached: true,
      });

      // Wait for Storybook to be ready
      let attempts = 0;
      const maxAttempts = 30; // 30 seconds timeout

      while (attempts < maxAttempts) {
        try {
          // Check if port is in use (cross-platform)
          if (!this.isPortAvailable(this.storybookPort)) {
            if (!silent) {
              console.log("✅ Storybook is ready");
            }
            break;
          }
        } catch (error) {
          // Port check failed, continue waiting
        }

        await sleep(1000); // Wait 1 second
        attempts++;

        if (!silent && attempts % 5 === 0) {
          console.log(`⏳ Waiting for Storybook... (${attempts}s)`);
        }
      }

      if (attempts >= maxAttempts) {
        throw new Error("Storybook failed to start within 30 seconds");
      }
    } catch (error) {
      if (!silent) {
        console.error("❌ Failed to start Storybook:", error.message);
      }
      throw error;
    }
  }

  /**
   * Stop Storybook process
   */
  async stopStorybook(silent = false) {
    if (!this.storybookProcess) {
      return;
    }

    try {
      if (!silent) {
        console.log("🛑 Stopping Storybook...");
      }

      // Kill the Storybook process and all its children
      if (this.storybookProcess.pid) {
        try {
          execSync(`pkill -P ${this.storybookProcess.pid}`);
          execSync(`kill ${this.storybookProcess.pid}`);
        } catch (error) {
          // Process might already be dead
        }
      }

      this.storybookProcess = null;
      if (!silent) {
        console.log("✅ Storybook stopped");
      }
    } catch (error) {
      if (!silent) {
        console.error(
          "⚠️  Warning: Failed to stop Storybook cleanly:",
          error.message
        );
      }
    }
  }

  /**
   * Check if port is available (cross-platform)
   */
  isPortAvailable(port) {
    try {
      if (process.platform === "win32") {
        // Windows
        execSync(`netstat -an | findstr :${port}`, { stdio: "pipe" });
        return false; // If command succeeds, port is in use
      } else {
        // Unix-like systems
        execSync(`lsof -i :${port}`, { stdio: "pipe" });
        return false; // If command succeeds, port is in use
      }
    } catch (error) {
      return true; // Port is available
    }
  }

  /**
   * Run ESLint on the story file
   */
  async runLinting() {
    if (!this.hasESLintConfig()) {
      this.results.checks.linting = {
        status: "SKIP",
        error: "No ESLint configuration found",
      };
      return;
    }

    try {
      // Get relative path from project root
      const relativePath = path.relative(this.projectRoot, this.storyFilePath);
      const result = execSync(`npx eslint "${relativePath}"`, {
        cwd: this.projectRoot,
        encoding: "utf8",
        stdio: "pipe",
      });

      this.results.checks.linting = {
        status: "PASS",
        error: null,
      };
    } catch (error) {
      this.results.checks.linting = {
        status: "FAIL",
        error: error.stdout || error.message,
      };
    }
  }

  /**
   * Run TypeScript compilation check
   */
  async runTypeScriptCheck() {
    if (!this.hasTypeScriptConfig()) {
      this.results.checks.typeScript = {
        status: "SKIP",
        error: "No TypeScript configuration found",
      };
      return;
    }

    try {
      // Get relative path from project root for targeted TypeScript checking
      const relativePath = path.relative(this.projectRoot, this.storyFilePath);

      // Create a temporary tsconfig that only includes our story file
      const tempTsConfig = {
        extends: "./tsconfig.app.json",
        include: [relativePath],
        exclude: [
          "**/*.spec.ts",
          "**/*.test.ts",
          "**/*.spec.tsx",
          "**/*.test.tsx",
        ],
      };

      const tempTsConfigPath = path.join(
        this.projectRoot,
        "temp-tsconfig.json"
      );
      fs.writeFileSync(tempTsConfigPath, JSON.stringify(tempTsConfig, null, 2));

      try {
        // Run TypeScript check with the temporary config
        const result = execSync(
          `npx tsc --noEmit --project "temp-tsconfig.json"`,
          {
            cwd: this.projectRoot,
            encoding: "utf8",
            stdio: "pipe",
          }
        );

        this.results.checks.typeScript = {
          status: "PASS",
          error: null,
        };
      } finally {
        // Clean up temporary config file
        if (fs.existsSync(tempTsConfigPath)) {
          fs.unlinkSync(tempTsConfigPath);
        }
      }
    } catch (error) {
      this.results.checks.typeScript = {
        status: "FAIL",
        error: error.stdout || error.message,
      };
    }
  }

  /**
   * Check CSF version compliance
   */
  async checkCSFCompliance() {
    try {
      const storyContent = fs.readFileSync(this.storyFilePath, "utf8");

      // Check for CSF3 patterns
      const hasCSF3Patterns =
        storyContent.includes("StoryObj<") ||
        storyContent.includes("Meta<") ||
        storyContent.includes("satisfies Meta<");

      // Check for CSF2 patterns
      const hasCSF2Patterns =
        storyContent.includes("storiesOf(") ||
        storyContent.includes("addDecorator(") ||
        storyContent.includes("addParameters(");

      // Check for modern Storybook 7+ patterns
      const hasModernPatterns =
        storyContent.includes("satisfies") ||
        storyContent.includes("as Meta<") ||
        storyContent.includes("StoryObj<");

      let csfVersion = "UNKNOWN";
      let compliance = "UNKNOWN";

      if (hasCSF2Patterns && !hasCSF3Patterns) {
        csfVersion = "CSF2";
        compliance = "FAIL"; // CSF2 is deprecated
      } else if (hasCSF3Patterns || hasModernPatterns) {
        csfVersion = "CSF3";
        compliance = "PASS";
      } else {
        csfVersion = "UNKNOWN";
        compliance = "FAIL";
      }

      this.results.checks.csfCompliance = {
        status: compliance,
        csfVersion: csfVersion,
        error: compliance === "FAIL" ? `Detected ${csfVersion} format` : null,
      };
    } catch (error) {
      this.results.checks.csfCompliance = {
        status: "ERROR",
        csfVersion: "UNKNOWN",
        error: error.message,
      };
    }
  }

  /**
   * Run Storybook test-runner for render and interaction tests
   */
  async runStorybookTests(silent = false) {
    if (!this.hasTestRunner()) {
      this.results.checks.renderTest = {
        status: "SKIP",
        error: "No Storybook test-runner found",
      };
      this.results.checks.interactionTest = {
        status: "SKIP",
        error: "No Storybook test-runner found",
      };
      return;
    }

    try {
      // Start Storybook before running tests
      await this.startStorybook(silent);

      // Extract story name from file path for targeted testing
      const fileName = path.basename(
        this.storyFilePath,
        path.extname(this.storyFilePath)
      );
      const storyName = fileName.replace(".stories", "");

      if (!silent) {
        console.log(`🧪 Running test-storybook for story: ${storyName}`);
      }

      // Run test-storybook on the specific story file
      const relativeStoryPath = path.relative(
        this.projectRoot,
        this.storyFilePath
      );

      let testOutput;
      try {
        // Try to run test-storybook and capture output
        const result = execSync(
          `npx test-storybook "${relativeStoryPath}" --url=http://127.0.0.1:${this.storybookPort}`,
          {
            cwd: this.projectRoot,
            encoding: "utf8",
            stdio: "pipe",
            timeout: 60000, // 60 second timeout (increased for Storybook startup)
          }
        );
        testOutput = result.toString();
      } catch (error) {
        // If execSync fails, try to capture the output from the error
        // The important output might be in stdout even when the command fails
        testOutput = error.stderr.toString();
      }

      // Now we have testOutput regardless of success or failure
      // Parse test results to distinguish between render and interaction tests
      const testResults = this.parseTestOutput(testOutput, storyName);

      this.results.checks.renderTest = testResults.renderTest;
      this.results.checks.interactionTest = testResults.interactionTest;
    } finally {
      // Always stop Storybook after tests, regardless of success/failure
      await this.stopStorybook(silent);
    }
  }

  /**
   * Parse test output to distinguish between render and interaction test failures
   */
  parseTestOutput(testOutput, storyName) {
    // Since we're now testing only the specific story, the output should be cleaner
    // Check if the story was found in the test output
    const storyTestPattern = new RegExp(`${storyName}\\.stories\\.tsx`, "i");
    const hasStoryTests = storyTestPattern.test(testOutput);

    if (!hasStoryTests) {
      return {
        renderTest: {
          status: "SKIP",
          error: "Story not found in test output",
        },
        interactionTest: {
          status: "SKIP",
          error: "Story not found in test output",
        },
      };
    }

    // Check for test failures in our story
    const storyFailPattern = new RegExp(
      `FAIL.*${storyName}\\.stories\\.tsx`,
      "i"
    );
    const hasFailures = storyFailPattern.test(testOutput);

    if (!hasFailures) {
      return {
        renderTest: {
          status: "PASS",
          error: null,
        },
        interactionTest: {
          status: "PASS",
          error: null,
        },
      };
    }

    // Extract specific test failures
    const renderTestResult = this.parseRenderTestFailure(testOutput, storyName);
    const interactionTestResult = this.parseInteractionTestFailure(
      testOutput,
      storyName
    );

    return {
      renderTest: renderTestResult,
      interactionTest: interactionTestResult,
    };
  }

  /**
   * Parse render test (smoke test) failures
   */
  parseRenderTestFailure(testOutput, storyName) {
    // First, check if this story has smoke tests at all
    const hasSmokeTests = /\●.*›.*› smoke-test/i.test(testOutput);

    if (!hasSmokeTests) {
      return {
        status: "SKIP",
        error: "No smoke tests found for this story",
      };
    }

    // Look for smoke-test failures specifically for this story
    // The pattern should match: ● Test/StoryName › StoryName › smoke-test
    // and the error should be related to this specific story
    const smokeTestPattern = new RegExp(
      `●.*›.*› smoke-test[\\s\\S]*?Message:[\\s\\S]*?at.*${storyName}`,
      "i"
    );

    const smokeTestMatch = testOutput.match(smokeTestPattern);

    if (smokeTestMatch) {
      // Extract the error message from the smoke test
      const errorMessageMatch = smokeTestMatch[0].match(/Message:\s*([^\n]+)/);
      const errorMessage = errorMessageMatch
        ? errorMessageMatch[1].trim()
        : "Render test failed";

      return {
        status: "FAIL",
        error: `Render test failed: ${errorMessage}`,
      };
    }

    // If smoke tests exist but no failure detected, they passed
    return {
      status: "PASS",
      error: null,
    };
  }

  /**
   * Parse interaction test (play test) failures
   */
  parseInteractionTestFailure(testOutput, storyName) {
    // First, check if this story has play tests at all
    const hasPlayTests = /\●.*›.*› play-test/i.test(testOutput);

    if (!hasPlayTests) {
      return {
        status: "SKIP",
        error: "No play tests found for this story",
      };
    }

    // Look for play-test failures specifically for this story
    // The pattern should match: ● Test/StoryName › StoryName › play-test
    // and the error should be related to this specific story
    const playTestPattern = new RegExp(
      `●.*›.*› play-test[\\s\\S]*?Message:[\\s\\S]*?at.*${storyName}`,
      "i"
    );

    const playTestMatch = testOutput.match(playTestPattern);

    if (playTestMatch) {
      // Extract the error message from the play test
      const errorMessageMatch = playTestMatch[0].match(/Message:\s*([^\n]+)/);
      const errorMessage = errorMessageMatch
        ? errorMessageMatch[1].trim()
        : "Interaction test failed";

      return {
        status: "FAIL",
        error: `Interaction test failed: ${errorMessage}`,
      };
    }

    // If play tests exist but no failure detected, they passed
    return {
      status: "PASS",
      error: null,
    };
  }

  /**
   * Generate overall score and summary
   */
  generateSummary() {
    const checks = this.results.checks;
    const totalChecks = Object.keys(checks).length;
    let passedChecks = 0;
    let failedChecks = 0;
    let skippedChecks = 0;

    Object.values(checks).forEach((check) => {
      if (check.status === "PASS") passedChecks++;
      else if (check.status === "FAIL") failedChecks++;
      else if (check.status === "SKIP") skippedChecks++;
    });

    const score =
      totalChecks > 0
        ? (passedChecks / (totalChecks - skippedChecks)) * 100
        : 0;

    this.results.summary = {
      totalChecks,
      passedChecks,
      failedChecks,
      skippedChecks,
      score: Math.round(score),
      overallStatus: score >= 80 ? "PASS" : score >= 60 ? "WARNING" : "FAIL",
    };
  }

  /**
   * Run all validation checks
   */
  async validate(silent = false) {
    if (!silent) {
      console.log(`🔍 Validating story: ${this.storyFilePath}`);
      console.log(`📁 Project root: ${this.projectRoot}\n`);
    }

    try {
      // Run all checks in parallel for efficiency
      await Promise.all([
        this.runLinting(),
        this.runTypeScriptCheck(),
        this.checkCSFCompliance(),
        this.runStorybookTests(silent),
      ]);

      // Generate summary
      this.generateSummary();

      // Print results (unless silent mode)
      if (!silent) {
        this.printResults();
      }

      return this.results;
    } catch (error) {
      if (!silent) {
        console.error("❌ Validation failed with error:", error.message);
      }
      this.results.error = error.message;
      return this.results;
    } finally {
      // Ensure Storybook is stopped even if validation fails
      if (this.storybookProcess) {
        await this.stopStorybook();
      }
    }
  }

  /**
   * Print formatted results to console
   */
  printResults() {
    const { summary, checks } = this.results;

    console.log("📊 Validation Results:");
    console.log("=".repeat(50));

    Object.entries(checks).forEach(([checkName, result]) => {
      const status = result.status;
      const icon =
        status === "PASS"
          ? "✅"
          : status === "FAIL"
          ? "❌"
          : status === "SKIP"
          ? "⏭️"
          : "⚠️";
      console.log(`${icon} ${checkName}: ${status}`);

      if (result.error) {
        console.log(
          `   Error: ${result.error.substring(0, 200)}${
            result.error.length > 200 ? "..." : ""
          }`
        );
      }
    });

    console.log("\n📈 Summary:");
    console.log(
      `   Overall Score: ${summary.score}% (${summary.overallStatus})`
    );
    console.log(
      `   Passed: ${summary.passedChecks}/${
        summary.totalChecks - summary.skippedChecks
      }`
    );
    console.log(`   Failed: ${summary.failedChecks}`);
    console.log(`   Skipped: ${summary.skippedChecks}`);
  }

  /**
   * Get results as JSON string
   */
  getResultsJSON() {
    return JSON.stringify(this.results, null, 2);
  }

  /**
   * Cleanup resources
   */
  async cleanup() {
    if (this.storybookProcess) {
      await this.stopStorybook();
    }
  }
}

/**
 * Main execution function
 */
async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.error(
      "❌ Usage: node validate_story.js <story_file_path> [--json]"
    );
    console.error(
      "Example: node validate_story.js ./src/components/Button.stories.tsx"
    );
    console.error(
      "Example: node validate_story.js ./src/components/Button.stories.tsx --json"
    );
    process.exit(1);
  }

  const storyFilePath = args[0];

  if (!fs.existsSync(storyFilePath)) {
    console.error(`❌ Story file not found: ${storyFilePath}`);
    process.exit(1);
  }

  let validator = null;

  // Handle process signals for graceful shutdown
  const cleanup = async () => {
    if (validator) {
      await validator.cleanup();
    }
    process.exit(0);
  };

  process.on("SIGINT", cleanup);
  process.on("SIGTERM", cleanup);
  process.on("SIGQUIT", cleanup);

  try {
    validator = new StoryValidator(storyFilePath);
    const isJsonMode = args.includes("--json");
    const results = await validator.validate(isJsonMode); // Pass isJsonMode to control output

    // Determine exit code based on results
    let exitCode = 0;
    if (results.summary?.overallStatus === "FAIL") {
      exitCode = 1; // Critical failures
    } else if (results.summary?.overallStatus === "WARNING") {
      exitCode = 2; // Warnings (non-critical issues)
    }

    // Output JSON for programmatic use
    if (isJsonMode) {
      console.log(validator.getResultsJSON());
      process.exit(exitCode); // Exit with appropriate code
    }

    // Exit with appropriate code for normal mode
    process.exit(exitCode);
  } catch (error) {
    console.error("❌ Validation script failed:", error.message);
    process.exit(1);
  } finally {
    // Ensure cleanup happens
    if (validator) {
      await validator.cleanup();
    }
  }
}

// Run if called directly
if (require.main === module) {
  main().catch((error) => {
    console.error("❌ Unhandled error:", error);
    process.exit(1);
  });
}

module.exports = StoryValidator;
