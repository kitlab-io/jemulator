/**
 * Database Client for Renderer Processes
 * 
 * This module provides an IPC client for renderer processes to interact with the database.
 * It can be shared across all renderer processes (Vue, React, Needle).
 */

// Use the contextBridge to access the ipcRenderer in renderer processes
const ipcRenderer = window.ipcRenderer;

// Define the database operations
type DbOperation = 
  | { type: 'query'; sql: string; params?: any[] }
  | { type: 'exec'; sql: string; params?: any[] }
  | { type: 'get'; sql: string; params?: any[] }
  | { type: 'all'; sql: string; params?: any[] };

// Define the database response
type DbResponse = {
  success: boolean;
  data?: any;
  error?: string;
  requestId?: string;
};

// Event types for change notifications
export type DbChangeEvent = {
  operation: DbOperation;
  timestamp: number;
};

export class DatabaseClient {
  private requestId: number = 0;
  private changeListeners: Map<string, ((event: DbChangeEvent) => void)[]> = new Map();
  
  constructor() {
    // Set up event handlers for database changes
    if (ipcRenderer) {
      ipcRenderer.on('db:change', (_event: any, data: DbChangeEvent) => {
        console.log('Database change event:', data);
        
        // Notify all change listeners
        for (const listeners of this.changeListeners.values()) {
          for (const listener of listeners) {
            listener(data);
          }
        }
      });
    } else {
      console.error('ipcRenderer is not available. Database client will not work.');
    }
  }
  
  /**
   * Check if IPC is available
   */
  public isAvailable(): boolean {
    return !!ipcRenderer;
  }
  
  /**
   * Execute a database operation
   */
  public async execute<T = any>(operation: DbOperation): Promise<T> {
    if (!this.isAvailable()) {
      throw new Error('IPC is not available. Cannot execute database operation.');
    }
    
    const requestId = (this.requestId++).toString();
    const operationWithId = { ...operation, requestId };
    
    try {
      // Use IPC to send the operation to the main process
      const response = await ipcRenderer.invoke('db:operation', operationWithId) as DbResponse;
      
      if (response.success) {
        // If this is a mutation operation, notify other windows
        if (operation.type === 'query' || operation.type === 'exec') {
          ipcRenderer.send('db:change-notification', operation);
        }
        
        return response.data as T;
      } else {
        throw new Error(response.error || 'Unknown error');
      }
    } catch (error) {
      console.error('Database operation error:', error);
      throw error;
    }
  }
  
  /**
   * Execute a SQL query
   */
  public async query(sql: string, params: any[] = []): Promise<any> {
    return this.execute({ type: 'query', sql, params });
  }
  
  /**
   * Execute a SQL statement
   */
  public async exec(sql: string): Promise<void> {
    return this.execute({ type: 'exec', sql });
  }
  
  /**
   * Get a single row from the database
   */
  public async get<T = any>(sql: string, params: any[] = []): Promise<T> {
    return this.execute<T>({ type: 'get', sql, params });
  }
  
  /**
   * Get all rows from the database
   */
  public async all<T = any>(sql: string, params: any[] = []): Promise<T[]> {
    return this.execute<T[]>({ type: 'all', sql, params });
  }
  
  /**
   * Add a change listener
   */
  public addChangeListener(id: string, listener: (event: DbChangeEvent) => void): void {
    if (!this.changeListeners.has(id)) {
      this.changeListeners.set(id, []);
    }
    
    this.changeListeners.get(id)!.push(listener);
  }
  
  /**
   * Remove a change listener
   */
  public removeChangeListener(id: string): void {
    this.changeListeners.delete(id);
  }
  
  /**
   * Initialize the database client
   * This is a no-op in the IPC implementation since there's no connection to establish
   */
  public async connect(): Promise<void> {
    if (!this.isAvailable()) {
      throw new Error('IPC is not available. Cannot connect to database.');
    }
    // No connection needed for IPC
    return Promise.resolve();
  }
  
  /**
   * Cleanup the database client
   * This is a no-op in the IPC implementation since there's no connection to close
   */
  public disconnect(): void {
    // No disconnection needed for IPC
  }
}

// Create a singleton instance
const dbClient = new DatabaseClient();

export default dbClient;
