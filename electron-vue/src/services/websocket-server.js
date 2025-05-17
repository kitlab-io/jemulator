import WebSocket from 'ws';
import http from 'http';
import { v4 as uuidv4 } from 'uuid';
import databaseService from './database.js';

class WebSocketServer {
  constructor() {
    this.server = null;
    this.wss = null;
    this.clients = new Map(); // Map of client IDs to WebSocket connections
    this.handlers = new Map(); // Map of message types to handler functions
    this.port = 9876; // Different from the existing WebSocket server
  }

  async initialize() {
    if (this.server) return;

    // Create HTTP server
    this.server = http.createServer();
    
    // Initialize WebSocket server
    this.wss = new WebSocket.Server({ noServer: true });
    
    // Handle upgrade requests
    this.server.on('upgrade', (request, socket, head) => {
      this.wss.handleUpgrade(request, socket, head, (ws) => {
        this.wss.emit('connection', ws, request);
      });
    });

    // Handle WebSocket connections
    this.wss.on('connection', (ws) => {
      const clientId = uuidv4();
      this.clients.set(clientId, { ws, type: 'unknown', registered: false });
      
      console.log(`New WebSocket connection: ${clientId}`);
      
      // Send client ID to the client
      ws.send(JSON.stringify({
        type: 'connection',
        clientId,
        status: 'connected'
      }));
      
      ws.on('message', async (message) => {
        try {
          const data = JSON.parse(message.toString());
          await this.handleMessage(clientId, data);
        } catch (error) {
          console.error('Error handling WebSocket message:', error);
          this.sendError(clientId, 'Failed to process message', error.message);
        }
      });

      ws.on('close', () => {
        console.log(`WebSocket connection closed: ${clientId}`);
        this.clients.delete(clientId);
      });

      ws.on('error', (error) => {
        console.error(`WebSocket error for ${clientId}:`, error);
      });
    });

    // Register message handlers
    this.registerHandlers();

    // Start the server
    return new Promise((resolve, reject) => {
      this.server.listen(this.port, () => {
        console.log(`WebSocket server started on port ${this.port}`);
        resolve();
      });
      
      this.server.on('error', (error) => {
        console.error('WebSocket server error:', error);
        reject(error);
      });
    });
  }

  registerHandlers() {
    // Register renderer
    this.handlers.set('register', async (clientId, data) => {
      const { type, title } = data;
      const client = this.clients.get(clientId);
      
      if (!client) {
        throw new Error(`Client ${clientId} not found`);
      }
      
      // Update client info
      client.type = type;
      client.title = title;
      client.registered = true;
      
      // Register in database
      await databaseService.registerRenderer(clientId, type, title);
      
      // Notify client of successful registration
      this.send(clientId, {
        type: 'register',
        status: 'success',
        clientId,
        rendererType: type
      });
      
      // Broadcast new renderer to all clients
      this.broadcast({
        type: 'renderer-added',
        clientId,
        rendererType: type,
        title
      }, [clientId]); // Exclude the newly registered client
      
      console.log(`Renderer registered: ${clientId} (${type})`);
    });
    
    // Get all renderers
    this.handlers.set('get-renderers', async (clientId) => {
      const renderers = await databaseService.getRenderers();
      this.send(clientId, {
        type: 'renderers',
        renderers
      });
    });
    
    // Database operations
    this.handlers.set('db-get', async (clientId, data) => {
      const { namespace, key } = data;
      const value = await databaseService.getSharedData(namespace, key);
      this.send(clientId, {
        type: 'db-result',
        operation: 'get',
        namespace,
        key,
        value
      });
    });
    
    this.handlers.set('db-get-all', async (clientId, data) => {
      const { namespace } = data;
      const values = await databaseService.getAllSharedData(namespace);
      this.send(clientId, {
        type: 'db-result',
        operation: 'get-all',
        namespace,
        values
      });
    });
    
    this.handlers.set('db-set', async (clientId, data) => {
      const { namespace, key, value } = data;
      await databaseService.setSharedData(namespace, key, value, clientId);
      
      // Update client activity
      await databaseService.updateRendererActivity(clientId);
      
      // Broadcast change to all clients
      this.broadcast({
        type: 'db-changed',
        operation: 'set',
        namespace,
        key,
        value,
        source: clientId
      });
    });
    
    this.handlers.set('db-delete', async (clientId, data) => {
      const { namespace, key } = data;
      await databaseService.deleteSharedData(namespace, key);
      
      // Update client activity
      await databaseService.updateRendererActivity(clientId);
      
      // Broadcast change to all clients
      this.broadcast({
        type: 'db-changed',
        operation: 'delete',
        namespace,
        key,
        source: clientId
      });
    });
  }

  async handleMessage(clientId, data) {
    const { type } = data;
    
    // Check if handler exists for this message type
    if (!this.handlers.has(type)) {
      console.warn(`No handler for message type: ${type}`);
      this.sendError(clientId, 'Unknown message type', `No handler for ${type}`);
      return;
    }
    
    // Get handler and execute
    const handler = this.handlers.get(type);
    await handler(clientId, data);
  }

  send(clientId, data) {
    const client = this.clients.get(clientId);
    if (!client) {
      console.warn(`Cannot send message to unknown client: ${clientId}`);
      return false;
    }
    
    try {
      client.ws.send(JSON.stringify(data));
      return true;
    } catch (error) {
      console.error(`Error sending message to client ${clientId}:`, error);
      return false;
    }
  }

  sendError(clientId, message, details = null) {
    return this.send(clientId, {
      type: 'error',
      message,
      details
    });
  }

  broadcast(data, excludeIds = []) {
    let sentCount = 0;
    
    for (const [clientId, client] of this.clients.entries()) {
      // Skip excluded clients
      if (excludeIds.includes(clientId)) continue;
      
      // Skip unregistered clients
      if (!client.registered) continue;
      
      if (this.send(clientId, data)) {
        sentCount++;
      }
    }
    
    return sentCount;
  }

  shutdown() {
    if (this.wss) {
      // Close all client connections
      for (const client of this.clients.values()) {
        client.ws.close();
      }
      
      this.clients.clear();
      this.wss.close();
    }
    
    if (this.server) {
      this.server.close();
    }
    
    this.server = null;
    this.wss = null;
  }
}

// Create a singleton instance
const webSocketServer = new WebSocketServer();

export default webSocketServer;
