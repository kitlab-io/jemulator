/**
 * Electron main process entry point (CommonJS version)
 */
const { app, BrowserWindow, ipcMain, Menu } = require('electron');
const path = require('path');
const started = require('electron-squirrel-startup');

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
    mainWindow.loadFile(path.join(__dirname, '../vue/index.html'));
  }

  // Open the DevTools in development mode
  if (process.env.NODE_ENV !== 'production') {
    mainWindow.webContents.openDevTools();
  }
};

// Create application menu
const createAppMenu = () => {
  // Check if Menu is available (it might not be in some environments)
  if (!Menu) {
    console.warn('Menu module is not available, skipping menu creation');
    return;
  }
  
  const template = [
    {
      label: 'File',
      submenu: [
        {
          label: 'Exit',
          click: () => {
            app.quit();
          }
        }
      ]
    },
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
    {
      label: 'Window',
      submenu: [
        { role: 'minimize' },
        { role: 'zoom' },
        { role: 'close' }
      ]
    }
  ];

  try {
    const menu = Menu.buildFromTemplate(template);
    Menu.setApplicationMenu(menu);
  } catch (err) {
    console.warn('Failed to create application menu:', err.message);
  }
};

// Create application menu
createAppMenu();

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(async () => {
  createWindow();

  // Set up IPC handlers
  setupIpcHandlers();

  app.on('activate', () => {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// Set up IPC handlers for renderer processes
function setupIpcHandlers() {
  // Example IPC handler
  ipcMain.handle('get-app-info', () => {
    return {
      appName: app.getName(),
      appVersion: app.getVersion(),
      electronVersion: process.versions.electron,
      nodeVersion: process.versions.node,
      chromeVersion: process.versions.chrome,
      platform: process.platform,
      arch: process.arch
    };
  });

  // Handle renderer switching
  ipcMain.handle('switch-renderer', (event, rendererType) => {
    let url;
    
    if (process.env.VITE_DEV_SERVER_URL) {
      // In development mode
      switch (rendererType) {
        case 'vue':
          url = process.env.VITE_VUE_SERVER_URL;
          break;
        case 'svelte':
          url = process.env.VITE_SVELTE_SERVER_URL;
          break;
        case 'threejs':
          url = process.env.VITE_THREEJS_SERVER_URL;
          break;
        default:
          url = process.env.VITE_VUE_SERVER_URL;
      }
    } else {
      // In production mode
      switch (rendererType) {
        case 'vue':
          url = path.join(__dirname, '../vue/index.html');
          break;
        case 'svelte':
          url = path.join(__dirname, '../svelte/index.html');
          break;
        case 'threejs':
          url = path.join(__dirname, '../threejs/index.html');
          break;
        default:
          url = path.join(__dirname, '../vue/index.html');
      }
    }
    
    if (process.env.VITE_DEV_SERVER_URL) {
      mainWindow.loadURL(url);
    } else {
      mainWindow.loadFile(url);
    }
    
    return { success: true, renderer: rendererType };
  });
}

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and import them here.
