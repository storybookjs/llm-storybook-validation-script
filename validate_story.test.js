#!/usr/bin/env node

/**
 * Test script to verify validate_story.js functionality
 * Tests all the different error types we've created
 */

const { exec } = require("child_process");
const path = require("path");
const { promisify } = require("util");

const execAsync = promisify(exec);

const testStories = [
  {
    name: "ESLint Errors",
    file: "example/src/stories/eslint-error.stories.tsx",
    expectedErrors: ["linting"], // ESLint + TypeScript errors
  },
  {
    name: "TypeScript Errors",
    file: "example/src/stories/typescript-error.stories.tsx",
    expectedErrors: ["linting", "typeScript"], // ESLint + TypeScript errors
  },
  {
    name: "Render Errors",
    file: "example/src/stories/render-error.stories.tsx",
    expectedErrors: ["typeScript", "renderTest"], // TypeScript + test failures
  },
  {
    name: "Interaction Test Errors",
    file: "example/src/stories/interaction-error.stories.tsx",
    expectedErrors: ["interactionTest"], // Now detectable with test-runner
  },
  {
    name: "Perfect Story (Control)",
    file: "example/src/stories/perfect.stories.tsx",
    expectedErrors: [], // Should pass all checks
  },
];

async function testValidation() {
  console.log("🧪 Testing Storybook Story Validation Script\n");
  console.log("=".repeat(60));

  let totalTests = 0;
  let passedTests = 0;

  for (const test of testStories) {
    totalTests++;
    console.log(`\n📋 Test ${totalTests}: ${test.name}`);
    console.log(`📁 File: ${test.file}`);

    try {
      // Check if file exists
      if (!require("fs").existsSync(test.file)) {
        console.log("❌ File not found");
        continue;
      }

      // Run validation with JSON output
      let stdout, stderr, exitCode;
      try {
        const result = await execAsync(
          `node validate_story.js "${test.file}" --json`
        );
        stdout = result.stdout;
        stderr = result.stderr;
        exitCode = 0;
      } catch (error) {
        // If the command failed but we have stdout, we can still parse the results
        if (error.stdout) {
          stdout = error.stdout;
          stderr = error.stderr;
          exitCode = error.code;
        } else {
          throw error; // Re-throw if we don't have stdout
        }
      }

      // Parse the JSON output
      let validationResult;
      try {
        validationResult = JSON.parse(stdout);
      } catch (parseError) {
        console.log("❌ Test FAILED - Could not parse JSON output");
        console.log(`   Error: ${parseError.message}`);
        continue;
      }

      // Check if validation detected the expected errors
      const detectedErrors = [];
      Object.entries(validationResult.checks).forEach(([checkName, check]) => {
        if (check.status === "FAIL") {
          detectedErrors.push(checkName);
        }
      });

      // Compare expected vs detected errors
      const expectedSet = new Set(test.expectedErrors);
      const detectedSet = new Set(detectedErrors);

      const missingErrors = [...expectedSet].filter((x) => !detectedSet.has(x));
      const unexpectedErrors = [...detectedSet].filter(
        (x) => !expectedSet.has(x)
      );

      if (missingErrors.length === 0 && unexpectedErrors.length === 0) {
        console.log("✅ Test PASSED - Validation correctly identified errors");
        passedTests++;
      } else {
        console.log("❌ Test FAILED");
        if (missingErrors.length > 0) {
          console.log(
            `   Missing expected errors: ${missingErrors.join(", ")}`
          );
        }
        if (unexpectedErrors.length > 0) {
          console.log(`   Unexpected errors: ${unexpectedErrors.join(", ")}`);
        }
      }

      // Show validation summary
      console.log(
        `   Overall Score: ${validationResult.summary?.score || "N/A"}%`
      );
      console.log(
        `   Status: ${validationResult.summary?.overallStatus || "N/A"}`
      );

      // If exit code was non-zero, show that it was expected
      if (exitCode !== 0) {
        console.log(
          `   Exit Code: ${exitCode} (expected for stories with errors)`
        );
      }
    } catch (error) {
      console.log("❌ Test FAILED - Validation script error");
      console.log(`   Error: ${error.message}`);
      // This catch block now only handles unexpected errors (not exit codes 1 or 2)
    }
  }

  console.log("\n" + "=".repeat(60));
  console.log("📊 Test Summary:");
  console.log(`   Total Tests: ${totalTests}`);
  console.log(`   Passed: ${passedTests}`);
  console.log(`   Failed: ${totalTests - passedTests}`);
  console.log(
    `   Success Rate: ${Math.round((passedTests / totalTests) * 100)}%`
  );

  if (passedTests === totalTests) {
    console.log(
      "\n🎉 All tests passed! The validation script is working correctly."
    );
    process.exit(0);
  } else {
    console.log("\n⚠️  Some tests failed. Check the output above for details.");
    process.exit(1);
  }
}

// Run tests
testValidation().catch((error) => {
  console.error("❌ Test suite failed:", error.message);
  process.exit(1);
});
