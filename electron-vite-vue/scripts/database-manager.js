/**
 * Database Manager for Development Mode
 * 
 * This is a JavaScript version of the database manager that can be used
 * in development mode without requiring TypeScript compilation.
 */

import { createRequire } from 'module';
import path from 'path';
import fs from 'fs';
import http from 'http';
import { fileURLToPath } from 'url';

// Use CommonJS require for better-sqlite3 to ensure compatibility with Electron
const require = createRequire(import.meta.url);
const Database = require('better-sqlite3');
const { Server: WebSocketServer } = require('socket.io');

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const appDir = path.resolve(__dirname, '..');

export class DatabaseManager {
  constructor(port = 3334) {
    this.port = port;
    
    // Initialize the database
    const userDataPath = path.join(appDir, 'dev-data');
    const dbPath = path.join(userDataPath, 'jemulator.db');
    
    console.log(`Database path: ${dbPath}`);
    
    // Ensure the directory exists
    fs.mkdirSync(path.dirname(dbPath), { recursive: true });
    
    // Initialize the database
    this.db = new Database(dbPath);
    
    // Initialize the WebSocket server
    this.httpServer = http.createServer();
    this.io = new WebSocketServer(this.httpServer, {
      cors: {
        origin: "*",
        methods: ["GET", "POST"]
      }
    });
    
    // Initialize the database schema
    this.initializeSchema();
    
    // Set up WebSocket event handlers
    this.setupWebSocketHandlers();
  }
  
  /**
   * Initialize the database schema
   */
  initializeSchema() {
    // Create users table
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
    const userCount = this.db.prepare('SELECT COUNT(*) as count FROM users').get();
    
    if (userCount.count === 0) {
      console.log('Inserting sample data...');
      
      // Insert sample user
      const userInsert = this.db.prepare(
        'INSERT INTO users (name, email) VALUES (?, ?)'
      );
      const userResult = userInsert.run('Sample User', 'user@example.com');
      const userId = userResult.lastInsertRowid;
      
      // Insert sample project
      const projectInsert = this.db.prepare(
        'INSERT INTO projects (name, description, user_id) VALUES (?, ?, ?)'
      );
      const projectResult = projectInsert.run('Sample Project', 'A sample project for testing', userId);
      const projectId = projectResult.lastInsertRowid;
      
      // Insert sample components
      const componentInsert = this.db.prepare(
        'INSERT INTO components (project_id, type, properties, position_x, position_y) VALUES (?, ?, ?, ?, ?)'
      );
      
      componentInsert.run(projectId, 'battery', JSON.stringify({ voltage: 12 }), 100, 100);
      componentInsert.run(projectId, 'motor', JSON.stringify({ speed: 50 }), 200, 200);
      componentInsert.run(projectId, 'led', JSON.stringify({ color: 'red', isOn: false }), 300, 300);
      
      console.log('Sample data inserted successfully');
    }
  }
  
  /**
   * Set up WebSocket event handlers
   */
  setupWebSocketHandlers() {
    this.io.on('connection', (socket) => {
      console.log(`Client connected: ${socket.id}`);
      
      // Handle database operations
      socket.on('db:operation', (operation, callback) => {
        console.log(`Received operation: ${JSON.stringify(operation)}`);
        
        try {
          let result;
          
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
              throw new Error(`Unknown operation type: ${operation.type}`);
          }
          
          const response = {
            success: true,
            data: result,
            requestId: operation.requestId
          };
          
          // Send the response back to the client
          if (callback && typeof callback === 'function') {
            callback(response);
          } else {
            socket.emit('db:response', response);
          }
          
          // Broadcast changes to all connected clients
          if (operation.type === 'query' || operation.type === 'exec') {
            socket.broadcast.emit('db:change', {
              operation,
              timestamp: Date.now()
            });
          }
        } catch (error) {
          console.error('Database operation error:', error);
          
          const response = {
            success: false,
            error: error instanceof Error ? error.message : String(error),
            requestId: operation.requestId
          };
          
          if (callback && typeof callback === 'function') {
            callback(response);
          } else {
            socket.emit('db:response', response);
          }
        }
      });
      
      // Handle disconnection
      socket.on('disconnect', () => {
        console.log(`Client disconnected: ${socket.id}`);
      });
    });
  }
  
  /**
   * Start the WebSocket server
   */
  start() {
    return new Promise((resolve, reject) => {
      this.httpServer.listen(this.port, () => {
        console.log(`Database WebSocket server running on port ${this.port}`);
        resolve(this.port);
      });
      
      this.httpServer.on('error', (err) => {
        reject(err);
      });
    });
  }
  
  /**
   * Stop the WebSocket server
   */
  stop() {
    return new Promise((resolve, reject) => {
      this.io.close((err) => {
        if (err) {
          reject(err);
          return;
        }
        
        this.httpServer.close((err) => {
          if (err) {
            reject(err);
            return;
          }
          
          console.log('Database WebSocket server stopped');
          resolve();
        });
      });
    });
  }
  
  /**
   * Get the WebSocket server URL
   */
  getUrl() {
    return `ws://localhost:${this.port}`;
  }
  
  /**
   * Close the database connection
   */
  close() {
    this.db.close();
  }
}
