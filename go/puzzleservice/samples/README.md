# Sample Puzzles Collection

This directory contains a collection of sample puzzles for testing the puzzle verification service. The puzzles cover various types and difficulty levels.

## Puzzle Types

1. **Circuit Puzzles**
   - `circuit_basic.json`: A simple LED circuit (Easy)
   - `circuit_advanced.json`: A parallel circuit with multiple LEDs (Medium)

2. **Logic Puzzles**
   - `logic_basic.json`: Basic logic gates (Easy)
   - `logic_advanced.json`: Complex logic circuit (Hard)

3. **Maze Puzzles**
   - `maze_basic.json`: Simple maze path finding (Easy)
   - `maze_advanced.json`: Complex maze with obstacles (Hard)

4. **Pattern Puzzles**
   - `pattern_basic.json`: Simple number sequence (Easy)
   - `pattern_advanced.json`: Fibonacci sequence (Medium)

## Using the Sample Puzzles

You can use these sample puzzles in several ways:

1. **Load them as private puzzles**:
   ```bash
   # Copy to your private puzzles directory
   mkdir -p ~/.jemulator/puzzles
   cp samples/*.json ~/.jemulator/puzzles/
   ```

2. **Verify individual puzzles**:
   ```bash
   # Create a solution file (see test_puzzles.sh for examples)
   ./puzzleservice --file path/to/solution.json
   ```

3. **Run the test suite**:
   ```bash
   # Run the test suite to verify all puzzles
   ./test_puzzles.sh
   ```

## Customizing Puzzles

You can use these samples as templates to create your own puzzles:

1. Copy a sample puzzle that's closest to what you want
2. Modify the JSON structure to fit your needs
3. Save it to your private puzzles directory

## Test Suite

The `test_puzzles.sh` script in the parent directory automatically tests all sample puzzles with both correct and incorrect solutions. It creates temporary solution files based on the puzzle definitions and verifies that the service correctly identifies valid and invalid solutions.
