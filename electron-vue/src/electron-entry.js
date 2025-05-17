/**
 * Minimal Electron entry point
 * This file is designed to be the entry point for Electron in development mode
 */
const { app, BrowserWindow } = require('electron');
const path = require('path');

// Create the browser window
function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 1024,
    height: 768,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: false, // Allow loading local resources
    },
  });

  // Load the dev server URL if available
  if (process.env.VITE_DEV_SERVER_URL) {
    console.log(`Loading from dev server: ${process.env.VITE_DEV_SERVER_URL}`);
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL);
  } else {
    console.log('Loading from file system');
    mainWindow.loadFile(path.join(__dirname, '../vue/index.html'));
  }

  // Open DevTools in development mode
  if (process.env.NODE_ENV === 'development') {
    mainWindow.webContents.openDevTools();
  }

  return mainWindow;
}

// Initialize the app
app.whenReady().then(() => {
  console.log('Electron app is ready');
  const mainWindow = createWindow();

  // Handle macOS app activation
  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

// Quit when all windows are closed, except on macOS
app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit();
});

// Log any unhandled errors
process.on('uncaughtException', (error) => {
  console.error('Uncaught exception:', error);
});
