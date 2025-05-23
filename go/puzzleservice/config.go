package main

import (
	"encoding/json"
	"fmt"
	"io/ioutil"
	"os"
	"path/filepath"
)

// ConfigPaths defines the paths for config and data files
type ConfigPaths struct {
	// PuzzlesDir is the directory containing puzzle JSON files
	PuzzlesDir string
	// PrivateConfigPath is the path to the private config file
	PrivateConfigPath string
}

// DefaultConfigPaths returns the default config paths
func DefaultConfigPaths() ConfigPaths {
	// Get user's home directory for storing private configs
	homeDir, err := os.UserHomeDir()
	if err != nil {
		// Fall back to current directory if home dir can't be determined
		homeDir = "."
	}

	return ConfigPaths{
		// Store puzzles in a .jemulator/puzzles directory in user's home
		PuzzlesDir: filepath.Join(homeDir, ".jemulator", "puzzles"),
		// Private config file
		PrivateConfigPath: filepath.Join(homeDir, ".jemulator", "config.json"),
	}
}

// EnsureConfigDirs ensures that all necessary config directories exist
func EnsureConfigDirs(paths ConfigPaths) error {
	// Create puzzles directory if it doesn't exist
	if err := os.MkdirAll(paths.PuzzlesDir, 0755); err != nil {
		return fmt.Errorf("failed to create puzzles directory: %v", err)
	}

	// Create parent directory for private config if it doesn't exist
	configDir := filepath.Dir(paths.PrivateConfigPath)
	if err := os.MkdirAll(configDir, 0755); err != nil {
		return fmt.Errorf("failed to create config directory: %v", err)
	}

	return nil
}

// PrivateConfig represents the private configuration
type PrivateConfig struct {
	// APIKeys for external services
	APIKeys map[string]string `json:"apiKeys"`
	// CustomPuzzlePaths defines additional paths to load puzzles from
	CustomPuzzlePaths []string `json:"customPuzzlePaths"`
	// DefaultPuzzleSet is the default set of puzzles to use
	DefaultPuzzleSet string `json:"defaultPuzzleSet"`
}

// LoadPrivateConfig loads the private configuration
func LoadPrivateConfig(path string) (PrivateConfig, error) {
	config := PrivateConfig{
		APIKeys:          make(map[string]string),
		CustomPuzzlePaths: []string{},
		DefaultPuzzleSet: "default",
	}

	// Check if the file exists
	if _, err := os.Stat(path); os.IsNotExist(err) {
		// Create default config file
		configJSON, err := json.MarshalIndent(config, "", "  ")
		if err != nil {
			return config, fmt.Errorf("failed to marshal default config: %v", err)
		}

		if err := ioutil.WriteFile(path, configJSON, 0600); err != nil {
			return config, fmt.Errorf("failed to write default config: %v", err)
		}

		return config, nil
	}

	// Read and parse the config file
	data, err := ioutil.ReadFile(path)
	if err != nil {
		return config, fmt.Errorf("failed to read config file: %v", err)
	}

	if err := json.Unmarshal(data, &config); err != nil {
		return config, fmt.Errorf("failed to parse config file: %v", err)
	}

	return config, nil
}
