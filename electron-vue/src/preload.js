import { contextBridge, ipcRenderer } from 'electron';

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  // Renderer management
  createRenderer: (type, options) => ipcRenderer.invoke('create-renderer', type, options),
  getRenderers: () => ipcRenderer.invoke('get-renderers'),
  closeRenderer: (id) => ipcRenderer.invoke('close-renderer', id),
  
  // Database operations
  dbGet: (namespace, key) => ipcRenderer.invoke('db-get', namespace, key),
  dbGetAll: (namespace) => ipcRenderer.invoke('db-get-all', namespace),
  dbSet: (namespace, key, value) => ipcRenderer.invoke('db-set', namespace, key, value),
  dbDelete: (namespace, key) => ipcRenderer.invoke('db-delete', namespace, key),
  
  // System operations
  showErrorDialog: (title, message) => ipcRenderer.invoke('show-error-dialog', title, message),
  showMessageDialog: (options) => ipcRenderer.invoke('show-message-dialog', options),
  
  // Event listeners
  onDbChanged: (callback) => {
    const listener = (event, data) => callback(data);
    ipcRenderer.on('db-changed', listener);
    return () => ipcRenderer.removeListener('db-changed', listener);
  }
});

// WebSocket API for renderer processes
contextBridge.exposeInMainWorld('wsAPI', {
  // Connect to WebSocket server
  connect: () => {
    const ws = new WebSocket(`ws://localhost:9876`);
    
    return {
      // Send message to WebSocket server
      send: (data) => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify(data));
          return true;
        }
        return false;
      },
      
      // Register event listeners
      onOpen: (callback) => {
        ws.addEventListener('open', callback);
        return () => ws.removeEventListener('open', callback);
      },
      
      onMessage: (callback) => {
        const listener = (event) => {
          try {
            const data = JSON.parse(event.data);
            callback(data);
          } catch (error) {
            console.error('Failed to parse WebSocket message:', error);
          }
        };
        ws.addEventListener('message', listener);
        return () => ws.removeEventListener('message', listener);
      },
      
      onClose: (callback) => {
        ws.addEventListener('close', callback);
        return () => ws.removeEventListener('close', callback);
      },
      
      onError: (callback) => {
        ws.addEventListener('error', callback);
        return () => ws.removeEventListener('error', callback);
      },
      
      // Close connection
      close: () => {
        ws.close();
      }
    };
  }
});
