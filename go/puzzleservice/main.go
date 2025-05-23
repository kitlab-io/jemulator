package main

import (
	"encoding/json"
	"flag"
	"fmt"
	"io"
	"io/ioutil"
	"log"
	"os"
	"path/filepath"
	"strings"
)

// PuzzleType represents the type of puzzle
type PuzzleType string

const (
	TypeCircuit PuzzleType = "circuit"
	TypeLogic   PuzzleType = "logic"
	TypeMaze    PuzzleType = "maze"
	TypePattern PuzzleType = "pattern"
)

// PuzzleSolution represents a solution submission for a puzzle
type PuzzleSolution struct {
	PuzzleID string          `json:"puzzleId"`
	Type     PuzzleType      `json:"type"`
	Solution json.RawMessage `json:"solution"`
}

// PuzzleVerificationResult represents the result of verifying a puzzle solution
type PuzzleVerificationResult struct {
	PuzzleID string `json:"puzzleId"`
	Valid    bool   `json:"valid"`
	Message  string `json:"message,omitempty"`
}

// CircuitSolution represents a solution for a circuit puzzle
type CircuitSolution struct {
	Connections []Connection `json:"connections"`
	PowerState  []PowerState `json:"powerState"`
}

// Connection represents a connection between two components in a circuit
type Connection struct {
	From string `json:"from"`
	To   string `json:"to"`
}

// PowerState represents the power state of a component
type PowerState struct {
	ComponentID string `json:"componentId"`
	Powered     bool   `json:"powered"`
}

// LogicSolution represents a solution for a logic puzzle
type LogicSolution struct {
	Values map[string]bool `json:"values"`
}

// MazeSolution represents a solution for a maze puzzle
type MazeSolution struct {
	Path []Position `json:"path"`
}

// Position represents a position in a maze
type Position struct {
	X int `json:"x"`
	Y int `json:"y"`
}

// PatternSolution represents a solution for a pattern puzzle
type PatternSolution struct {
	Sequence []int `json:"sequence"`
}

// verifyPuzzle verifies a puzzle solution
func verifyPuzzle(solution PuzzleSolution) PuzzleVerificationResult {
	result := PuzzleVerificationResult{
		PuzzleID: solution.PuzzleID,
		Valid:    false,
	}

	// Verify the solution based on the puzzle type
	switch solution.Type {
	case TypeCircuit:
		return verifyCircuitPuzzle(solution)
	case TypeLogic:
		return verifyLogicPuzzle(solution)
	case TypeMaze:
		return verifyMazePuzzle(solution)
	case TypePattern:
		return verifyPatternPuzzle(solution)
	default:
		result.Message = fmt.Sprintf("Unknown puzzle type: %s", solution.Type)
		return result
	}
}

// verifyCircuitPuzzle verifies a circuit puzzle solution
func verifyCircuitPuzzle(solution PuzzleSolution) PuzzleVerificationResult {
	result := PuzzleVerificationResult{
		PuzzleID: solution.PuzzleID,
		Valid:    false,
	}

	var circuitSolution CircuitSolution
	if err := json.Unmarshal(solution.Solution, &circuitSolution); err != nil {
		result.Message = fmt.Sprintf("Invalid circuit solution format: %v", err)
		return result
	}

	// Here we would implement the actual verification logic for circuit puzzles
	// For now, we'll use a simple example verification
	
	// Example: Check if puzzle ID is "circuit1" and has specific connections
	if solution.PuzzleID == "circuit1" {
		// Simple validation for circuit1: needs at least 3 connections
		if len(circuitSolution.Connections) >= 3 {
			// Check if battery is connected to LED
			hasBatteryToLED := false
			for _, conn := range circuitSolution.Connections {
				if (conn.From == "battery" && conn.To == "led") || 
				   (conn.From == "led" && conn.To == "battery") {
					hasBatteryToLED = true
					break
				}
			}
			
			if hasBatteryToLED {
				result.Valid = true
				result.Message = "Circuit solution is correct"
			} else {
				result.Message = "Battery must be connected to LED"
			}
		} else {
			result.Message = "Insufficient connections in circuit"
		}
	} else {
		result.Message = fmt.Sprintf("Unknown circuit puzzle ID: %s", solution.PuzzleID)
	}

	return result
}

// verifyLogicPuzzle verifies a logic puzzle solution
func verifyLogicPuzzle(solution PuzzleSolution) PuzzleVerificationResult {
	result := PuzzleVerificationResult{
		PuzzleID: solution.PuzzleID,
		Valid:    false,
	}

	var logicSolution LogicSolution
	if err := json.Unmarshal(solution.Solution, &logicSolution); err != nil {
		result.Message = fmt.Sprintf("Invalid logic solution format: %v", err)
		return result
	}

	// Example: Check if puzzle ID is "logic1" and has specific values
	if solution.PuzzleID == "logic1" {
		// Simple validation for logic1: A AND B must be true, C must be false
		a, aExists := logicSolution.Values["A"]
		b, bExists := logicSolution.Values["B"]
		c, cExists := logicSolution.Values["C"]
		
		if !aExists || !bExists || !cExists {
			result.Message = "Missing required logic values"
			return result
		}
		
		if a && b && !c {
			result.Valid = true
			result.Message = "Logic solution is correct"
		} else {
			result.Message = "Logic values do not satisfy the conditions"
		}
	} else {
		result.Message = fmt.Sprintf("Unknown logic puzzle ID: %s", solution.PuzzleID)
	}

	return result
}

// verifyMazePuzzle verifies a maze puzzle solution
func verifyMazePuzzle(solution PuzzleSolution) PuzzleVerificationResult {
	result := PuzzleVerificationResult{
		PuzzleID: solution.PuzzleID,
		Valid:    false,
	}

	var mazeSolution MazeSolution
	if err := json.Unmarshal(solution.Solution, &mazeSolution); err != nil {
		result.Message = fmt.Sprintf("Invalid maze solution format: %v", err)
		return result
	}

	// Example: Check if puzzle ID is "maze1" and has a valid path
	if solution.PuzzleID == "maze1" {
		// Simple validation for maze1: path must start at (0,0) and end at (5,5)
		if len(mazeSolution.Path) < 2 {
			result.Message = "Path is too short"
			return result
		}
		
		start := mazeSolution.Path[0]
		end := mazeSolution.Path[len(mazeSolution.Path)-1]
		
		if start.X == 0 && start.Y == 0 && end.X == 5 && end.Y == 5 {
			// Check if the path is continuous (each step is adjacent)
			isValid := true
			for i := 1; i < len(mazeSolution.Path); i++ {
				prev := mazeSolution.Path[i-1]
				curr := mazeSolution.Path[i]
				
				// Check if the current position is adjacent to the previous one
				dx := abs(curr.X - prev.X)
				dy := abs(curr.Y - prev.Y)
				
				if (dx == 1 && dy == 0) || (dx == 0 && dy == 1) {
					// Valid step
				} else {
					isValid = false
					result.Message = fmt.Sprintf("Invalid step at position %d", i)
					break
				}
			}
			
			if isValid {
				result.Valid = true
				result.Message = "Maze solution is correct"
			}
		} else {
			result.Message = "Path must start at (0,0) and end at (5,5)"
		}
	} else {
		result.Message = fmt.Sprintf("Unknown maze puzzle ID: %s", solution.PuzzleID)
	}

	return result
}

// verifyPatternPuzzle verifies a pattern puzzle solution
func verifyPatternPuzzle(solution PuzzleSolution) PuzzleVerificationResult {
	result := PuzzleVerificationResult{
		PuzzleID: solution.PuzzleID,
		Valid:    false,
	}

	var patternSolution PatternSolution
	if err := json.Unmarshal(solution.Solution, &patternSolution); err != nil {
		result.Message = fmt.Sprintf("Invalid pattern solution format: %v", err)
		return result
	}

	// Example: Check if puzzle ID is "pattern1" and has the correct sequence
	if solution.PuzzleID == "pattern1" {
		// Simple validation for pattern1: sequence must be [1, 3, 5, 7, 9]
		expectedSequence := []int{1, 3, 5, 7, 9}
		
		if len(patternSolution.Sequence) != len(expectedSequence) {
			result.Message = "Sequence has incorrect length"
			return result
		}
		
		for i, v := range expectedSequence {
			if patternSolution.Sequence[i] != v {
				result.Message = "Sequence does not match the expected pattern"
				return result
			}
		}
		
		result.Valid = true
		result.Message = "Pattern solution is correct"
	} else {
		result.Message = fmt.Sprintf("Unknown pattern puzzle ID: %s", solution.PuzzleID)
	}

	return result
}

// abs returns the absolute value of x
func abs(x int) int {
	if x < 0 {
		return -x
	}
	return x
}

func main() {
	// Parse command line flags
	inputFile := flag.String("file", "", "Path to JSON file containing puzzle solution")
	jsonStr := flag.String("json", "", "JSON string containing puzzle solution")
	listPuzzles := flag.Bool("list", false, "List all available puzzles")
	puzzleID := flag.String("puzzle", "", "Get details for a specific puzzle")
	configDir := flag.String("config", "", "Path to config directory (default: ~/.jemulator)")
	exportPuzzle := flag.String("export", "", "Export a puzzle to a JSON file")
	flag.Parse()

	// Initialize configuration
	configPaths := DefaultConfigPaths()
	if *configDir != "" {
		configPaths.PuzzlesDir = filepath.Join(*configDir, "puzzles")
		configPaths.PrivateConfigPath = filepath.Join(*configDir, "config.json")
	}

	// Ensure config directories exist
	if err := EnsureConfigDirs(configPaths); err != nil {
		log.Fatalf("Failed to ensure config directories: %v", err)
	}

	// Initialize the puzzle store
	store := NewPuzzleStore(configPaths)

	// Load private configuration
	if err := store.LoadPrivateConfig(); err != nil {
		log.Printf("Warning: Failed to load private config: %v", err)
	}

	// Load puzzles
	if err := store.LoadPuzzles(); err != nil {
		log.Fatalf("Failed to load puzzles: %v", err)
	}

	// Handle list puzzles command
	if *listPuzzles {
		puzzles := store.GetAllPuzzles()
		listOutput := make([]map[string]interface{}, 0, len(puzzles))
		for _, puzzle := range puzzles {
			// Exclude the solution from the output
			listOutput = append(listOutput, map[string]interface{}{
				"id":          puzzle.ID,
				"type":        puzzle.Type,
				"name":        puzzle.Name,
				"description": puzzle.Description,
				"difficulty":  puzzle.Difficulty,
			})
		}
		output, err := json.MarshalIndent(listOutput, "", "  ")
		if err != nil {
			log.Fatalf("Failed to marshal puzzles to JSON: %v", err)
		}
		fmt.Println(string(output))
		return
	}

	// Handle get puzzle details command
	if *puzzleID != "" {
		puzzle, ok := store.GetPuzzle(*puzzleID)
		if !ok {
			log.Fatalf("Puzzle not found: %s", *puzzleID)
		}
		// Exclude the solution from the output
		puzzleOutput := map[string]interface{}{
			"id":          puzzle.ID,
			"type":        puzzle.Type,
			"name":        puzzle.Name,
			"description": puzzle.Description,
			"difficulty":  puzzle.Difficulty,
		}
		output, err := json.MarshalIndent(puzzleOutput, "", "  ")
		if err != nil {
			log.Fatalf("Failed to marshal puzzle to JSON: %v", err)
		}
		fmt.Println(string(output))
		return
	}
	
	// Handle export puzzle command
	if *exportPuzzle != "" {
		puzzle, ok := store.GetPuzzle(*exportPuzzle)
		if !ok {
			log.Fatalf("Puzzle not found: %s", *exportPuzzle)
		}
		
		// Create export filename based on puzzle ID
		exportFilename := filepath.Join(configPaths.PuzzlesDir, fmt.Sprintf("%s.json", puzzle.ID))
		
		// Marshal the puzzle to JSON
		output, err := json.MarshalIndent(puzzle, "", "  ")
		if err != nil {
			log.Fatalf("Failed to marshal puzzle to JSON: %v", err)
		}
		
		// Write to file
		if err := ioutil.WriteFile(exportFilename, output, 0644); err != nil {
			log.Fatalf("Failed to write puzzle to file: %v", err)
		}
		
		fmt.Printf("Exported puzzle '%s' to %s\n", puzzle.ID, exportFilename)
		return
	}

	// Handle verify solution command
	var solution PuzzleSolution
	
	// Determine the input source
	if *jsonStr != "" {
		// Parse JSON from string parameter
		if err := json.Unmarshal([]byte(*jsonStr), &solution); err != nil {
			log.Fatalf("Failed to parse JSON string: %v", err)
		}
	} else if *inputFile != "" {
		// Read from file
		fileData, err := ioutil.ReadFile(*inputFile)
		if err != nil {
			log.Fatalf("Failed to read input file: %v", err)
		}
		if err := json.Unmarshal(fileData, &solution); err != nil {
			log.Fatalf("Failed to parse JSON from file: %v", err)
		}
	} else {
		// Read from stdin
		decoder := json.NewDecoder(os.Stdin)
		if err := decoder.Decode(&solution); err != nil {
			log.Fatalf("Failed to parse JSON from stdin: %v", err)
		}
	}

	// Verify the puzzle solution using the store
	result := store.VerifyPuzzleSolution(solution)

	// Output the result as JSON
	output, err := json.MarshalIndent(result, "", "  ")
	if err != nil {
		log.Fatalf("Failed to marshal result to JSON: %v", err)
	}
	fmt.Println(string(output))
}
