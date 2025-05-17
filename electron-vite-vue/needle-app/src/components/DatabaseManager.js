/**
 * Database Manager for Needle JS App
 * 
 * This module provides a simple interface to interact with the SQLite database
 * through Electron IPC.
 */

class DatabaseManager {
  constructor() {
    this.connected = false;
    this.requestId = 0;
    this.changeListeners = new Map();
    
    // Check if IPC is available
    this.isElectron = window.ipcRenderer !== undefined;
    
    if (!this.isElectron) {
      console.error('IPC is not available. Database operations will fail.');
      return;
    }
    
    // Set up event handlers
    window.ipcRenderer.on('db:change', (_event, data) => {
      console.log('Database change event:', data);
      
      // Notify all listeners of the change
      this._notifyListeners('change', data);
    });
    
    this.connected = true;
  }
  
  /**
   * Execute a database operation
   */
  async execute(operation) {
    if (!this.isElectron) {
      throw new Error('IPC is not available. Cannot execute database operation.');
    }
    
    const requestId = (this.requestId++).toString();
    const operationWithId = { ...operation, requestId };
    
    try {
      // Execute the operation via IPC
      const response = await window.ipcRenderer.invoke('db:operation', operationWithId);
      
      if (response.success) {
        // Notify about the change
        if (operation.type === 'query' || operation.type === 'exec') {
          window.ipcRenderer.send('db:change-notification', operation);
        }
        
        return response.data;
      } else {
        throw new Error(response.error || 'Unknown database error');
      }
    } catch (error) {
      console.error('Database operation error:', error);
      throw error;
    }
  }
  
  /**
   * Execute a SQL query
   */
  async query(sql, params = []) {
    return this.execute({ type: 'query', sql, params });
  }
  
  /**
   * Execute a SQL statement
   */
  async exec(sql) {
    return this.execute({ type: 'exec', sql });
  }
  
  /**
   * Get a single row from the database
   */
  async get(sql, params = []) {
    return this.execute({ type: 'get', sql, params });
  }
  
  /**
   * Get all rows from the database
   */
  async all(sql, params = []) {
    return this.execute({ type: 'all', sql, params });
  }
  
  /**
   * Add an event listener
   */
  addEventListener(event, callback) {
    if (!this.changeListeners.has(event)) {
      this.changeListeners.set(event, []);
    }
    
    this.changeListeners.get(event).push(callback);
    
    return () => this.removeEventListener(event, callback);
  }
  
  /**
   * Remove an event listener
   */
  removeEventListener(event, callback) {
    if (!this.changeListeners.has(event)) {
      return;
    }
    
    const listeners = this.changeListeners.get(event);
    const index = listeners.indexOf(callback);
    
    if (index !== -1) {
      listeners.splice(index, 1);
    }
  }
  
  /**
   * Notify all listeners of an event
   */
  _notifyListeners(event, data) {
    if (!this.changeListeners.has(event)) {
      return;
    }
    
    for (const listener of this.changeListeners.get(event)) {
      listener(data);
    }
  }
}

// Create a singleton instance
const dbManager = new DatabaseManager();

export default dbManager;