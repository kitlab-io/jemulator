import { BrowserWindow, app } from 'electron';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import databaseService from './database.js';

// Define renderer types
const RENDERER_TYPES = {
  VUE: 'vue',
  SVELTE: 'svelte',
  THREEJS: 'threejs',
  CUSTOM: 'custom'
};

class RendererManager {
  constructor() {
    this.renderers = new Map(); // Map of renderer IDs to renderer info
    this.defaultPreloadPath = path.join(__dirname, 'preload.js');
    this.isDevelopment = process.env.NODE_ENV !== 'production';
  }

  async initialize() {
    // Initialize database service
    await databaseService.initialize();
    
    // Load existing renderers from database
    const savedRenderers = await databaseService.getRenderers();
    console.log(`Found ${savedRenderers.length} saved renderers`);
  }

  /**
   * Create a new renderer process
   * @param {string} type - Type of renderer (vue, svelte, threejs, etc.)
   * @param {object} options - Configuration options
   * @returns {object} Renderer info
   */
  async createRenderer(type, options = {}) {
    // Validate renderer type
    if (!Object.values(RENDERER_TYPES).includes(type)) {
      throw new Error(`Invalid renderer type: ${type}`);
    }
    
    const id = options.id || uuidv4();
    const title = options.title || `${type.charAt(0).toUpperCase() + type.slice(1)} App`;
    const width = options.width || 800;
    const height = options.height || 600;
    const showDevTools = options.showDevTools || this.isDevelopment;
    const preloadPath = options.preloadPath || this.defaultPreloadPath;
    
    // Create browser window
    const window = new BrowserWindow({
      width,
      height,
      title,
      show: false, // Don't show until loaded
      webPreferences: {
        preload: preloadPath,
        nodeIntegration: false,
        contextIsolation: true,
        webSecurity: !this.isDevelopment, // Disable in dev for local resource loading
      }
    });
    
    // Load the appropriate HTML file based on renderer type
    let htmlFile;
    
    switch (type) {
      case RENDERER_TYPES.VUE:
        htmlFile = 'vue-app/index.html';
        break;
      case RENDERER_TYPES.SVELTE:
        htmlFile = 'svelte-app/index.html';
        break;
      case RENDERER_TYPES.THREEJS:
        htmlFile = 'threejs-app/index.html';
        break;
      case RENDERER_TYPES.CUSTOM:
        htmlFile = options.htmlFile || 'index.html';
        break;
      default:
        htmlFile = 'index.html';
    }
    
    try {
      // Determine the correct path based on development or production
      if (this.isDevelopment) {
        // In development, load from the appropriate Vite dev server URL
        let devServerUrl;
        
        switch (type) {
          case RENDERER_TYPES.VUE:
            devServerUrl = global.VITE_VUE_SERVER_URL;
            break;
          case RENDERER_TYPES.SVELTE:
            devServerUrl = global.VITE_SVELTE_SERVER_URL;
            break;
          case RENDERER_TYPES.THREEJS:
            devServerUrl = global.VITE_THREEJS_SERVER_URL;
            break;
          default:
            devServerUrl = global.VITE_DEV_SERVER_URL;
        }
        
        if (devServerUrl) {
          console.log(`Loading ${type} renderer from dev server: ${devServerUrl}`);
          await window.loadURL(devServerUrl);
        } else {
          // Fallback to file loading if dev server URL is not available
          const htmlPath = path.join(__dirname, '..', htmlFile);
          console.log(`Loading ${type} renderer from file: ${htmlPath}`);
          await window.loadFile(htmlPath);
        }
      } else {
        // In production, load from built files
        const htmlPath = path.join(app.getAppPath(), 'dist', type, 'index.html');
        console.log(`Loading ${type} renderer from: ${htmlPath}`);
        await window.loadFile(htmlPath);
      }
    } catch (error) {
      console.error(`Error loading ${type} renderer:`, error);
      throw new Error(`Failed to load ${type} renderer: ${error.message}`);
    }
    
    // Store renderer info
    const rendererInfo = {
      id,
      type,
      title,
      window,
      createdAt: new Date().toISOString()
    };
    
    this.renderers.set(id, rendererInfo);
    
    // Register in database
    await databaseService.registerRenderer(id, type, title);
    
    // Set up event handlers
    window.on('closed', () => {
      this.renderers.delete(id);
      console.log(`Renderer ${id} closed`);
    });
    
    window.on('ready-to-show', () => {
      window.show();
      if (showDevTools) {
        window.webContents.openDevTools();
      }
    });
    
    console.log(`Created ${type} renderer: ${id}`);
    return rendererInfo;
  }

  /**
   * Get a renderer by ID
   * @param {string} id - Renderer ID
   * @returns {object|null} Renderer info or null if not found
   */
  getRenderer(id) {
    return this.renderers.get(id) || null;
  }

  /**
   * Get all active renderers
   * @returns {Array} Array of renderer info objects
   */
  getAllRenderers() {
    return Array.from(this.renderers.values());
  }

  /**
   * Close a renderer by ID
   * @param {string} id - Renderer ID
   * @returns {boolean} True if closed, false if not found
   */
  closeRenderer(id) {
    const renderer = this.renderers.get(id);
    if (!renderer) return false;
    
    renderer.window.close();
    return true;
  }

  /**
   * Send a message to a specific renderer
   * @param {string} id - Renderer ID
   * @param {string} channel - IPC channel
   * @param {any} data - Message data
   * @returns {boolean} True if sent, false if renderer not found
   */
  sendToRenderer(id, channel, data) {
    const renderer = this.renderers.get(id);
    if (!renderer) return false;
    
    renderer.window.webContents.send(channel, data);
    return true;
  }

  /**
   * Broadcast a message to all renderers
   * @param {string} channel - IPC channel
   * @param {any} data - Message data
   * @param {Array} excludeIds - Array of renderer IDs to exclude
   * @returns {number} Number of renderers the message was sent to
   */
  broadcastToRenderers(channel, data, excludeIds = []) {
    let count = 0;
    
    for (const [id, renderer] of this.renderers.entries()) {
      if (excludeIds.includes(id)) continue;
      
      renderer.window.webContents.send(channel, data);
      count++;
    }
    
    return count;
  }

  /**
   * Close all renderers
   */
  closeAll() {
    for (const renderer of this.renderers.values()) {
      renderer.window.close();
    }
    
    this.renderers.clear();
  }
}

// Create a singleton instance
const rendererManager = new RendererManager();

export default rendererManager;
