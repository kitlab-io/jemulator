import { exec } from 'child_process';
import { promisify } from 'util';
import * as path from 'path';
import * as fs from 'fs';
import { app } from 'electron';

const execAsync = promisify(exec);

/**
 * Interface for puzzle solution verification request
 */
export interface PuzzleSolution {
  puzzleId: string;
  type: 'circuit' | 'logic' | 'maze' | 'pattern';
  solution: any;
}

/**
 * Interface for puzzle verification result
 */
export interface VerificationResult {
  valid: boolean;
  message: string;
  details?: any;
}

/**
 * Interface for puzzle details
 */
export interface PuzzleDetails {
  id: string;
  type: string;
  name: string;
  description: string;
  difficulty: string;
}

/**
 * Class for interacting with the Go puzzle verification service
 */
export class PuzzleService {
  private executablePath: string;
  private configDir: string;

  /**
   * Initialize the puzzle service
   */
  constructor() {
    // Determine the executable path based on development or production environment
    if (app.isPackaged) {
      // In production, the executable is in the resources directory
      this.executablePath = path.join(process.resourcesPath, 'puzzleservice');
    } else {
      // In development, use the executable from the Go directory
      this.executablePath = path.join(app.getAppPath(), '..', 'go', 'puzzleservice', 'puzzleservice');
    }

    // Set up the config directory in the user's home directory
    this.configDir = path.join(app.getPath('userData'), 'puzzles');
    
    // Ensure the config directory exists
    if (!fs.existsSync(this.configDir)) {
      fs.mkdirSync(this.configDir, { recursive: true });
    }
  }

  /**
   * Verify a puzzle solution
   * @param solution The puzzle solution to verify
   * @returns Promise resolving to the verification result
   */
  async verifySolution(solution: PuzzleSolution): Promise<VerificationResult> {
    try {
      // Convert the solution to a JSON string
      const jsonStr = JSON.stringify(solution);
      
      // Execute the puzzle service with the JSON string as input
      const { stdout, stderr } = await execAsync(
        `"${this.executablePath}" --json '${jsonStr}' --config "${this.configDir}"`
      );
      
      if (stderr) {
        console.error('Puzzle service error:', stderr);
      }
      
      // Parse the result
      return JSON.parse(stdout);
    } catch (error) {
      console.error('Error verifying puzzle solution:', error);
      return {
        valid: false,
        message: `Error: ${error.message || 'Unknown error'}`
      };
    }
  }

  /**
   * List all available puzzles
   * @returns Promise resolving to an array of puzzle details
   */
  async listPuzzles(): Promise<PuzzleDetails[]> {
    try {
      const { stdout, stderr } = await execAsync(
        `"${this.executablePath}" --list --config "${this.configDir}"`
      );
      
      if (stderr) {
        console.error('Puzzle service error:', stderr);
      }
      
      // Parse the result
      return JSON.parse(stdout);
    } catch (error) {
      console.error('Error listing puzzles:', error);
      return [];
    }
  }

  /**
   * Get details for a specific puzzle
   * @param puzzleId The ID of the puzzle to get details for
   * @returns Promise resolving to the puzzle details
   */
  async getPuzzleDetails(puzzleId: string): Promise<PuzzleDetails | null> {
    try {
      const { stdout, stderr } = await execAsync(
        `"${this.executablePath}" --puzzle "${puzzleId}" --config "${this.configDir}"`
      );
      
      if (stderr) {
        console.error('Puzzle service error:', stderr);
      }
      
      // Parse the result
      return JSON.parse(stdout);
    } catch (error) {
      console.error(`Error getting details for puzzle ${puzzleId}:`, error);
      return null;
    }
  }

  /**
   * Export a puzzle to a JSON file
   * @param puzzleId The ID of the puzzle to export
   * @returns Promise resolving to a boolean indicating success
   */
  async exportPuzzle(puzzleId: string): Promise<boolean> {
    try {
      const { stdout, stderr } = await execAsync(
        `"${this.executablePath}" --export "${puzzleId}" --config "${this.configDir}"`
      );
      
      if (stderr) {
        console.error('Puzzle service error:', stderr);
      }
      
      return true;
    } catch (error) {
      console.error(`Error exporting puzzle ${puzzleId}:`, error);
      return false;
    }
  }
}
