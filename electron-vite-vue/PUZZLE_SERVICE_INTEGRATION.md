# Puzzle Service Integration Guide

This guide explains how to integrate and use the Go puzzle verification service in the Electron application.

## Overview

The puzzle verification service is a Go CLI application that verifies puzzle solutions against predefined correct solutions. It has been integrated into the Electron app to provide puzzle verification capabilities to the renderer processes.

## Architecture

The integration consists of several components:

1. **Go Puzzle Service**: A standalone Go application that verifies puzzle solutions
2. **Main Process Module**: TypeScript module in the Electron main process that communicates with the Go executable
3. **IPC Bridge**: Preload script that exposes the puzzle service API to renderer processes
4. **Client Module**: TypeScript module in the renderer process for easy interaction with the puzzle service

## Building the Puzzle Service

The puzzle service needs to be built and included in the Electron app. This is handled by the `build:puzzle-service` script in `package.json`.

```bash
# Build only the puzzle service
npm run build:puzzle-service

# Build the entire app including the puzzle service
npm run build:with-all
```

## Using the Puzzle Service in Renderer Processes

### Option 1: Using the Exposed IPC Bridge

The puzzle service API is exposed to the renderer process through the preload script. You can access it directly in your Vue components:

```typescript
// In a Vue component
const verifySolution = async () => {
  const solution = {
    puzzleId: 'circuit_basic',
    type: 'circuit',
    solution: {
      connections: [
        { from: 'battery', to: 'switch' },
        { from: 'switch', to: 'led' },
        { from: 'led', to: 'resistor' },
        { from: 'resistor', to: 'battery' }
      ],
      powerState: [
        { componentId: 'battery', powered: true },
        { componentId: 'switch', powered: true },
        { componentId: 'led', powered: true },
        { componentId: 'resistor', powered: true }
      ]
    }
  };
  
  const result = await window.puzzleService.verifySolution(solution);
  console.log('Solution is', result.valid ? 'valid' : 'invalid');
  console.log('Message:', result.message);
};
```

### Option 2: Using the Client Module

For a more TypeScript-friendly approach, you can use the provided client module:

```typescript
// In a Vue component
import { puzzleClient } from '@/shared/puzzle-client';

const listAllPuzzles = async () => {
  const puzzles = await puzzleClient.listPuzzles();
  console.log('Available puzzles:', puzzles);
};

const getPuzzleDetails = async (puzzleId: string) => {
  const details = await puzzleClient.getPuzzleDetails(puzzleId);
  console.log('Puzzle details:', details);
};

const verifySolution = async (solution) => {
  const result = await puzzleClient.verifySolution(solution);
  console.log('Solution is', result.valid ? 'valid' : 'invalid');
};
```

## Available Puzzle Types

The service supports multiple puzzle types:

1. **Circuit Puzzles**: Verify electrical circuit connections and power states
2. **Logic Puzzles**: Verify logical expressions and truth values
3. **Maze Puzzles**: Verify path-finding solutions
4. **Pattern Puzzles**: Verify sequence pattern recognition

## Adding Custom Puzzles

Users can add custom puzzles by:

1. Exporting an existing puzzle:
   ```typescript
   await puzzleClient.exportPuzzle('circuit_basic');
   ```

2. Editing the exported JSON file in `~/.jemulator/puzzles/`

3. The custom puzzles will be automatically loaded when the app starts

## Development Workflow

When developing with the puzzle service:

1. Run `npm run build:puzzle-service` to build the Go service
2. Run `npm run dev:all` to start the development server
3. The puzzle service will be available to all renderer processes

## Troubleshooting

If you encounter issues with the puzzle service:

1. Check that the Go executable is properly built and copied to the resources directory
2. Verify that the puzzle service is initialized in the main process
3. Check the console for any error messages from the puzzle service
4. Ensure that the IPC handlers are properly registered in the main process

## Example: Complete Puzzle Verification Flow

```typescript
import { puzzleClient } from '@/shared/puzzle-client';

async function verifyCircuitPuzzle() {
  // 1. Get available puzzles
  const puzzles = await puzzleClient.listPuzzles();
  const circuitPuzzles = puzzles.filter(p => p.type === 'circuit');
  
  // 2. Get details for a specific puzzle
  const puzzleId = circuitPuzzles[0].id;
  const puzzleDetails = await puzzleClient.getPuzzleDetails(puzzleId);
  
  // 3. Create a solution based on user input
  const userSolution = {
    puzzleId,
    type: 'circuit',
    solution: {
      // User's solution data
      connections: [
        { from: 'battery', to: 'switch' },
        { from: 'switch', to: 'led' },
        { from: 'led', to: 'resistor' },
        { from: 'resistor', to: 'battery' }
      ],
      powerState: [
        { componentId: 'battery', powered: true },
        { componentId: 'switch', powered: true },
        { componentId: 'led', powered: true },
        { componentId: 'resistor', powered: true }
      ]
    }
  };
  
  // 4. Verify the solution
  const result = await puzzleClient.verifySolution(userSolution);
  
  // 5. Handle the result
  if (result.valid) {
    console.log('Congratulations! Your solution is correct.');
  } else {
    console.log('Sorry, your solution is incorrect:', result.message);
  }
}
```
