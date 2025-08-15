#!/bin/bash

# Storybook Validation Script - Setup Script
# This script installs all dependencies for both the root project and example project

set -e  # Exit on any error

echo "🚀 Setting up Storybook Validation Script..."
echo "=============================================="

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ first."
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Node.js version 18+ is required. Current version: $(node --version)"
    exit 1
fi

echo "✅ Node.js $(node --version) detected"

# Install root dependencies
echo "📦 Installing root dependencies..."
npm install

# Install example project dependencies
echo "📦 Installing example project dependencies..."
cd example
npm install
cd ..

echo ""
echo "🎉 Setup complete! All dependencies installed."
echo ""
echo "Next steps:"
echo "1. Run tests: npm test"
echo "2. Validate a story: npm run validate <story_path>"
echo "3. Start your research!"
echo ""
echo "For more information, see README.md"
