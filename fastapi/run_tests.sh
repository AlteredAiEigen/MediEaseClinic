#!/bin/bash

# MediEase Clinic - Test Runner Script
# Runs all tests in sequential order with comprehensive reporting

echo "🧪 MediEase Clinic - Test Suite"
echo "================================"
echo ""

# Check if virtual environment is activated
if [ -z "$VIRTUAL_ENV" ]; then
    echo "⚠️  Virtual environment not activated"
    echo "   Activating venv..."
    source venv/bin/activate
fi

# Check if pytest is installed
if ! command -v pytest &> /dev/null; then
    echo "❌ pytest not found. Installing dependencies..."
    pip install -r requirements.txt
fi

echo "📋 Test Configuration:"
echo "   - Python: $(python --version)"
echo "   - Pytest: $(pytest --version | head -1)"
echo "   - Working Directory: $(pwd)"
echo ""

# Parse command line arguments
VERBOSE="-v"
COVERAGE=""
SPECIFIC_TEST=""

while [[ $# -gt 0 ]]; do
    case $1 in
        --coverage|-c)
            COVERAGE="--cov=app --cov-report=html --cov-report=term"
            shift
            ;;
        --verbose|-vv)
            VERBOSE="-vv"
            shift
            ;;
        --test|-t)
            SPECIFIC_TEST="$2"
            shift 2
            ;;
        --help|-h)
            echo "Usage: ./run_tests.sh [OPTIONS]"
            echo ""
            echo "Options:"
            echo "  -c, --coverage    Generate coverage report"
            echo "  -vv, --verbose    Very verbose output"
            echo "  -t, --test FILE   Run specific test file"
            echo "  -h, --help        Show this help message"
            echo ""
            echo "Examples:"
            echo "  ./run_tests.sh                    # Run all tests"
            echo "  ./run_tests.sh --coverage         # Run with coverage"
            echo "  ./run_tests.sh -t test_02_auth.py # Run specific test"
            exit 0
            ;;
        *)
            echo "Unknown option: $1"
            echo "Use --help for usage information"
            exit 1
            ;;
    esac
done

# Determine what to test
if [ -n "$SPECIFIC_TEST" ]; then
    TEST_PATH="tests/$SPECIFIC_TEST"
    echo "🎯 Running specific test: $SPECIFIC_TEST"
else
    TEST_PATH="tests/"
    echo "🎯 Running all tests in sequential order"
fi

echo ""
echo "🏃 Starting tests..."
echo "================================"
echo ""

# Run tests
if [ -n "$COVERAGE" ]; then
    pytest $TEST_PATH $VERBOSE $COVERAGE -s
    EXIT_CODE=$?
    
    if [ $EXIT_CODE -eq 0 ]; then
        echo ""
        echo "📊 Coverage report generated: htmlcov/index.html"
        echo "   Open with: open htmlcov/index.html"
    fi
else
    pytest $TEST_PATH $VERBOSE -s
    EXIT_CODE=$?
fi

echo ""
echo "================================"

# Summary
if [ $EXIT_CODE -eq 0 ]; then
    echo "✅ All tests passed!"
    echo ""
    echo "📈 Test Summary:"
    echo "   - Status: PASSED"
    echo "   - Exit Code: $EXIT_CODE"
    
    if [ -n "$COVERAGE" ]; then
        echo "   - Coverage Report: htmlcov/index.html"
    fi
else
    echo "❌ Some tests failed"
    echo ""
    echo "📈 Test Summary:"
    echo "   - Status: FAILED"
    echo "   - Exit Code: $EXIT_CODE"
    echo ""
    echo "💡 Tips:"
    echo "   - Run with -vv for more details"
    echo "   - Check test output above for specific failures"
    echo "   - Ensure MongoDB is accessible"
    echo "   - Verify .env configuration"
fi

echo ""

exit $EXIT_CODE

