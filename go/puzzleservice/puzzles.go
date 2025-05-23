package main

import (
	"encoding/json"
	"fmt"
	"io/ioutil"
	"os"
	"path/filepath"
	"strings"
)

// Puzzle represents a puzzle definition
type Puzzle struct {
	ID          string          `json:"id"`
	Type        PuzzleType      `json:"type"`
	Name        string          `json:"name"`
	Description string          `json:"description"`
	Difficulty  string          `json:"difficulty"`
	Solution    json.RawMessage `json:"solution"`
}

// PuzzleStore represents a store of puzzles
type PuzzleStore struct {
	puzzles map[string]Puzzle
	config  ConfigPaths
	private PrivateConfig
}

// NewPuzzleStore creates a new puzzle store
func NewPuzzleStore(configPaths ConfigPaths) *PuzzleStore {
	return &PuzzleStore{
		puzzles: make(map[string]Puzzle),
		config:  configPaths,
	}
}

// LoadPrivateConfig loads the private configuration
func (s *PuzzleStore) LoadPrivateConfig() error {
	config, err := LoadPrivateConfig(s.config.PrivateConfigPath)
	if err != nil {
		return fmt.Errorf("failed to load private config: %v", err)
	}

	s.private = config
	return nil
}

// LoadPuzzles loads puzzles from files and adds predefined puzzles
func (s *PuzzleStore) LoadPuzzles() error {
	// First load puzzles from files
	if err := s.LoadPuzzlesFromFiles(); err != nil {
		return err
	}

	// Then add predefined puzzles if they don't already exist
	return s.LoadPredefinedPuzzles()
}

// LoadPuzzlesFromFiles loads puzzles from JSON files in the puzzles directory
func (s *PuzzleStore) LoadPuzzlesFromFiles() error {
	// Ensure the puzzles directory exists
	if err := os.MkdirAll(s.config.PuzzlesDir, 0755); err != nil {
		return fmt.Errorf("failed to create puzzles directory: %v", err)
	}

	// Load puzzles from the main puzzles directory
	if err := s.loadPuzzlesFromDir(s.config.PuzzlesDir); err != nil {
		return err
	}

	// Load puzzles from custom paths defined in private config
	for _, customPath := range s.private.CustomPuzzlePaths {
		if err := s.loadPuzzlesFromDir(customPath); err != nil {
			// Just log the error but continue loading other puzzles
			fmt.Fprintf(os.Stderr, "Warning: failed to load puzzles from %s: %v\n", customPath, err)
		}
	}

	return nil
}

// loadPuzzlesFromDir loads all puzzle JSON files from a directory
func (s *PuzzleStore) loadPuzzlesFromDir(dir string) error {
	// Check if directory exists
	if _, err := os.Stat(dir); os.IsNotExist(err) {
		return nil // Directory doesn't exist, nothing to load
	}

	// Read all files in the directory
	files, err := ioutil.ReadDir(dir)
	if err != nil {
		return fmt.Errorf("failed to read puzzles directory: %v", err)
	}

	// Process each JSON file
	for _, file := range files {
		if file.IsDir() || !strings.HasSuffix(file.Name(), ".json") {
			continue // Skip directories and non-JSON files
		}

		filePath := filepath.Join(dir, file.Name())
		data, err := ioutil.ReadFile(filePath)
		if err != nil {
			return fmt.Errorf("failed to read puzzle file %s: %v", filePath, err)
		}

		var puzzle Puzzle
		if err := json.Unmarshal(data, &puzzle); err != nil {
			return fmt.Errorf("failed to parse puzzle file %s: %v", filePath, err)
		}

		// Add the puzzle to the store
		s.puzzles[puzzle.ID] = puzzle
		fmt.Printf("Loaded puzzle: %s (%s)\n", puzzle.ID, puzzle.Name)
	}

	return nil
}

// LoadPredefinedPuzzles loads the predefined puzzles into the store
func (s *PuzzleStore) LoadPredefinedPuzzles() error {
	// Define circuit puzzle solutions
	circuit1Solution := CircuitSolution{
		Connections: []Connection{
			{From: "battery", To: "switch"},
			{From: "switch", To: "led"},
			{From: "led", To: "resistor"},
			{From: "resistor", To: "battery"},
		},
		PowerState: []PowerState{
			{ComponentID: "battery", Powered: true},
			{ComponentID: "switch", Powered: true},
			{ComponentID: "led", Powered: true},
			{ComponentID: "resistor", Powered: true},
		},
	}
	circuit1SolutionJSON, err := json.Marshal(circuit1Solution)
	if err != nil {
		return fmt.Errorf("failed to marshal circuit1 solution: %v", err)
	}

	// Define logic puzzle solutions
	logic1Solution := LogicSolution{
		Values: map[string]bool{
			"A": true,
			"B": true,
			"C": false,
		},
	}
	logic1SolutionJSON, err := json.Marshal(logic1Solution)
	if err != nil {
		return fmt.Errorf("failed to marshal logic1 solution: %v", err)
	}

	// Define maze puzzle solutions
	maze1Solution := MazeSolution{
		Path: []Position{
			{X: 0, Y: 0},
			{X: 0, Y: 1},
			{X: 0, Y: 2},
			{X: 1, Y: 2},
			{X: 2, Y: 2},
			{X: 2, Y: 3},
			{X: 3, Y: 3},
			{X: 3, Y: 4},
			{X: 4, Y: 4},
			{X: 5, Y: 4},
			{X: 5, Y: 5},
		},
	}
	maze1SolutionJSON, err := json.Marshal(maze1Solution)
	if err != nil {
		return fmt.Errorf("failed to marshal maze1 solution: %v", err)
	}

	// Define pattern puzzle solutions
	pattern1Solution := PatternSolution{
		Sequence: []int{1, 3, 5, 7, 9},
	}
	pattern1SolutionJSON, err := json.Marshal(pattern1Solution)
	if err != nil {
		return fmt.Errorf("failed to marshal pattern1 solution: %v", err)
	}

	// Add puzzles to the store
	s.puzzles["circuit1"] = Puzzle{
		ID:          "circuit1",
		Type:        TypeCircuit,
		Name:        "Simple LED Circuit",
		Description: "Create a circuit that powers an LED with a battery, switch, and resistor",
		Difficulty:  "Easy",
		Solution:    circuit1SolutionJSON,
	}

	s.puzzles["logic1"] = Puzzle{
		ID:          "logic1",
		Type:        TypeLogic,
		Name:        "Basic Logic Gates",
		Description: "Set the values of A, B, and C to satisfy the condition: (A AND B) AND (NOT C)",
		Difficulty:  "Easy",
		Solution:    logic1SolutionJSON,
	}

	s.puzzles["maze1"] = Puzzle{
		ID:          "maze1",
		Type:        TypeMaze,
		Name:        "Simple Maze",
		Description: "Find a path from the start (0,0) to the end (5,5)",
		Difficulty:  "Medium",
		Solution:    maze1SolutionJSON,
	}

	s.puzzles["pattern1"] = Puzzle{
		ID:          "pattern1",
		Type:        TypePattern,
		Name:        "Number Sequence",
		Description: "Identify the next numbers in the sequence: 1, 3, 5, 7, ...",
		Difficulty:  "Easy",
		Solution:    pattern1SolutionJSON,
	}

	return nil
}

// GetPuzzle gets a puzzle by ID
func (s *PuzzleStore) GetPuzzle(id string) (Puzzle, bool) {
	puzzle, ok := s.puzzles[id]
	return puzzle, ok
}

// GetAllPuzzles gets all puzzles
func (s *PuzzleStore) GetAllPuzzles() []Puzzle {
	puzzles := make([]Puzzle, 0, len(s.puzzles))
	for _, puzzle := range s.puzzles {
		puzzles = append(puzzles, puzzle)
	}
	return puzzles
}

// VerifyPuzzleSolution verifies a puzzle solution against the stored solution
func (s *PuzzleStore) VerifyPuzzleSolution(solution PuzzleSolution) PuzzleVerificationResult {
	result := PuzzleVerificationResult{
		PuzzleID: solution.PuzzleID,
		Valid:    false,
	}

	// Get the puzzle
	puzzle, ok := s.GetPuzzle(solution.PuzzleID)
	if !ok {
		result.Message = fmt.Sprintf("Unknown puzzle ID: %s", solution.PuzzleID)
		return result
	}

	// Verify the solution based on the puzzle type
	switch puzzle.Type {
	case TypeCircuit:
		return s.verifyCircuitSolution(puzzle, solution)
	case TypeLogic:
		return s.verifyLogicSolution(puzzle, solution)
	case TypeMaze:
		return s.verifyMazeSolution(puzzle, solution)
	case TypePattern:
		return s.verifyPatternSolution(puzzle, solution)
	default:
		result.Message = fmt.Sprintf("Unknown puzzle type: %s", puzzle.Type)
		return result
	}
}

// verifyCircuitSolution verifies a circuit puzzle solution
func (s *PuzzleStore) verifyCircuitSolution(puzzle Puzzle, solution PuzzleSolution) PuzzleVerificationResult {
	result := PuzzleVerificationResult{
		PuzzleID: solution.PuzzleID,
		Valid:    false,
	}

	var submittedSolution CircuitSolution
	if err := json.Unmarshal(solution.Solution, &submittedSolution); err != nil {
		result.Message = fmt.Sprintf("Invalid circuit solution format: %v", err)
		return result
	}

	var correctSolution CircuitSolution
	if err := json.Unmarshal(puzzle.Solution, &correctSolution); err != nil {
		result.Message = fmt.Sprintf("Failed to parse stored solution: %v", err)
		return result
	}

	// Verify connections
	if !verifyConnections(submittedSolution.Connections, correctSolution.Connections) {
		result.Message = "Circuit connections are incorrect"
		return result
	}

	// Verify power states
	if !verifyPowerStates(submittedSolution.PowerState, correctSolution.PowerState) {
		result.Message = "Circuit power states are incorrect"
		return result
	}

	result.Valid = true
	result.Message = "Circuit solution is correct"
	return result
}

// verifyConnections verifies that the submitted connections match the correct ones
func verifyConnections(submitted, correct []Connection) bool {
	if len(submitted) != len(correct) {
		return false
	}

	// Create maps for easier comparison
	submittedMap := make(map[string]string)
	correctMap := make(map[string]string)

	for _, conn := range submitted {
		// Normalize the connection direction
		if conn.From > conn.To {
			conn.From, conn.To = conn.To, conn.From
		}
		key := conn.From + "-" + conn.To
		submittedMap[key] = key
	}

	for _, conn := range correct {
		// Normalize the connection direction
		if conn.From > conn.To {
			conn.From, conn.To = conn.To, conn.From
		}
		key := conn.From + "-" + conn.To
		correctMap[key] = key
	}

	// Check if all correct connections are in the submitted solution
	for key := range correctMap {
		if _, ok := submittedMap[key]; !ok {
			return false
		}
	}

	// Check if all submitted connections are in the correct solution
	for key := range submittedMap {
		if _, ok := correctMap[key]; !ok {
			return false
		}
	}

	return true
}

// verifyPowerStates verifies that the submitted power states match the correct ones
func verifyPowerStates(submitted, correct []PowerState) bool {
	if len(submitted) != len(correct) {
		return false
	}

	// Create maps for easier comparison
	submittedMap := make(map[string]bool)
	correctMap := make(map[string]bool)

	for _, state := range submitted {
		submittedMap[state.ComponentID] = state.Powered
	}

	for _, state := range correct {
		correctMap[state.ComponentID] = state.Powered
	}

	// Check if all component power states match
	for id, powered := range correctMap {
		if submittedPowered, ok := submittedMap[id]; !ok || submittedPowered != powered {
			return false
		}
	}

	return true
}

// verifyLogicSolution verifies a logic puzzle solution
func (s *PuzzleStore) verifyLogicSolution(puzzle Puzzle, solution PuzzleSolution) PuzzleVerificationResult {
	result := PuzzleVerificationResult{
		PuzzleID: solution.PuzzleID,
		Valid:    false,
	}

	var submittedSolution LogicSolution
	if err := json.Unmarshal(solution.Solution, &submittedSolution); err != nil {
		result.Message = fmt.Sprintf("Invalid logic solution format: %v", err)
		return result
	}

	var correctSolution LogicSolution
	if err := json.Unmarshal(puzzle.Solution, &correctSolution); err != nil {
		result.Message = fmt.Sprintf("Failed to parse stored solution: %v", err)
		return result
	}

	// Check if all values match
	for key, value := range correctSolution.Values {
		submittedValue, ok := submittedSolution.Values[key]
		if !ok || submittedValue != value {
			result.Message = fmt.Sprintf("Logic value for '%s' is incorrect", key)
			return result
		}
	}

	result.Valid = true
	result.Message = "Logic solution is correct"
	return result
}

// verifyMazeSolution verifies a maze puzzle solution
func (s *PuzzleStore) verifyMazeSolution(puzzle Puzzle, solution PuzzleSolution) PuzzleVerificationResult {
	result := PuzzleVerificationResult{
		PuzzleID: solution.PuzzleID,
		Valid:    false,
	}

	var submittedSolution MazeSolution
	if err := json.Unmarshal(solution.Solution, &submittedSolution); err != nil {
		result.Message = fmt.Sprintf("Invalid maze solution format: %v", err)
		return result
	}

	var correctSolution MazeSolution
	if err := json.Unmarshal(puzzle.Solution, &correctSolution); err != nil {
		result.Message = fmt.Sprintf("Failed to parse stored solution: %v", err)
		return result
	}

	// Check if path starts and ends at the correct positions
	if len(submittedSolution.Path) < 2 {
		result.Message = "Path is too short"
		return result
	}

	start := submittedSolution.Path[0]
	end := submittedSolution.Path[len(submittedSolution.Path)-1]
	correctStart := correctSolution.Path[0]
	correctEnd := correctSolution.Path[len(correctSolution.Path)-1]

	if start.X != correctStart.X || start.Y != correctStart.Y {
		result.Message = fmt.Sprintf("Path must start at (%d,%d)", correctStart.X, correctStart.Y)
		return result
	}

	if end.X != correctEnd.X || end.Y != correctEnd.Y {
		result.Message = fmt.Sprintf("Path must end at (%d,%d)", correctEnd.X, correctEnd.Y)
		return result
	}

	// Check if the path is continuous (each step is adjacent)
	for i := 1; i < len(submittedSolution.Path); i++ {
		prev := submittedSolution.Path[i-1]
		curr := submittedSolution.Path[i]

		// Check if the current position is adjacent to the previous one
		dx := abs(curr.X - prev.X)
		dy := abs(curr.Y - prev.Y)

		if (dx == 1 && dy == 0) || (dx == 0 && dy == 1) {
			// Valid step
		} else {
			result.Message = fmt.Sprintf("Invalid step at position %d", i)
			return result
		}
	}

	// The path is valid if it starts and ends at the correct positions and is continuous
	result.Valid = true
	result.Message = "Maze solution is correct"
	return result
}

// verifyPatternSolution verifies a pattern puzzle solution
func (s *PuzzleStore) verifyPatternSolution(puzzle Puzzle, solution PuzzleSolution) PuzzleVerificationResult {
	result := PuzzleVerificationResult{
		PuzzleID: solution.PuzzleID,
		Valid:    false,
	}

	var submittedSolution PatternSolution
	if err := json.Unmarshal(solution.Solution, &submittedSolution); err != nil {
		result.Message = fmt.Sprintf("Invalid pattern solution format: %v", err)
		return result
	}

	var correctSolution PatternSolution
	if err := json.Unmarshal(puzzle.Solution, &correctSolution); err != nil {
		result.Message = fmt.Sprintf("Failed to parse stored solution: %v", err)
		return result
	}

	// Check if the sequences match
	if len(submittedSolution.Sequence) != len(correctSolution.Sequence) {
		result.Message = "Sequence has incorrect length"
		return result
	}

	for i, v := range correctSolution.Sequence {
		if submittedSolution.Sequence[i] != v {
			result.Message = "Sequence does not match the expected pattern"
			return result
		}
	}

	result.Valid = true
	result.Message = "Pattern solution is correct"
	return result
}
