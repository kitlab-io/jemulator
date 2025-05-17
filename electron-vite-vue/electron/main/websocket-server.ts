/**
 * WebSocket Server for Electron Main Process
 * 
 * This module provides a WebSocket server that allows renderer processes
 * and external web apps to connect to the database and receive real-time updates.
 */

import { createRequire } from 'module';
import { DatabaseManager } from './database';
import { EventEmitter } from 'events';

// Use CommonJS require for compatibility with Electron and native modules
const require = createRequire(import.meta.url);
const WebSocket = require('ws');

// Define message types
export type WebSocketMessage = {
  type: string;
  payload: any;
  requestId?: string;
};

export class WebSocketServer extends EventEmitter {
  private server: any; // WebSocket.Server
  private clients: Map<any, { id: string, type: string }> = new Map();
  private dbManager: DatabaseManager;
  private port: number;
  private clientIdCounter: number = 0;
  
  /**
   * Create a new WebSocket server
   * @param dbManager Database manager instance
   * @param port Port to listen on (default: 8080)
   */
  constructor(dbManager: DatabaseManager, port: number = 8080) {
    super();
    this.dbManager = dbManager;
    this.port = port;
  }
  
  /**
   * Start the WebSocket server
   * @returns Promise that resolves when the server is started
   */
  public start(): Promise<number> {
    return new Promise((resolve, reject) => {
      try {
        // Create WebSocket server
        this.server = new WebSocket.Server({ port: this.port });
        
        // Handle connection events
        this.server.on('connection', this.handleConnection.bind(this));
        
        // Handle server errors
        this.server.on('error', (error: Error) => {
          console.error('WebSocket server error:', error);
          this.emit('error', error);
        });
        
        console.log(`WebSocket server started on port ${this.port}`);
        resolve(this.port);
      } catch (error) {
        console.error('Failed to start WebSocket server:', error);
        reject(error);
      }
    });
  }
  
  /**
   * Handle a new WebSocket connection
   * @param ws WebSocket connection
   */
  private handleConnection(ws: any): void {
    // Generate a unique client ID
    const clientId = `client_${++this.clientIdCounter}`;
    
    // Add client to the map with a default type
    this.clients.set(ws, { id: clientId, type: 'unknown' });
    
    console.log(`New WebSocket connection: ${clientId}`);
    
    // Send welcome message
    this.sendToClient(ws, {
      type: 'connection',
      payload: {
        status: 'connected',
        clientId,
        timestamp: Date.now()
      }
    });
    
    // Handle messages from the client
    ws.on('message', (message: string) => {
      try {
        const parsedMessage: WebSocketMessage = JSON.parse(message);
        this.handleClientMessage(ws, parsedMessage);
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
        this.sendToClient(ws, {
          type: 'error',
          payload: {
            message: 'Invalid message format',
            error: error instanceof Error ? error.message : String(error)
          }
        });
      }
    });
    
    // Handle client disconnect
    ws.on('close', () => {
      const clientInfo = this.clients.get(ws);
      if (clientInfo) {
        console.log(`WebSocket client disconnected: ${clientInfo.id} (${clientInfo.type})`);
        this.clients.delete(ws);
        this.emit('client-disconnected', clientInfo);
      }
    });
  }
  
  /**
   * Handle a message from a client
   * @param ws WebSocket connection
   * @param message Parsed message from client
   */
  private async handleClientMessage(ws: any, message: WebSocketMessage): Promise<void> {
    console.log(`Received message from client: ${JSON.stringify(message)}`);
    
    const clientInfo = this.clients.get(ws);
    
    if (!clientInfo) {
      console.error('Client not found in client map');
      return;
    }
    
    // Handle different message types
    switch (message.type) {
      case 'register':
        // Client registration with app type
        if (message.payload && message.payload.appType) {
          const updatedClientInfo = {
            ...clientInfo,
            type: message.payload.appType
          };
          this.clients.set(ws, updatedClientInfo);
          
          console.log(`Client ${clientInfo.id} registered as ${message.payload.appType}`);
          
          this.sendToClient(ws, {
            type: 'register',
            payload: {
              status: 'registered',
              clientId: clientInfo.id,
              appType: message.payload.appType
            },
            requestId: message.requestId
          });
          
          // Notify all clients about the new connection
          this.broadcastClientList();
        }
        break;
        
      case 'db:operation':
        // Handle database operations
        if (!this.dbManager.isInitialized()) {
          this.sendToClient(ws, {
            type: 'error',
            payload: {
              message: 'Database not initialized'
            },
            requestId: message.requestId
          });
          return;
        }
        
        try {
          // Forward the operation to the database manager
          const result = await this.dbManager.executeOperation(message.payload);
          
          // Send the result back to the client
          this.sendToClient(ws, {
            type: 'db:result',
            payload: result,
            requestId: message.requestId
          });
          
          // Broadcast changes to all clients if this was a write operation
          if (['query', 'exec'].includes(message.payload.type)) {
            this.broadcastToAllExcept(ws, {
              type: 'db:change',
              payload: {
                operation: message.payload,
                result,
                source: clientInfo.id,
                timestamp: Date.now()
              }
            });
          }
        } catch (error) {
          console.error('Error executing database operation:', error);
          this.sendToClient(ws, {
            type: 'error',
            payload: {
              message: 'Database operation failed',
              error: error instanceof Error ? error.message : String(error)
            },
            requestId: message.requestId
          });
        }
        break;
        
      case 'get-clients':
        // Send list of connected clients
        this.sendToClient(ws, {
          type: 'client-list',
          payload: {
            clients: Array.from(this.clients.values())
          },
          requestId: message.requestId
        });
        break;
        
      case 'ping':
        // Simple ping-pong for connection testing
        this.sendToClient(ws, {
          type: 'pong',
          payload: {
            timestamp: Date.now()
          },
          requestId: message.requestId
        });
        break;
        
      default:
        console.log(`Unknown message type: ${message.type}`);
        this.sendToClient(ws, {
          type: 'error',
          payload: {
            message: `Unknown message type: ${message.type}`
          },
          requestId: message.requestId
        });
    }
  }
  
  /**
   * Send a message to a specific client
   * @param ws WebSocket connection
   * @param message Message to send
   */
  private sendToClient(ws: any, message: WebSocketMessage): void {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(message));
    }
  }
  
  /**
   * Broadcast a message to all connected clients
   * @param message Message to broadcast
   */
  public broadcast(message: WebSocketMessage): void {
    this.server.clients.forEach((client: any) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify(message));
      }
    });
  }
  
  /**
   * Broadcast a message to all clients except the specified one
   * @param excludeWs WebSocket connection to exclude
   * @param message Message to broadcast
   */
  private broadcastToAllExcept(excludeWs: any, message: WebSocketMessage): void {
    this.server.clients.forEach((client: any) => {
      if (client !== excludeWs && client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify(message));
      }
    });
  }
  
  /**
   * Broadcast the current client list to all connected clients
   */
  private broadcastClientList(): void {
    const clientList = Array.from(this.clients.values());
    
    this.broadcast({
      type: 'client-list-update',
      payload: {
        clients: clientList,
        timestamp: Date.now()
      }
    });
  }
  
  /**
   * Stop the WebSocket server
   * @returns Promise that resolves when the server is stopped
   */
  public stop(): Promise<void> {
    return new Promise((resolve) => {
      if (!this.server) {
        resolve();
        return;
      }
      
      this.server.close(() => {
        console.log('WebSocket server stopped');
        this.server = null;
        this.clients.clear();
        resolve();
      });
    });
  }
  
  /**
   * Get the port the server is listening on
   * @returns The port number
   */
  public getPort(): number {
    return this.port;
  }
}
