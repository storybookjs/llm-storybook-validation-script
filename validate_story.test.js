#!/usr/bin/env node

/**
 * Test script to verify validate_story.js functionality
 * Tests all the different error types we've created
 */

const { execSync } = require("child_process");
const path = require("path");

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
    expectedErrors: ["typeScript", "renderTest", "interactionTest"], // TypeScript + test failures
  },
  {
    name: "Interaction Test Errors",
    file: "example/src/stories/interaction-error.stories.tsx",
    expectedErrors: ["renderTest", "interactionTest"], // Now detectable with test-runner
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
      const result = execSync(`node validate_story.js "${test.file}" --json`, {
        encoding: "utf8",
        stdio: "pipe",
      });

      const validationResult = JSON.parse(result);

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
    } catch (error) {
      console.log("❌ Test FAILED - Validation script error");
      console.log(`   Error: ${error.message}`);

      // If it's a validation failure (exit code 1), that might be expected
      if (error.status === 1) {
        console.log(
          "   Note: Exit code 1 might be expected for stories with errors"
        );
      }
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
