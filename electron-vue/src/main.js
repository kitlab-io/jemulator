import { app, BrowserWindow, ipcMain, Menu } from 'electron';
import path from 'node:path';
import started from 'electron-squirrel-startup';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// Import our services
import mainController from './services/main-controller.js';
import rendererManager from './services/renderer-manager.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (started) {
  app.quit();
}

let mainWindow;

const createWindow = () => {
  // Create the browser window.
  mainWindow = new BrowserWindow({
    width: 1024,
    height: 768,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: false, // Allow loading local resources
    },
  });

  // Store dev server URLs in global variables for renderer processes to access
  if (process.env.VITE_DEV_SERVER_URL) {
    global.VITE_DEV_SERVER_URL = process.env.VITE_DEV_SERVER_URL;
    global.VITE_VUE_SERVER_URL = process.env.VITE_VUE_SERVER_URL;
    global.VITE_SVELTE_SERVER_URL = process.env.VITE_SVELTE_SERVER_URL;
    global.VITE_THREEJS_SERVER_URL = process.env.VITE_THREEJS_SERVER_URL;
    
    // In development mode, load from the dev server URL
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL);
  } else {
    // In production mode, load from the built files
    // Load the main renderer (control panel) as the default window
    mainWindow.loadFile(path.join(__dirname, '../main-renderer/index.html'));
  }

  // Open the DevTools in development mode
  if (process.env.NODE_ENV !== 'production') {
    mainWindow.webContents.openDevTools();
  }
  
  return mainWindow;
};

// Create application menu
const createAppMenu = () => {
  const isMac = process.platform === 'darwin';
  
  const template = [
    // App menu (macOS only)
    ...(isMac ? [{
      label: app.name,
      submenu: [
        { role: 'about' },
        { type: 'separator' },
        { role: 'services' },
        { type: 'separator' },
        { role: 'hide' },
        { role: 'hideOthers' },
        { role: 'unhide' },
        { type: 'separator' },
        { role: 'quit' }
      ]
    }] : []),
    
    // File menu
    {
      label: 'File',
      submenu: [
        {
          label: 'New Vue App',
          click: async () => {
            await rendererManager.createRenderer('vue', { title: 'Vue App' });
          }
        },
        {
          label: 'New Svelte App',
          click: async () => {
            await rendererManager.createRenderer('svelte', { title: 'Svelte App' });
          }
        },
        {
          label: 'New Three.js App',
          click: async () => {
            await rendererManager.createRenderer('threejs', { title: 'Three.js App' });
          }
        },
        { type: 'separator' },
        isMac ? { role: 'close' } : { role: 'quit' }
      ]
    },
    
    // Edit menu
    {
      label: 'Edit',
      submenu: [
        { role: 'undo' },
        { role: 'redo' },
        { type: 'separator' },
        { role: 'cut' },
        { role: 'copy' },
        { role: 'paste' },
        ...(isMac ? [
          { role: 'pasteAndMatchStyle' },
          { role: 'delete' },
          { role: 'selectAll' },
          { type: 'separator' },
          {
            label: 'Speech',
            submenu: [
              { role: 'startSpeaking' },
              { role: 'stopSpeaking' }
            ]
          }
        ] : [
          { role: 'delete' },
          { type: 'separator' },
          { role: 'selectAll' }
        ])
      ]
    },
    
    // View menu
    {
      label: 'View',
      submenu: [
        { role: 'reload' },
        { role: 'forceReload' },
        { role: 'toggleDevTools' },
        { type: 'separator' },
        { role: 'resetZoom' },
        { role: 'zoomIn' },
        { role: 'zoomOut' },
        { type: 'separator' },
        { role: 'togglefullscreen' }
      ]
    },
    
    // Window menu
    {
      label: 'Window',
      submenu: [
        { role: 'minimize' },
        { role: 'zoom' },
        ...(isMac ? [
          { type: 'separator' },
          { role: 'front' },
          { type: 'separator' },
          { role: 'window' }
        ] : [
          { role: 'close' }
        ])
      ]
    },
    
    // Help menu
    {
      role: 'help',
      submenu: [
        {
          label: 'Learn More',
          click: async () => {
            const { shell } = require('electron');
            await shell.openExternal('https://electronjs.org');
          }
        }
      ]
    }
  ];
  
  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
};

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(async () => {
  try {
    // Initialize main controller
    await mainController.initialize();
    
    // Create main window
    createWindow();
    
    // Create application menu
    createAppMenu();
    
    // On OS X it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
      }
    });
  } catch (error) {
    console.error('Failed to initialize application:', error);
    app.quit();
  }
});

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('before-quit', () => {
  // Perform cleanup
  mainController.shutdown();
});

// Register IPC handlers for renderer creation
ipcMain.handle('launch-renderer', async (event, type, options = {}) => {
  try {
    const renderer = await rendererManager.createRenderer(type, options);
    return { success: true, id: renderer.id };
  } catch (error) {
    console.error('Failed to launch renderer:', error);
    return { success: false, error: error.message };
  }
});
