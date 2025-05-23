# Puzzle Verification Service

A Go CLI application that verifies puzzle solutions against predefined correct solutions. This service takes a JSON payload representing a puzzle solution state and verifies if it's correct. It supports loading private, non-version controlled puzzle configurations and can receive JSON input as a string parameter.

## Features

- Supports multiple puzzle types (circuit, logic, maze, pattern)
- Command-line interface for easy integration
- JSON input/output for interoperability
- Predefined puzzle definitions with solutions
- Private, non-version controlled puzzle configurations
- Multiple input methods (file, string parameter, stdin)
- Export puzzles to JSON files

## Installation

```bash
# Clone the repository (if you haven't already)
git clone https://github.com/kitlab-io/jemulator.git

# Navigate to the puzzle service directory
cd jemulator/go/puzzleservice

# Build the application
go build
```

## Usage

### List Available Puzzles

```bash
./puzzleservice --list
```

This will output a JSON array of all available puzzles with their details (excluding solutions).

### Get Puzzle Details

```bash
./puzzleservice --puzzle circuit1
```

This will output the details of the specified puzzle (excluding the solution).

### Verify a Puzzle Solution

You can verify a puzzle solution by providing a JSON payload in several ways:

#### Using a file:

```bash
./puzzleservice --file solution.json
```

#### Using a JSON string parameter:

```bash
./puzzleservice --json '{"puzzleId":"circuit1","type":"circuit","solution":{"connections":[{"from":"battery","to":"led"},{"from":"led","to":"battery"}]}}'
```

#### Using standard input:

```bash
cat solution.json | ./puzzleservice
```

or

```bash
./puzzleservice < solution.json
```

### Export a Puzzle

Export a puzzle to a JSON file that can be edited and used as a custom puzzle:

```bash
./puzzleservice --export circuit1
```

This will export the puzzle to `~/.jemulator/puzzles/circuit1.json`.

### Specify a Custom Configuration Directory

```bash
./puzzleservice --config /path/to/config/dir
```

## Solution Format

The solution JSON should have the following structure:

```json
{
  "puzzleId": "circuit1",
  "type": "circuit",
  "solution": {
    // Solution data specific to the puzzle type
  }
}
```

### Circuit Puzzle Solution

```json
{
  "puzzleId": "circuit1",
  "type": "circuit",
  "solution": {
    "connections": [
      {"from": "battery", "to": "switch"},
      {"from": "switch", "to": "led"},
      {"from": "led", "to": "resistor"},
      {"from": "resistor", "to": "battery"}
    ],
    "powerState": [
      {"componentId": "battery", "powered": true},
      {"componentId": "switch", "powered": true},
      {"componentId": "led", "powered": true},
      {"componentId": "resistor", "powered": true}
    ]
  }
}
```

### Logic Puzzle Solution

```json
{
  "puzzleId": "logic1",
  "type": "logic",
  "solution": {
    "values": {
      "A": true,
      "B": true,
      "C": false
    }
  }
}
```

### Maze Puzzle Solution

```json
{
  "puzzleId": "maze1",
  "type": "maze",
  "solution": {
    "path": [
      {"x": 0, "y": 0},
      {"x": 0, "y": 1},
      {"x": 0, "y": 2},
      {"x": 1, "y": 2},
      {"x": 2, "y": 2},
      {"x": 2, "y": 3},
      {"x": 3, "y": 3},
      {"x": 3, "y": 4},
      {"x": 4, "y": 4},
      {"x": 5, "y": 4},
      {"x": 5, "y": 5}
    ]
  }
}
```

### Pattern Puzzle Solution

```json
{
  "puzzleId": "pattern1",
  "type": "pattern",
  "solution": {
    "sequence": [1, 3, 5, 7, 9]
  }
}
```

## Response Format

The service returns a JSON response with the verification result:

```json
{
  "puzzleId": "circuit1",
  "valid": true,
  "message": "Circuit solution is correct"
}
```

If the solution is invalid, the response will include a message explaining why:

```json
{
  "puzzleId": "circuit1",
  "valid": false,
  "message": "Circuit connections are incorrect"
}
```

## Private Puzzle Configurations

The service supports loading puzzle configurations from private, non-version controlled files. By default, these files are stored in `~/.jemulator/puzzles/`. You can create custom puzzles by:

1. Exporting an existing puzzle: `./puzzleservice --export circuit1`
2. Editing the exported JSON file in `~/.jemulator/puzzles/circuit1.json`
3. Creating new JSON files in the puzzles directory

### Custom Puzzle Paths

You can specify additional paths to load puzzles from by editing the private configuration file at `~/.jemulator/config.json`:

```json
{
  "apiKeys": {},
  "customPuzzlePaths": [
    "/path/to/custom/puzzles",
    "/another/path/to/puzzles"
  ],
  "defaultPuzzleSet": "default"
}
```

## Adding New Puzzles

To add new puzzles programmatically, modify the `LoadPredefinedPuzzles` method in `puzzles.go` to include your new puzzle definitions and solutions.

## Integration

This service can be integrated with other systems through its command-line interface or by importing the package into other Go applications.

## License

This project is part of the jemulator repository and is subject to its license terms.
