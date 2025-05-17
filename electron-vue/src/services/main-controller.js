import { app, ipcMain, dialog } from 'electron';
import databaseService from './database.js';
import webSocketServer from './websocket-server.js';
import rendererManager from './renderer-manager.js';

class MainController {
  constructor() {
    this.initialized = false;
  }

  async initialize() {
    if (this.initialized) return;

    try {
      // Initialize services
      await databaseService.initialize();
      await webSocketServer.initialize();
      await rendererManager.initialize();

      // Register IPC handlers
      this.registerIpcHandlers();

      this.initialized = true;
      console.log('Main controller initialized');
    } catch (error) {
      console.error('Failed to initialize main controller:', error);
      throw error;
    }
  }

  registerIpcHandlers() {
    // Renderer management
    ipcMain.handle('create-renderer', async (event, type, options) => {
      try {
        const renderer = await rendererManager.createRenderer(type, options);
        return { success: true, id: renderer.id };
      } catch (error) {
        console.error('Failed to create renderer:', error);
        return { success: false, error: error.message };
      }
    });

    ipcMain.handle('get-renderers', async () => {
      const renderers = rendererManager.getAllRenderers().map(r => ({
        id: r.id,
        type: r.type,
        title: r.title,
        createdAt: r.createdAt
      }));
      return renderers;
    });

    ipcMain.handle('close-renderer', async (event, id) => {
      const success = rendererManager.closeRenderer(id);
      return { success };
    });

    // Database operations
    ipcMain.handle('db-get', async (event, namespace, key) => {
      try {
        const value = await databaseService.getSharedData(namespace, key);
        return { success: true, value };
      } catch (error) {
        console.error('Failed to get data from database:', error);
        return { success: false, error: error.message };
      }
    });

    ipcMain.handle('db-get-all', async (event, namespace) => {
      try {
        const values = await databaseService.getAllSharedData(namespace);
        return { success: true, values };
      } catch (error) {
        console.error('Failed to get all data from database:', error);
        return { success: false, error: error.message };
      }
    });

    ipcMain.handle('db-set', async (event, namespace, key, value) => {
      try {
        const result = await databaseService.setSharedData(namespace, key, value);
        
        // Broadcast to all renderers
        rendererManager.broadcastToRenderers('db-changed', {
          operation: 'set',
          namespace,
          key,
          value
        });
        
        return { success: true, result };
      } catch (error) {
        console.error('Failed to set data in database:', error);
        return { success: false, error: error.message };
      }
    });

    ipcMain.handle('db-delete', async (event, namespace, key) => {
      try {
        const result = await databaseService.deleteSharedData(namespace, key);
        
        // Broadcast to all renderers
        rendererManager.broadcastToRenderers('db-changed', {
          operation: 'delete',
          namespace,
          key
        });
        
        return { success: true, result };
      } catch (error) {
        console.error('Failed to delete data from database:', error);
        return { success: false, error: error.message };
      }
    });

    // System operations
    ipcMain.handle('show-error-dialog', async (event, title, message) => {
      await dialog.showErrorBox(title, message);
      return true;
    });

    ipcMain.handle('show-message-dialog', async (event, options) => {
      const result = await dialog.showMessageBox(options);
      return result;
    });
  }

  shutdown() {
    // Close all renderers
    rendererManager.closeAll();
    
    // Shutdown WebSocket server
    webSocketServer.shutdown();
    
    // Close database connection
    databaseService.close();
    
    this.initialized = false;
  }
}

// Create a singleton instance
const mainController = new MainController();

export default mainController;
