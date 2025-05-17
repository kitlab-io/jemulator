/**
 * WebSocket Client for connecting to the Electron main process
 * 
 * This module provides a WebSocket client that allows renderer processes
 * and external web apps to connect to the database and receive real-time updates.
 */

// Define message types
export type WebSocketMessage = {
  type: string;
  payload?: any;
  requestId?: string;
};

// Define database operation types
export type DbOperation = 
  | { type: 'query'; sql: string; params?: any[]; requestId?: string }
  | { type: 'exec'; sql: string; params?: any[]; requestId?: string }
  | { type: 'get'; sql: string; params?: any[]; requestId?: string }
  | { type: 'all'; sql: string; params?: any[]; requestId?: string };

export class WebSocketClient {
  private ws: WebSocket | null = null;
  private url: string;
  private appType: string;
  private clientId: string | null = null;
  private connected: boolean = false;
  private reconnectInterval: number = 3000; // 3 seconds
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 10;
  private messageHandlers: Map<string, ((message: WebSocketMessage) => void)[]> = new Map();
  private pendingRequests: Map<string, { resolve: Function, reject: Function }> = new Map();
  private requestIdCounter: number = 0;
  
  /**
   * Create a new WebSocket client
   * @param url WebSocket server URL (default: ws://localhost:8080)
   * @param appType Type of app connecting (e.g., 'vue', 'react', 'needle', 'threlte')
   */
  constructor(url: string = 'ws://localhost:8080', appType: string = 'unknown') {
    this.url = url;
    this.appType = appType;
    
    // Register default message handlers
    this.registerHandler('connection', this.handleConnectionMessage.bind(this));
    this.registerHandler('error', this.handleErrorMessage.bind(this));
    this.registerHandler('db:result', this.handleDbResultMessage.bind(this));
  }
  
  /**
   * Connect to the WebSocket server
   * @returns Promise that resolves when connected
   */
  public connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.connected) {
        resolve();
        return;
      }
      
      try {
        console.log(`Connecting to WebSocket server at ${this.url}...`);
        this.ws = new WebSocket(this.url);
        
        this.ws.onopen = () => {
          console.log('WebSocket connection established');
          this.connected = true;
          this.reconnectAttempts = 0;
          
          // Register with the server
          this.register().then(() => {
            resolve();
          }).catch(reject);
        };
        
        this.ws.onmessage = (event) => {
          try {
            const message: WebSocketMessage = JSON.parse(event.data);
            this.handleMessage(message);
          } catch (error) {
            console.error('Error parsing WebSocket message:', error);
          }
        };
        
        this.ws.onclose = () => {
          console.log('WebSocket connection closed');
          this.connected = false;
          this.clientId = null;
          
          // Attempt to reconnect
          this.attemptReconnect();
        };
        
        this.ws.onerror = (error) => {
          console.error('WebSocket error:', error);
          reject(error);
        };
      } catch (error) {
        console.error('Failed to connect to WebSocket server:', error);
        reject(error);
        
        // Attempt to reconnect
        this.attemptReconnect();
      }
    });
  }
  
  /**
   * Attempt to reconnect to the WebSocket server
   */
  private attemptReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error(`Maximum reconnect attempts (${this.maxReconnectAttempts}) reached`);
      return;
    }
    
    this.reconnectAttempts++;
    
    console.log(`Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);
    
    setTimeout(() => {
      this.connect().catch((error) => {
        console.error('Reconnect failed:', error);
      });
    }, this.reconnectInterval);
  }
  
  /**
   * Register with the WebSocket server
   * @returns Promise that resolves when registered
   */
  private register(): Promise<void> {
    return new Promise((resolve, reject) => {
      const requestId = this.generateRequestId();
      
      const timeoutId = setTimeout(() => {
        if (this.pendingRequests.has(requestId)) {
          this.pendingRequests.delete(requestId);
          reject(new Error('Registration timed out'));
        }
      }, 5000);
      
      this.pendingRequests.set(requestId, {
        resolve: () => {
          clearTimeout(timeoutId);
          resolve();
        },
        reject: (error: Error) => {
          clearTimeout(timeoutId);
          reject(error);
        }
      });
      
      this.send({
        type: 'register',
        payload: {
          appType: this.appType
        },
        requestId
      });
    });
  }
  
  /**
   * Handle a message from the server
   * @param message Message from server
   */
  private handleMessage(message: WebSocketMessage): void {
    console.log(`Received message: ${JSON.stringify(message)}`);
    
    // Check if this is a response to a pending request
    if (message.requestId && this.pendingRequests.has(message.requestId)) {
      const { resolve, reject } = this.pendingRequests.get(message.requestId)!;
      
      if (message.type === 'error') {
        reject(new Error(message.payload.message || 'Unknown error'));
      } else {
        resolve(message.payload);
      }
      
      this.pendingRequests.delete(message.requestId);
      return;
    }
    
    // Call registered handlers for this message type
    const handlers = this.messageHandlers.get(message.type) || [];
    
    for (const handler of handlers) {
      try {
        handler(message);
      } catch (error) {
        console.error(`Error in message handler for ${message.type}:`, error);
      }
    }
  }
  
  /**
   * Handle a connection message from the server
   * @param message Connection message
   */
  private handleConnectionMessage(message: WebSocketMessage): void {
    if (message.payload && message.payload.clientId) {
      this.clientId = message.payload.clientId;
      console.log(`Assigned client ID: ${this.clientId}`);
    }
  }
  
  /**
   * Handle an error message from the server
   * @param message Error message
   */
  private handleErrorMessage(message: WebSocketMessage): void {
    console.error('Server error:', message.payload);
  }
  
  /**
   * Handle a database result message from the server
   * @param message Database result message
   */
  private handleDbResultMessage(message: WebSocketMessage): void {
    console.log('Database result:', message.payload);
  }
  
  /**
   * Send a message to the server
   * @param message Message to send
   */
  public send(message: WebSocketMessage): void {
    if (!this.connected || !this.ws) {
      console.error('Cannot send message: not connected');
      return;
    }
    
    this.ws.send(JSON.stringify(message));
  }
  
  /**
   * Execute a database operation
   * @param operation Database operation to execute
   * @returns Promise that resolves with the operation result
   */
  public executeDbOperation(operation: DbOperation): Promise<any> {
    return new Promise((resolve, reject) => {
      if (!this.connected) {
        reject(new Error('Not connected to WebSocket server'));
        return;
      }
      
      const requestId = this.generateRequestId();
      
      const timeoutId = setTimeout(() => {
        if (this.pendingRequests.has(requestId)) {
          this.pendingRequests.delete(requestId);
          reject(new Error('Database operation timed out'));
        }
      }, 10000);
      
      this.pendingRequests.set(requestId, {
        resolve: (result: any) => {
          clearTimeout(timeoutId);
          resolve(result);
        },
        reject: (error: Error) => {
          clearTimeout(timeoutId);
          reject(error);
        }
      });
      
      this.send({
        type: 'db:operation',
        payload: {
          ...operation,
          requestId
        },
        requestId
      });
    });
  }
  
  /**
   * Register a message handler
   * @param type Message type to handle
   * @param handler Handler function
   */
  public registerHandler(type: string, handler: (message: WebSocketMessage) => void): void {
    if (!this.messageHandlers.has(type)) {
      this.messageHandlers.set(type, []);
    }
    
    this.messageHandlers.get(type)!.push(handler);
  }
  
  /**
   * Unregister a message handler
   * @param type Message type
   * @param handler Handler function to remove
   */
  public unregisterHandler(type: string, handler: (message: WebSocketMessage) => void): void {
    if (!this.messageHandlers.has(type)) {
      return;
    }
    
    const handlers = this.messageHandlers.get(type)!;
    const index = handlers.indexOf(handler);
    
    if (index !== -1) {
      handlers.splice(index, 1);
    }
  }
  
  /**
   * Generate a unique request ID
   * @returns Unique request ID
   */
  private generateRequestId(): string {
    return `req_${Date.now()}_${++this.requestIdCounter}`;
  }
  
  /**
   * Disconnect from the WebSocket server
   */
  public disconnect(): void {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
      this.connected = false;
      this.clientId = null;
    }
  }
  
  /**
   * Check if connected to the WebSocket server
   * @returns True if connected
   */
  public isConnected(): boolean {
    return this.connected;
  }
  
  /**
   * Get the client ID
   * @returns Client ID
   */
  public getClientId(): string | null {
    return this.clientId;
  }
  
  /**
   * Get a list of connected clients
   * @returns Promise that resolves with the client list
   */
  public getConnectedClients(): Promise<any[]> {
    return new Promise((resolve, reject) => {
      if (!this.connected) {
        reject(new Error('Not connected to WebSocket server'));
        return;
      }
      
      const requestId = this.generateRequestId();
      
      const timeoutId = setTimeout(() => {
        if (this.pendingRequests.has(requestId)) {
          this.pendingRequests.delete(requestId);
          reject(new Error('Get clients operation timed out'));
        }
      }, 5000);
      
      this.pendingRequests.set(requestId, {
        resolve: (result: any) => {
          clearTimeout(timeoutId);
          resolve(result.clients || []);
        },
        reject: (error: Error) => {
          clearTimeout(timeoutId);
          reject(error);
        }
      });
      
      this.send({
        type: 'get-clients',
        requestId
      });
    });
  }
  
  /**
   * Ping the server to check connection
   * @returns Promise that resolves with the round-trip time in milliseconds
   */
  public ping(): Promise<number> {
    return new Promise((resolve, reject) => {
      if (!this.connected) {
        reject(new Error('Not connected to WebSocket server'));
        return;
      }
      
      const requestId = this.generateRequestId();
      const startTime = Date.now();
      
      const timeoutId = setTimeout(() => {
        if (this.pendingRequests.has(requestId)) {
          this.pendingRequests.delete(requestId);
          reject(new Error('Ping timed out'));
        }
      }, 5000);
      
      this.pendingRequests.set(requestId, {
        resolve: () => {
          clearTimeout(timeoutId);
          const endTime = Date.now();
          resolve(endTime - startTime);
        },
        reject: (error: Error) => {
          clearTimeout(timeoutId);
          reject(error);
        }
      });
      
      this.send({
        type: 'ping',
        requestId
      });
    });
  }
}
