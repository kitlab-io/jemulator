/**
 * SQLite Database Manager for Electron Main Process
 * 
 * This module handles database operations and provides an IPC interface
 * for renderer processes to interact with the database.
 */

import { createRequire } from 'module';
import path from 'path';
import fs from 'fs';

// Use CommonJS require for compatibility with Electron and native modules
const require = createRequire(import.meta.url);
const electron = require('electron');
const { app, ipcMain } = electron;
const Database = require('better-sqlite3');

// Define the database schema and operations
interface DbSchema {
  users: {
    id: number;
    name: string;
    email: string;
    created_at: string;
  };
  projects: {
    id: number;
    name: string;
    description: string;
    user_id: number;
    created_at: string;
  };
  components: {
    id: number;
    project_id: number;
    type: string;
    properties: string; // JSON string
    position_x: number;
    position_y: number;
    created_at: string;
  };
}

// Define the database operations
type DbOperation = 
  | { type: 'query'; sql: string; params?: any[]; requestId?: string }
  | { type: 'exec'; sql: string; params?: any[]; requestId?: string }
  | { type: 'get'; sql: string; params?: any[]; requestId?: string }
  | { type: 'all'; sql: string; params?: any[]; requestId?: string };

// Define the database response
type DbResponse = {
  success: boolean;
  data?: any;
  error?: string;
  requestId?: string;
};

export class DatabaseManager {
  private db: any; // Database instance
  private initialized: boolean = false;
  
  constructor() {
    // Initialize the database
    const userDataPath = app.getPath('userData');
    const dbPath = path.join(userDataPath, 'jemulator.db');
    
    console.log(`Database path: ${dbPath}`);
    
    // Ensure the directory exists
    fs.mkdirSync(path.dirname(dbPath), { recursive: true });
    
    try {
      // Initialize the database
      this.db = new Database(dbPath, { verbose: console.log });
      
      // Initialize the database schema
      this.initializeSchema();
      
      // Set up IPC event handlers
      this.setupIpcHandlers();
      
      this.initialized = true;
      console.log('Database initialized successfully');
    } catch (error) {
      console.error('Failed to initialize database:', error);
    }
  }
  
  /**
   * Initialize the database schema
   */
  private initializeSchema(): void {
    // Create the users table if it doesn't exist
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // Create projects table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS projects (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        description TEXT,
        user_id INTEGER NOT NULL,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id)
      )
    `);
    
    // Create components table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS components (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        project_id INTEGER NOT NULL,
        type TEXT NOT NULL,
        properties TEXT NOT NULL,
        position_x REAL NOT NULL,
        position_y REAL NOT NULL,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (project_id) REFERENCES projects (id)
      )
    `);
    
    // Insert sample data if tables are empty
    const userCount = this.db.prepare('SELECT COUNT(*) as count FROM users').get().count;
    
    if (userCount === 0) {
      console.log('Inserting sample data...');
      
      // Insert sample user
      const userId = this.db.prepare(
        'INSERT INTO users (name, email) VALUES (?, ?)'
      ).run('Sample User', 'user@example.com').lastInsertRowid;
      
      // Insert sample project
      const projectId = this.db.prepare(
        'INSERT INTO projects (name, description, user_id) VALUES (?, ?, ?)'
      ).run('Sample Project', 'A sample project for testing', userId).lastInsertRowid;
      
      // Insert sample components
      this.db.prepare(
        'INSERT INTO components (project_id, type, properties, position_x, position_y) VALUES (?, ?, ?, ?, ?)'
      ).run(projectId, 'battery', JSON.stringify({ voltage: 12 }), 100, 100);
      
      this.db.prepare(
        'INSERT INTO components (project_id, type, properties, position_x, position_y) VALUES (?, ?, ?, ?, ?)'
      ).run(projectId, 'motor', JSON.stringify({ speed: 50 }), 200, 200);
      
      this.db.prepare(
        'INSERT INTO components (project_id, type, properties, position_x, position_y) VALUES (?, ?, ?, ?, ?)'
      ).run(projectId, 'led', JSON.stringify({ color: 'red', isOn: false }), 300, 300);
      
      console.log('Sample data inserted successfully');
    }
  }
  
  /**
   * Set up IPC event handlers
   */
  private setupIpcHandlers(): void {
    // Handle database operations
    ipcMain.handle('db:operation', async (_event, operation: DbOperation) => {
      console.log(`Received operation: ${JSON.stringify(operation)}`);
      
      try {
        let result: any;
        
        switch (operation.type) {
          case 'query':
            result = this.db.prepare(operation.sql).run(...(operation.params || []));
            break;
          case 'exec':
            result = this.db.exec(operation.sql);
            break;
          case 'get':
            result = this.db.prepare(operation.sql).get(...(operation.params || []));
            break;
          case 'all':
            result = this.db.prepare(operation.sql).all(...(operation.params || []));
            break;
          default:
            throw new Error(`Unknown operation type: ${(operation as any).type}`);
        }
        
        const response: DbResponse = {
          success: true,
          data: result,
          requestId: operation.requestId
        };
        
        return response;
      } catch (error) {
        console.error('Database operation error:', error);
        
        const response: DbResponse = {
          success: false,
          error: error instanceof Error ? error.message : String(error),
          requestId: operation.requestId
        };
        
        return response;
      }
    });
    
    // Handle database changes
    ipcMain.on('db:change-notification', (event, operation) => {
      // Broadcast changes to all renderer processes
      const windows = electron.BrowserWindow.getAllWindows();
      
      for (const win of windows) {
        if (win.webContents !== event.sender) {
          win.webContents.send('db:change', {
            operation,
            timestamp: Date.now()
          });
        }
      }
    });
  }
  
  /**
   * Check if the database is initialized
   */
  public isInitialized(): boolean {
    return this.initialized;
  }
  
  /**
   * Close the database connection
   */
  public close(): void {
    if (this.db) {
      this.db.close();
    }
    
    // Remove IPC handlers
    ipcMain.removeHandler('db:operation');
    
    console.log('Database connection closed');
  }
}