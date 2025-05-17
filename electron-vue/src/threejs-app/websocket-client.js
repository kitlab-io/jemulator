/**
 * WebSocket client wrapper for Three.js app
 */
export class WebSocketClient {
  constructor() {
    this.connection = null;
    this.clientId = null;
    this.isConnected = false;
    this.eventListeners = {
      'connected': [],
      'disconnected': [],
      'message': [],
      'error': [],
      'db-changed': []
    };
  }

  /**
   * Connect to the WebSocket server
   */
  async connect() {
    try {
      this.connection = window.wsAPI.connect();
      
      this.connection.onOpen(() => {
        console.log('WebSocket connected');
        this.isConnected = true;
      });
      
      this.connection.onMessage((data) => {
        console.log('WebSocket message received:', data);
        
        if (data.type === 'connection') {
          this.clientId = data.clientId;
          this._triggerEvent('connected', this.clientId);
        } else if (data.type === 'db-changed') {
          this._triggerEvent('db-changed', data);
        } else {
          this._triggerEvent('message', data);
        }
      });
      
      this.connection.onClose(() => {
        console.log('WebSocket disconnected');
        this.isConnected = false;
        this.clientId = null;
        this._triggerEvent('disconnected');
        
        // Try to reconnect after a delay
        setTimeout(() => {
          this.connect();
        }, 3000);
      });
      
      this.connection.onError((err) => {
        console.error('WebSocket error:', err);
        this.isConnected = false;
        this._triggerEvent('error', err);
      });
      
      return true;
    } catch (err) {
      console.error('Failed to connect to WebSocket server:', err);
      this._triggerEvent('error', err);
      return false;
    }
  }
  
  /**
   * Register the renderer with the WebSocket server
   * @param {string} title - Window title
   * @param {string} type - Renderer type
   */
  register(title, type) {
    if (!this.isConnected) return false;
    
    this.connection.send({
      type: 'register',
      title,
      rendererType: type
    });
    
    return true;
  }
  
  /**
   * Send a message to the WebSocket server
   * @param {object} data - Message data
   */
  send(data) {
    if (!this.isConnected) return false;
    
    this.connection.send(data);
    return true;
  }
  
  /**
   * Close the WebSocket connection
   */
  close() {
    if (this.connection) {
      this.connection.close();
    }
  }
  
  /**
   * Add an event listener
   * @param {string} event - Event name
   * @param {function} callback - Callback function
   */
  on(event, callback) {
    if (this.eventListeners[event]) {
      this.eventListeners[event].push(callback);
    }
  }
  
  /**
   * Remove an event listener
   * @param {string} event - Event name
   * @param {function} callback - Callback function
   */
  off(event, callback) {
    if (this.eventListeners[event]) {
      this.eventListeners[event] = this.eventListeners[event].filter(
        cb => cb !== callback
      );
    }
  }
  
  /**
   * Trigger an event
   * @param {string} event - Event name
   * @param {any} data - Event data
   * @private
   */
  _triggerEvent(event, data) {
    if (this.eventListeners[event]) {
      for (const callback of this.eventListeners[event]) {
        callback(data);
      }
    }
  }
}
