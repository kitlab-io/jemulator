import { app, BrowserWindow, shell, ipcMain } from 'electron'
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import os from 'node:os'
import { AppServer } from './server'
import { DatabaseManager } from './database'
import { WebSocketServer } from './websocket-server'

// Use CommonJS require for Electron to ensure compatibility
const require = createRequire(import.meta.url)
const electron = require('electron')

// Import Electron modules
const app = electron.app
const BrowserWindow = electron.BrowserWindow
const shell = electron.shell
const ipcMain = electron.ipcMain

// Get the directory name
const __dirname = path.dirname(fileURLToPath(import.meta.url))

// The built directory structure
//
// ├─┬ dist-electron
// │ ├─┬ main
// │ │ └── index.js    > Electron-Main
// │ └─┬ preload
// │   └── index.mjs   > Preload-Scripts
// ├─┬ dist
// │ └── index.html    > Electron-Renderer
//
process.env.APP_ROOT = path.join(__dirname, '../..')

export const MAIN_DIST = path.join(process.env.APP_ROOT, 'dist-electron')
export const RENDERER_DIST = path.join(process.env.APP_ROOT, 'dist')

// React app dev server URL (default: http://localhost:3000)
export const REACT_DEV_SERVER_URL = process.env.REACT_DEV_SERVER_URL || "http://localhost:3000"

// Original Vue app dev server URL
export const VITE_DEV_SERVER_URL = process.env.VITE_DEV_SERVER_URL
process.env.VITE_PUBLIC = VITE_DEV_SERVER_URL
  ? path.join(process.env.APP_ROOT, 'public')
  : RENDERER_DIST

// Disable GPU Acceleration for Windows 7
if (os.release().startsWith('6.1')) app.disableHardwareAcceleration()

// Set application name for Windows 10+ notifications
if (process.platform === 'win32') app.setAppUserModelId(app.getName())

// We'll initialize the services when the app is ready

if (!app.requestSingleInstanceLock()) {
  app.quit()
  process.exit(0)
}

let win: BrowserWindow | null = null
const preload = path.join(__dirname, '../preload/index.mjs')

// Create HTTP server instance
let reactWin: BrowserWindow | null = null
let needleWin: BrowserWindow | null = null
let threlteWin: BrowserWindow | null = null
let renjsWin: BrowserWindow | null = null
let appServer: AppServer | null = null
let dbManager: DatabaseManager | null = null
let wsServer: WebSocketServer | null = null
let serverPort: number = 3000
let wsPort: number = 8080
let reactAppPath: string
let needleAppPath: string
let threlteAppPath: string
let renjsAppPath: string

// Define paths for Vue, React, and Needle JS apps
let vueAppPath: string

// In development mode, use the dev server URLs
if (!app.isPackaged) {
  vueAppPath = RENDERER_DIST
  reactAppPath = path.join(RENDERER_DIST, 'react')
  // needleAppPath = path.join(process.env.APP_ROOT, 'needleengine/Exports/Sidescroller/dist')
  needleAppPath = path.join(RENDERER_DIST, 'needle')
  threlteAppPath = path.join(RENDERER_DIST, 'threlte')
  // renjsAppPath = path.join(process.env.APP_ROOT, 'renjs/.demo')
  renjsAppPath = path.join(RENDERER_DIST, 'renjs')


} else {
  // In production, use the packaged app paths
  vueAppPath = RENDERER_DIST
  
  // For extraResources, we specified the path as 'app/dist/react'
  const resourcesPath = process.resourcesPath
  reactAppPath = path.join(resourcesPath, 'app/dist/react')
  needleAppPath = path.join(resourcesPath, 'app/dist/needle')
  threlteAppPath = path.join(resourcesPath, 'app/dist/threlte')
  renjsAppPath = path.join(resourcesPath, 'app/dist/renjs')
  
  console.log('Vue app path:', vueAppPath)
  console.log('React app path:', reactAppPath)
  console.log('Needle app path:', needleAppPath)
  console.log('Threlte app path:', threlteAppPath)
  console.log('RenJS app path:', renjsAppPath)
}

async function createWindow() {
  // Initialize the HTTP server if it's not already running
  if (!appServer) {
    appServer = new AppServer(vueAppPath, reactAppPath, needleAppPath, threlteAppPath, renjsAppPath, serverPort);
    try {
      serverPort = await appServer.start();
      console.log(`HTTP server started on port ${serverPort}`);
    } catch (err) {
      console.error('Failed to start HTTP server:', err);
      app.quit();
      return;
    }
  }
  
  // Initialize the database manager if it's not already running
  if (!dbManager) {
    console.log('Initializing database manager...');
    dbManager = new DatabaseManager();
    if (dbManager.isInitialized()) {
      console.log('Database manager initialized successfully');
    } else {
      console.error('Failed to initialize database manager');
    }
  }

  win = new BrowserWindow({
    title: 'Main window',
    icon: path.join(process.env.VITE_PUBLIC, 'favicon.ico'),
    webPreferences: {
      preload,
      // For security in production, avoid nodeIntegration
      nodeIntegration: false,
      contextIsolation: true,
      // Enable webSecurity in production
      webSecurity: app.isPackaged,
      // Allow scripts to access remote content
      allowRunningInsecureContent: !app.isPackaged,
    },
  })

  // Determine which app to load
  // const loadReactApp = true; // Set to false to load Vue app instead
  const loadReactApp = false; // Set to false to load Vue app instead


  if (!app.isPackaged && process.env.NODE_ENV === 'development') {
    // Development mode - load from external dev servers
    if (loadReactApp && REACT_DEV_SERVER_URL) {
      win.loadURL(REACT_DEV_SERVER_URL);
    } else if (VITE_DEV_SERVER_URL) {
      win.loadURL(VITE_DEV_SERVER_URL);
    }
  } else {
    // Production mode or local development - load from our HTTP server
    if (loadReactApp) {
      win.loadURL(appServer.getAppUrl('react'));
    } else {
      win.loadURL(appServer.getAppUrl('vue'));
    }
  }
  
  // Open DevTools in development mode
  if (process.env.NODE_ENV === 'development') {
    win.webContents.openDevTools();
  }

  // Test actively push message to the Electron-Renderer
  win.webContents.on('did-finish-load', () => {
    win?.webContents.send('main-process-message', new Date().toLocaleString())
  })

  // Make all links open with the browser, not with the application
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('https:')) shell.openExternal(url)
    return { action: 'deny' }
  })
  // win.webContents.on('will-navigate', (event, url) => { }) #344
}

/**
 * Create a new window for the React app
 */
async function createReactWindow() {
  // If React window already exists, focus it and return
  if (reactWin && !reactWin.isDestroyed()) {
    reactWin.focus()
    win?.webContents.send('react-window-status', 'React window is already open')
    return
  }

  // Initialize the HTTP server if it's not already running
  if (!appServer) {
    appServer = new AppServer(vueAppPath, reactAppPath, needleAppPath, threlteAppPath, renjsAppPath, serverPort)
    try {
      serverPort = await appServer.start()
      console.log(`HTTP server started on port ${serverPort}`)
    } catch (err) {
      console.error('Failed to start HTTP server:', err)
      win?.webContents.send('react-window-status', 'Failed to start HTTP server')
      return
    }
  }

  // Create a new browser window for the React app
  reactWin = new BrowserWindow({
    title: 'React App',
    width: 1000,
    height: 800,
    webPreferences: {
      preload,
      // For security in production, avoid nodeIntegration
      nodeIntegration: false,
      contextIsolation: true,
      // Enable webSecurity in production
      webSecurity: app.isPackaged,
      // Allow scripts to access remote content
      allowRunningInsecureContent: !app.isPackaged,
    },
  })

  // Load the React app
  // if (!app.isPackaged && process.env.NODE_ENV === 'development' && REACT_DEV_SERVER_URL) {
  //   // Development mode - load from external dev server
  //   await reactWin.loadURL(REACT_DEV_SERVER_URL)
  // } else {
  //   // Production mode or local development - load from our HTTP server
  //   await reactWin.loadURL(appServer.getAppUrl('react'))
  // }
  await reactWin.loadURL(appServer.getAppUrl('react'))

  // Open DevTools in development mode
  if (process.env.NODE_ENV === 'development') {
    reactWin.webContents.openDevTools()
  }

  // Notify the main window that the React window is ready
  win?.webContents.send('react-window-status', 'React window opened successfully')

  // Handle window close event
  reactWin.on('closed', () => {
    reactWin = null
    win?.webContents.send('react-window-status', 'React window was closed')
  })
}

/**
 * Create a new window for the Needle JS app
 * @param {string} appPath - Optional path for the app variant (e.g., 'carphysics')
 * @param {object} context - Optional context data to pass to the app
 */
async function createNeedleWindow(appPath?: string, context?: any) {
  // If Needle window already exists and no specific variant is requested, focus it and return
  if (needleWin && !needleWin.isDestroyed() && !appPath) {
    needleWin.focus()
    win?.webContents.send('needle-window-status', 'Needle window is already open')
    return
  }

  // Initialize the HTTP server if it's not already running
  if (!appServer) {
    appServer = new AppServer(vueAppPath, reactAppPath, needleAppPath, threlteAppPath, renjsAppPath, serverPort)
    try {
      serverPort = await appServer.start()
      console.log(`HTTP server started on port ${serverPort}`)
    } catch (err) {
      console.error('Failed to start HTTP server:', err)
      win?.webContents.send('needle-window-status', 'Failed to start HTTP server')
      return
    }
  }

  // Create a new browser window for the Needle JS app
  const windowTitle = appPath ? `Needle JS App - ${appPath}` : 'Needle JS App'
  needleWin = new BrowserWindow({
    title: windowTitle,
    width: 1200,
    height: 800,
    webPreferences: {
      preload,
      // For security in production, avoid nodeIntegration
      nodeIntegration: false,
      contextIsolation: true,
      // Enable webSecurity in production
      webSecurity: app.isPackaged,
      // Allow scripts to access remote content
      allowRunningInsecureContent: !app.isPackaged,
    },
  })

  // Load the Needle JS app with the specified variant path
  await needleWin.loadURL(appServer.getAppUrl('needle', appPath))

  // If context data is provided, send it to the renderer process
  if (context) {
    needleWin.webContents.on('did-finish-load', () => {
      needleWin?.webContents.send('app-context', context)
    })
  }

  // Open DevTools in development mode
  if (process.env.NODE_ENV === 'development') {
    needleWin.webContents.openDevTools()
  }

  // Notify the main window that the Needle window is ready
  const statusMessage = appPath 
    ? `Needle window (${appPath}) opened successfully` 
    : 'Needle window opened successfully'
  win?.webContents.send('needle-window-status', statusMessage)

  // Handle window close event
  needleWin.on('closed', () => {
    needleWin = null
    win?.webContents.send('needle-window-status', 'Needle window was closed')
  })
}

/**
 * Create a new window for the Threlte app
 * @param {string} appPath - Optional path for the app variant
 * @param {object} context - Optional context data to pass to the app
 */
async function createThrelteWindow(appPath?: string, context?: any) {
  // If Threlte window already exists and no specific variant is requested, focus it and return
  if (threlteWin && !threlteWin.isDestroyed() && !appPath) {
    threlteWin.focus()
    win?.webContents.send('threlte-window-status', 'Threlte window is already open')
    return
  }

  // Initialize the HTTP server if it's not already running
  if (!appServer) {
    appServer = new AppServer(vueAppPath, reactAppPath, needleAppPath, threlteAppPath, renjsAppPath, serverPort)
    try {
      serverPort = await appServer.start()
      console.log(`HTTP server started on port ${serverPort}`)
    } catch (err) {
      console.error('Failed to start HTTP server:', err)
      win?.webContents.send('threlte-window-status', 'Failed to start HTTP server')
      return
    }
  }

  // Create a new browser window for the Threlte app
  const windowTitle = appPath ? `Threlte App - ${appPath}` : 'Threlte App'
  threlteWin = new BrowserWindow({
    title: windowTitle,
    width: 1200,
    height: 800,
    webPreferences: {
      preload,
      // For security in production, avoid nodeIntegration
      nodeIntegration: false,
      contextIsolation: true,
      // Enable webSecurity in production
      webSecurity: app.isPackaged,
      // Allow scripts to access remote content
      allowRunningInsecureContent: !app.isPackaged,
    },
  })

  // Load the Threlte app with the specified variant path
  await threlteWin.loadURL(appServer.getAppUrl('threlte', appPath))

  // If context data is provided, send it to the renderer process
  if (context) {
    threlteWin.webContents.on('did-finish-load', () => {
      threlteWin?.webContents.send('app-context', context)
    })
  }

  // Open DevTools in development mode
  if (process.env.NODE_ENV === 'development') {
    threlteWin.webContents.openDevTools()
  }

  // Notify the main window that the Threlte window is ready
  const statusMessage = appPath 
    ? `Threlte window (${appPath}) opened successfully` 
    : 'Threlte window opened successfully'
  win?.webContents.send('threlte-window-status', statusMessage)

  // Handle window close event
  threlteWin.on('closed', () => {
    threlteWin = null
    win?.webContents.send('threlte-window-status', 'Threlte window was closed')
  })
}

/**
 * Create a new window for the RenJS demo
 * @param {string} appPath - Optional path for the app variant
 * @param {object} context - Optional context data to pass to the app
 */
async function createRenjsWindow(appPath?: string, context?: any) {
  // If RenJS window already exists and no specific variant is requested, focus it and return
  if (renjsWin && !renjsWin.isDestroyed() && !appPath) {
    renjsWin.focus()
    win?.webContents.send('renjs-window-status', 'RenJS window is already open')
    return
  }

  // Initialize the HTTP server if it's not already running
  if (!appServer) {
    appServer = new AppServer(vueAppPath, reactAppPath, needleAppPath, threlteAppPath, renjsAppPath, serverPort)
    try {
      serverPort = await appServer.start()
      console.log(`HTTP server started on port ${serverPort}`)
    } catch (err) {
      console.error('Failed to start HTTP server:', err)
      win?.webContents.send('renjs-window-status', 'Failed to start HTTP server')
      return
    }
  }

  // Create a new browser window for the RenJS demo
  const windowTitle = appPath ? `RenJS Demo - ${appPath}` : 'RenJS Demo'
  renjsWin = new BrowserWindow({
    title: windowTitle,
    width: 1200,
    height: 800,
    webPreferences: {
      preload,
      // For security in production, avoid nodeIntegration
      nodeIntegration: false,
      contextIsolation: true,
      // Enable webSecurity in production
      webSecurity: app.isPackaged,
      // Allow scripts to access remote content
      allowRunningInsecureContent: !app.isPackaged,
    },
  })

  // Load the RenJS demo with the specified variant path
  await renjsWin.loadURL(appServer.getAppUrl('renjs', appPath))

  // If context data is provided, send it to the renderer process
  if (context) {
    renjsWin.webContents.on('did-finish-load', () => {
      renjsWin?.webContents.send('app-context', context)
    })
  }

  // Open DevTools in development mode
  if (process.env.NODE_ENV === 'development') {
    renjsWin.webContents.openDevTools()
  }

  // Notify the main window that the RenJS window is ready
  const statusMessage = appPath 
    ? `RenJS window (${appPath}) opened successfully` 
    : 'RenJS window opened successfully'
  win?.webContents.send('renjs-window-status', statusMessage)

  // Handle window close event
  renjsWin.on('closed', () => {
    renjsWin = null
    win?.webContents.send('renjs-window-status', 'RenJS window was closed')
  })
}

app.whenReady().then(async () => {
  // Register custom protocol handler for loading React app in production
  if (app.isPackaged) {
    // Register secure custom protocol
    // protocol.handle('app', (request) => {
    //   let filePath = request.url.slice('app://'.length)
    //   // On Windows, convert slashes
    //   if (process.platform === 'win32') {
    //     filePath = filePath.replace(/\//g, '\\')
    //   }
    //   return net.fetch('file://' + path.normalize(path.join(process.resourcesPath, 'app/dist/react', filePath)))
    // })
  }
  
  // Initialize the database manager
  dbManager = new DatabaseManager();
  console.log('Database manager initialized');
  
  // Initialize the WebSocket server
  wsServer = new WebSocketServer(dbManager, wsPort);
  try {
    wsPort = await wsServer.start();
    console.log(`WebSocket server started on port ${wsPort}`);
  } catch (err) {
    console.error('Failed to start WebSocket server:', err);
  }
  
  // Set up IPC handlers
  ipcMain.on('open-react-window', () => {
    createReactWindow()
  })
  
  // Handle IPC message to open Needle JS window
  ipcMain.on('open-needle-window', () => {
    createNeedleWindow()
  })
  
  createWindow()
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
    if (appServer) {
      appServer.stop()
      appServer = null
    }
    if (dbManager) {
      dbManager.close()
      dbManager = null
    }
  }
})

app.on('quit', async () => {
  if (appServer) {
    console.log('Shutting down HTTP server...')
    await appServer.stop()
    appServer = null
  }
  
  if (wsServer) {
    console.log('Shutting down WebSocket server...')
    await wsServer.stop()
    wsServer = null
  }
  
  if (dbManager) {
    console.log('Closing database connection...')
    dbManager.close()
    dbManager = null
  }
})

app.on('second-instance', () => {
  if (win) {
    // Focus on the main window if the user tried to open another
    if (win.isMinimized()) win.restore()
    win.focus()
  }
})

app.on('activate', () => {
  const allWindows = BrowserWindow.getAllWindows()
  if (allWindows.length) {
    allWindows[0].focus()
  } else {
    createWindow()
  }
})

// New window example arg: new windows url
ipcMain.handle('open-win', (_, arg) => {
  const childWindow = new BrowserWindow({
    webPreferences: {
      preload,
      nodeIntegration: true,
      contextIsolation: false,
    },
  })

  if (VITE_DEV_SERVER_URL) {
    childWindow.loadURL(`${VITE_DEV_SERVER_URL}#${arg}`)
  } else {
    childWindow.loadFile(indexHtml, { hash: arg })
  }
})

// Handle opening the React window
ipcMain.handle('open-react-window', () => {
  createReactWindow()
})

// Handle opening app windows with variants
ipcMain.handle('open-app-window', (event, payload) => {
  console.log('Opening app window with payload:', payload)
  
  const { appType, appPath, context } = payload
  
  switch (appType) {
    case 'needle':
      createNeedleWindow(appPath, context)
      break
    case 'threlte':
      createThrelteWindow(appPath, context)
      break
    case 'renjs':
      createRenjsWindow(appPath, context)
      break
    case 'react':
      // For backward compatibility
      createReactWindow()
      break
    default:
      console.error(`Unknown app type: ${appType}`)
  }
})

// Legacy handlers for backward compatibility
ipcMain.handle('open-needle-window', () => {
  createNeedleWindow()
})

ipcMain.handle('open-threlte-window', () => {
  createThrelteWindow()
})

ipcMain.handle('open-renjs-window', () => {
  createRenjsWindow()
})
