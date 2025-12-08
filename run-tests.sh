#!/bin/bash

# 🤖 Ghost User Test Runner for Kmetija Maroša Website
# This script sets up and runs automated tests

echo "🚀 Setting up Ghost User Tests for Kmetija Maroša..."
echo "=================================================="

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js first."
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed. Please install npm first."
    exit 1
fi

echo "✅ Node.js and npm are available"

# Install Puppeteer if not already installed
echo "📦 Installing test dependencies..."
if [ ! -d "node_modules/puppeteer" ]; then
    npm install puppeteer
    if [ $? -eq 0 ]; then
        echo "✅ Puppeteer installed successfully"
    else
        echo "❌ Failed to install Puppeteer"
        exit 1
    fi
else
    echo "✅ Puppeteer already installed"
fi

# Run the tests
echo ""
echo "🧪 Running Ghost User Tests..."
echo "================================"
echo "🌐 Testing: https://marosatest.netlify.app"
echo "🌍 Languages: SL, EN, DE, HR"
echo "🤖 Mode: Automated browser testing"
echo ""

# Run the test script
node ghost-user-test.js

# Check if tests completed successfully
if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Tests completed successfully!"
    echo "📄 Check test-report.json for detailed results"
    
    # Show quick summary if report exists
    if [ -f "test-report.json" ]; then
        echo ""
        echo "📊 Quick Summary:"
        echo "=================="
        node -e "
        const report = JSON.parse(require('fs').readFileSync('test-report.json', 'utf8'));
        console.log(\`Total Tests: \${report.totalTests}\`);
        console.log(\`Passed: \${report.passedTests} ✅\`);
        console.log(\`Failed: \${report.failedTests} ❌\`);
        console.log(\`Success Rate: \${Math.round((report.passedTests / report.totalTests) * 100)}%\`);
        if (report.issues.length > 0) {
            console.log(\`\nIssues Found: \${report.issues.length}\`);
        }
        if (report.translations.missing.length > 0) {
            console.log(\`Missing Translations: \${report.translations.missing.length} languages affected\`);
        }
        "
    fi
else
    echo ""
    echo "❌ Tests failed or encountered errors"
    echo "📄 Check the console output above for details"
    exit 1
fi

echo ""
echo "🎯 Next Steps:"
echo "=============="
echo "1. Review test-report.json for detailed results"
echo "2. Check website-review-checklist.md for manual testing"
echo "3. Fix any issues found in the tests"
echo "4. Re-run tests after fixes: ./run-tests.sh"
echo ""
echo "📋 Manual Review:"
echo "=================="
echo "• Open website-review-checklist.md"
echo "• Go through each section manually"
echo "• Test on different devices and browsers"
echo "• Verify all translations are working"
echo ""
echo "🌐 Test the live site: https://marosatest.netlify.app"
