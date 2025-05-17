/**
 * Database Client for Renderer Processes
 * 
 * This module provides a client interface for renderer processes to interact with
 * the SQLite database in the main process via WebSocket.
 */

import { WebSocketClient, DbOperation as WsDbOperation } from './websocket-client';

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

// Define the database change event
export interface DbChangeEvent {
  operation: DbOperation;
  result?: any;
  source?: string;
  timestamp: number;
}

/**
 * Database Client for Renderer Processes
 */
class DatabaseClient {
  private wsClient: WebSocketClient;
  private connected: boolean = false;
  private changeListeners: Map<string, ((event: DbChangeEvent) => void)[]> = new Map();
  
  constructor() {
    // Create WebSocket client
    this.wsClient = new WebSocketClient('ws://localhost:8080', 'vue');
    
    // Register handler for database changes
    this.wsClient.registerHandler('db:change', (message) => {
      console.log('Database change event:', message.payload);
      
      // Notify all listeners
      for (const [id, listeners] of this.changeListeners.entries()) {
        for (const listener of listeners) {
          listener(message.payload);
        }
      }
    });
  }
  
  /**
   * Connect to the database via WebSocket
   */
  public async connect(): Promise<void> {
    if (this.connected) {
      return;
    }
    
    try {
      await this.wsClient.connect();
      this.connected = true;
      console.log('Connected to database via WebSocket');
    } catch (error) {
      console.error('Failed to connect to database via WebSocket:', error);
      throw error;
    }
  }
  
  /**
   * Disconnect from the database
   */
  public disconnect(): void {
    if (!this.connected) {
      return;
    }
    
    this.wsClient.disconnect();
    this.connected = false;
    console.log('Disconnected from database');
  }
  
  /**
   * Check if connected to the database
   */
  public isConnected(): boolean {
    return this.connected;
  }
  
  /**
   * Execute a database operation
   */
  public async execute<T = any>(operation: DbOperation): Promise<T> {
    if (!this.connected) {
      throw new Error('Not connected to database. Call connect() first.');
    }
    
    try {
      // Convert to WebSocket DbOperation format
      const wsOperation: WsDbOperation = operation as WsDbOperation;
      
      // Execute the operation via WebSocket
      const result = await this.wsClient.executeDbOperation(wsOperation);
      
      if (result.success) {
        return result.data as T;
      } else {
        throw new Error(result.error || 'Unknown database error');
      }
    } catch (error) {
      console.error('Database operation failed:', error);
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
