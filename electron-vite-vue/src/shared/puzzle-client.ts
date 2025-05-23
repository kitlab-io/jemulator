/**
 * Client module for interacting with the Go puzzle verification service
 * through Electron's IPC
 */

// Import the required modules
import { ipcRenderer } from 'electron';

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
 * Class for interacting with the puzzle service from renderer processes
 */
export class PuzzleClient {
  /**
   * Verify a puzzle solution
   * @param solution The puzzle solution to verify
   * @returns Promise resolving to the verification result
   */
  async verifySolution(solution: PuzzleSolution): Promise<VerificationResult> {
    try {
      return await ipcRenderer.invoke('verify-puzzle-solution', solution);
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
      return await ipcRenderer.invoke('list-puzzles');
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
      return await ipcRenderer.invoke('get-puzzle-details', puzzleId);
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
      return await ipcRenderer.invoke('export-puzzle', puzzleId);
    } catch (error) {
      console.error(`Error exporting puzzle ${puzzleId}:`, error);
      return false;
    }
  }
}

// Export a singleton instance of the client
export const puzzleClient = new PuzzleClient();
