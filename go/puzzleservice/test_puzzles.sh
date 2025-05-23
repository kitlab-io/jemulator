#!/bin/bash

# Test Suite for Puzzle Verification Service
# This script tests all sample puzzles with both correct and incorrect solutions

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[0;33m'
NC='\033[0m' # No Color

# Build the puzzle service if it doesn't exist
if [ ! -f ./puzzleservice ]; then
    echo -e "${YELLOW}Building puzzle service...${NC}"
    go build
    if [ $? -ne 0 ]; then
        echo -e "${RED}Failed to build puzzle service${NC}"
        exit 1
    fi
fi

# Create test directory
TEST_DIR="./test_tmp"
mkdir -p "$TEST_DIR"

# Function to run a test
run_test() {
    local puzzle_id=$1
    local test_type=$2
    local solution_file=$3
    local expected_result=$4

    echo -e "\n${YELLOW}Testing $puzzle_id ($test_type)...${NC}"
    
    # Run the test
    ./puzzleservice --file "$solution_file" > "$TEST_DIR/result.json"
    
    # Check if the result contains the expected validity
    if grep -q "\"valid\": $expected_result" "$TEST_DIR/result.json"; then
        echo -e "${GREEN}✓ Test passed for $puzzle_id ($test_type)${NC}"
        return 0
    else
        echo -e "${RED}✗ Test failed for $puzzle_id ($test_type)${NC}"
        echo "Expected result: \"valid\": $expected_result"
        echo "Actual result:"
        cat "$TEST_DIR/result.json"
        return 1
    fi
}

# Function to create a correct solution file
create_correct_solution() {
    local puzzle_id=$1
    local puzzle_type=$2
    local sample_file="./samples/${puzzle_id}.json"
    local output_file="$TEST_DIR/${puzzle_id}_correct.json"
    
    # Extract the solution from the sample file
    solution=$(jq -c '.solution' "$sample_file")
    
    # Create the solution file
    cat > "$output_file" << EOF
{
  "puzzleId": "$puzzle_id",
  "type": "$puzzle_type",
  "solution": $solution
}
EOF
    
    echo "$output_file"
}

# Function to create an incorrect solution file
create_incorrect_solution() {
    local puzzle_id=$1
    local puzzle_type=$2
    local output_file="$TEST_DIR/${puzzle_id}_incorrect.json"
    
    case "$puzzle_type" in
        "circuit")
            cat > "$output_file" << EOF
{
  "puzzleId": "$puzzle_id",
  "type": "$puzzle_type",
  "solution": {
    "connections": [
      {"from": "battery", "to": "led"}
    ],
    "powerState": [
      {"componentId": "battery", "powered": true},
      {"componentId": "led", "powered": true}
    ]
  }
}
EOF
            ;;
        "logic")
            cat > "$output_file" << EOF
{
  "puzzleId": "$puzzle_id",
  "type": "$puzzle_type",
  "solution": {
    "values": {
      "A": false,
      "B": false,
      "C": true
    }
  }
}
EOF
            ;;
        "maze")
            cat > "$output_file" << EOF
{
  "puzzleId": "$puzzle_id",
  "type": "$puzzle_type",
  "solution": {
    "path": [
      {"x": 0, "y": 0},
      {"x": 1, "y": 1},
      {"x": 2, "y": 2}
    ]
  }
}
EOF
            ;;
        "pattern")
            cat > "$output_file" << EOF
{
  "puzzleId": "$puzzle_id",
  "type": "$puzzle_type",
  "solution": {
    "sequence": [2, 4, 6, 8, 10]
  }
}
EOF
            ;;
    esac
    
    echo "$output_file"
}

# Function to test a puzzle with both correct and incorrect solutions
test_puzzle() {
    local puzzle_file=$1
    local puzzle_id=$(basename "$puzzle_file" .json)
    local puzzle_type=$(jq -r '.type' "$puzzle_file")
    
    # Create solution files
    local correct_solution=$(create_correct_solution "$puzzle_id" "$puzzle_type")
    local incorrect_solution=$(create_incorrect_solution "$puzzle_id" "$puzzle_type")
    
    # Run tests
    local passed=0
    run_test "$puzzle_id" "correct solution" "$correct_solution" true
    passed=$((passed + $?))
    run_test "$puzzle_id" "incorrect solution" "$incorrect_solution" false
    passed=$((passed + $?))
    
    return $passed
}

# Test all sample puzzles
echo -e "${YELLOW}Starting puzzle tests...${NC}"
total_tests=0
passed_tests=0

# Find all sample puzzles
for puzzle_file in ./samples/*.json; do
    test_puzzle "$puzzle_file"
    result=$?
    total_tests=$((total_tests + 2)) # 2 tests per puzzle (correct and incorrect)
    if [ $result -eq 0 ]; then
        passed_tests=$((passed_tests + 2))
    elif [ $result -eq 1 ]; then
        passed_tests=$((passed_tests + 1))
    fi
done

# Print summary
echo -e "\n${YELLOW}Test Summary:${NC}"
echo -e "Total tests: $total_tests"
echo -e "Passed tests: $passed_tests"
echo -e "Failed tests: $((total_tests - passed_tests))"

if [ $passed_tests -eq $total_tests ]; then
    echo -e "${GREEN}All tests passed!${NC}"
    exit 0
else
    echo -e "${RED}Some tests failed.${NC}"
    exit 1
fi
