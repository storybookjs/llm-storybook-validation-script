# Storybook Validation Script

A comprehensive validation framework for evaluating LLM-generated Storybook stories against multiple quality gates. This project implements a scientific workflow to determine what information and context an LLM needs to write "good" Storybook stories.

## 🎯 Research Objective

This project aims to systematically identify the optimal context and workflow for LLMs to generate high-quality Storybook stories that align with your project's specific syntax, conventions, and quality standards.

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ 
- npm or yarn package manager

### Installation & Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd storybook-validation-script
   ```

2. **Install all dependencies**
   
   **Option A: Using npm script (recommended)**
   ```bash
   npm run setup
   ```
   
   **Option B: Using setup script directly**
   ```bash
   # On macOS/Linux:
   ./setup.sh
   
   # On Windows:
   setup.bat
   ```
   
   This will install dependencies for both the root project and the example Storybook project.

3. **Run the test suite to verify everything works**
   ```bash
   npm test
   ```

## 📋 Quality Metrics

The validation script evaluates stories against these objective criteria:

1. **Syntactic Correctness (Linting)** - ESLint compliance
2. **Type Safety (TypeScript)** - Compilation without errors  
3. **Render Test (Smoke Test)** - Storybook test-runner smoke test
4. **Component Story Format (CSF)** - Version 3 compliance
5. **Interaction Test** - Play function execution and assertions

## 🔧 Available Scripts

### Root Package Scripts

```bash
# Install all dependencies (root + example)
npm run setup

# Run the complete test suite
npm test

# Validate a specific story file
npm run validate <story_file_path>
```

### Setup Scripts

For users who prefer direct script execution:

```bash
# macOS/Linux
./setup.sh

# Windows
setup.bat
```

### Direct Script Usage

```bash
# Core validation script
node validate_story.js <story_file_path>

# Test suite
node validate_story.test.js
```

## 📁 Project Structure

```
storybook-validation-script/
├── validate_story.js        # Core validation engine
├── validate_story.test.js   # Test suite for validation script
├── package.json             # Root package configuration
├── setup.sh                 # Setup script for macOS/Linux
├── setup.bat                # Setup script for Windows
├── example/                 # Example Storybook project with test stories
│   ├── package.json         # Example project dependencies
│   ├── .storybook/          # Storybook configuration
│   ├── src/stories/         # Test stories for validation
│   │   ├── eslint-error.stories.tsx      # ESLint violations
│   │   ├── typescript-error.stories.tsx  # TypeScript errors
│   │   ├── render-error.stories.tsx      # Render failures
│   │   ├── interaction-error.stories.tsx # Play function errors
│   │   └── perfect.stories.tsx           # Control/baseline
│   └── tsconfig.json        # TypeScript configuration
└── README.md                 # This file
```

## 🧪 Testing the Validation Script

### Run the Complete Test Suite

```bash
npm test
```

This will validate all test stories and verify that the validation script correctly identifies different types of errors.

### Test Individual Stories

```bash
# Test a story with errors
npm run validate example/src/stories/eslint-error.stories.tsx

# Test a perfect story
npm run validate example/src/stories/perfect.stories.tsx

# Test with JSON output for programmatic use
npm run validate example/src/stories/perfect.stories.tsx --json
```

### Test Stories Included

| Story | Purpose | Expected Errors |
|-------|---------|-----------------|
| **eslint-error.stories.tsx** | Tests ESLint error detection | `linting`, `typeScript` |
| **typescript-error.stories.tsx** | Tests TypeScript error detection | `linting`, `typeScript` |
| **render-error.stories.tsx** | Tests render failure detection | `typeScript`, `renderTest`, `interactionTest` |
| **interaction-error.stories.tsx** | Tests play function failures | `renderTest`, `interactionTest` |
| **perfect.stories.tsx** | Control story with no errors | `[]` (none) |

## 🔍 Validation Output

### Console Output

The script provides human-readable output with:

```
🔍 Validating story: example/src/stories/example.stories.tsx
📁 Project root: example

🚀 Starting Storybook for test-runner...
✅ Storybook is ready
🧪 Running test-storybook for story: example
🛑 Stopping Storybook...
✅ Storybook stopped

📊 Validation Results:
==================================================
✅ linting: PASS
❌ typeScript: FAIL
   Error: Type error details...
✅ csfCompliance: PASS
❌ renderTest: FAIL
   Error: Render error details...
⏭️ interactionTest: SKIP
   Error: Render test failed, skipping interaction test

📈 Summary:
   Overall Score: 67% (WARNING)
   Passed: 4/6
   Failed: 2
   Skipped: 0
```

### JSON Output

For programmatic use, add the `--json` flag:

```bash
npm run validate example/src/stories/example.stories.tsx --json
```

This provides structured JSON output:

```json
{
  "storyFile": "example/src/stories/example.stories.tsx",
  "timestamp": "2025-08-15T13:35:04.142Z",
  "checks": {
    "linting": { "status": "PASS", "error": null },
    "typeScript": { "status": "FAIL", "error": "Type error details..." },
    "csfCompliance": { "status": "PASS", "csfVersion": "CSF3" },
    "renderTest": { "status": "FAIL", "error": "Render error details..." },
    "interactionTest": { "status": "SKIP", "error": "Render test failed" }
  },
  "summary": {
    "totalChecks": 6,
    "passedChecks": 4,
    "failedChecks": 2,
    "skippedChecks": 0,
    "score": 67,
    "overallStatus": "WARNING"
  }
}
```

## 📊 Exit Codes

The validation script uses standard exit codes:

- **0**: All checks passed or warnings only
- **1**: One or more checks failed

This makes it suitable for CI/CD integration:

```bash
# In CI pipeline
node validate_story.js ./story.stories.tsx
if [ $? -eq 0 ]; then
  echo "Validation passed"
else
  echo "Validation failed"
  exit 1
fi
```

## 🤝 Contributing

This project is designed for research and experimentation. Feel free to:

- Modify validation criteria for your specific needs
- Add new quality gates
- Extend the MCP integration
- Share findings and improvements

## 📄 License

MIT License

---

## 🎯 Next Steps

1. **Run the setup**: `npm run setup`
2. **Verify installation**: `npm test`
3. **Test with your stories**: `npm run validate <path>`
4. **Begin research**: Use the validation results to optimize LLM workflows

The foundation is solid and ready for systematic experimentation! 🚀
