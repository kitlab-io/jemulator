/**
 * Minimal Electron entry point for development
 * This file is designed to be a simple entry point for Electron in development mode
 * without relying on the existing main.js file
 */
const { app, BrowserWindow } = require('electron');
const path = require('path');

// Handle creating/removing shortcuts on Windows when installing/uninstalling
if (require('electron-squirrel-startup')) {
  app.quit();
}

// Store the main window reference
let mainWindow = null;

/**
 * Create the main browser window
 */
function createWindow() {
  console.log('Creating main window...');
  
  // Create the browser window
  mainWindow = new BrowserWindow({
    width: 1024,
    height: 768,
    webPreferences: {
      preload: path.join(__dirname, 'src', 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: false, // Allow loading local resources
    },
  });
  
  // Get the dev server URL from environment variables
  const devServerUrl = process.env.VITE_DEV_SERVER_URL || 'http://localhost:5173';
  console.log(`Loading from dev server: ${devServerUrl}`);
  
  // Store dev server URLs in global variables for renderer processes to access
  global.VITE_DEV_SERVER_URL = process.env.VITE_DEV_SERVER_URL;
  global.VITE_VUE_SERVER_URL = process.env.VITE_VUE_SERVER_URL;
  global.VITE_SVELTE_SERVER_URL = process.env.VITE_SVELTE_SERVER_URL;
  global.VITE_THREEJS_SERVER_URL = process.env.VITE_THREEJS_SERVER_URL;
  
  // Load the dev server URL
  mainWindow.loadURL(devServerUrl);
  
  // Open DevTools
  mainWindow.webContents.openDevTools();
  
  // Handle window close
  mainWindow.on('closed', () => {
    mainWindow = null;
  });
  
  return mainWindow;
}

// This method will be called when Electron has finished initialization
app.whenReady().then(() => {
  console.log('Electron app is ready');
  createWindow();
  
  // On macOS it's common to re-create a window when the dock icon is clicked
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

// Quit when all windows are closed, except on macOS
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// Log any unhandled errors
process.on('uncaughtException', (error) => {
  console.error('Uncaught exception:', error);
});
