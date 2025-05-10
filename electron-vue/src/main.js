import { app, BrowserWindow, ipcMain } from 'electron';
import path from 'node:path';
import started from 'electron-squirrel-startup';
import WebSocket from 'ws';
import http from 'http';
import fs from 'fs/promises';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// import("@needle-tools/engine") /* async import of needle engine */;
// import * as needle from "@needle-tools/engine";
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
    },
  });

  // and load the index.html of the app.
  if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(MAIN_WINDOW_VITE_DEV_SERVER_URL);
  } else {
    mainWindow.loadFile(path.join(__dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}/index.html`));
  }

  // Open the DevTools.
  mainWindow.webContents.openDevTools();
  
  return mainWindow;
};

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  createWindow();

  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  app.on('activate', () => {
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

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and import them here.

// Device simulation manager
const deviceManager = {
  devices: new Map(), // Map of device IDs to browser windows
  wsServer: null,
  
  async initialize() {
    // Create HTTP server
    const server = http.createServer();
    
    // Initialize WebSocket server
    this.wsServer = new WebSocket.Server({ noServer: true });
    
    // Handle upgrade requests
    server.on('upgrade', (request, socket, head) => {
      this.wsServer.handleUpgrade(request, socket, head, (ws) => {
        this.wsServer.emit('connection', ws, request);
      });
    });

    // Handle WebSocket connections
    this.wsServer.on('connection', (ws) => {
      console.log('New WebSocket connection');
      
      ws.on('message', async (message) => {
        try {
          const data = JSON.parse(message.toString());
          await this.handleCommand(data);
        } catch (error) {
          console.error('Error handling WebSocket message:', error);
        }
      });

      ws.on('close', () => {
        console.log('WebSocket connection closed');
      });

      ws.on('error', (error) => {
        console.error('WebSocket error:', error);
      });
    });

    // Start the server
    server.listen(8080, () => {
      console.log('WebSocket server started on port 8080');
    });
  },
  
  async spawnDevice(deviceId, options = {}) {
    if (this.devices.has(deviceId)) {
      throw new Error(`Device ${deviceId} already exists`);
    }
    
    const useConsole = options.useConsole || false;
    const showWindow = options.showWindow || false;
    
    // Create browser window for device simulation
    const deviceWindow = new BrowserWindow({
      width: 800,
      height: 600,
      show: showWindow, // Show window if requested
      title: `MicroPython Device: ${deviceId}`,
      webPreferences: {
        preload: path.join(__dirname, 'preload.js'),
        nodeIntegration: false,
        contextIsolation: true,
      }
    });
    
    // Choose which HTML file to load based on options
    let htmlFile;
    if (useConsole) {
      // Use the interactive console HTML
      htmlFile = 'console.html';
    } else {
      // Use the headless worker HTML
      htmlFile = 'worker.html';
    }
    
    // Load the HTML file
    const htmlPath = path.join(__dirname, htmlFile);
    console.log(`Loading ${htmlFile} from:`, htmlPath);
    
    // Try loading the file directly
    try {
      await deviceWindow.loadFile(htmlPath);
    } catch (error) {
      console.error(`Failed to load ${htmlFile} from build directory, trying source directory`);
      
      // If that fails, try the source directory
      const srcPath = path.join(__dirname, `../src/${htmlFile}`);
      console.log('Trying alternative path:', srcPath);
      await deviceWindow.loadFile(srcPath);
    }
    
    // Store device window
    this.devices.set(deviceId, { window: deviceWindow, id: deviceId });
    
    // Initialize the device
    deviceWindow.webContents.send('device-message', {
      type: 'init',
      deviceId
    });
    
    // Handle window close
    deviceWindow.on('closed', () => {
      this.devices.delete(deviceId);
      console.log(`Device ${deviceId} window closed`);
    });
    
    console.log(`Device ${deviceId} created`);
    return { window: deviceWindow, id: deviceId };
  },
  
  async destroyDevice(deviceId) {
    const device = this.devices.get(deviceId);
    if (!device) {
      throw new Error(`Device ${deviceId} does not exist`);
    }
    
    device.window.close();
    this.devices.delete(deviceId);
    console.log(`Device ${deviceId} destroyed`);
  },
  
  async handleCommand(command) {
    const { type, deviceId, payload } = command;
    
    switch (type) {
      case 'spawn-device':
        await this.spawnDevice(deviceId, payload);
        break;
      case 'destroy-device':
        await this.destroyDevice(deviceId);
        break;
      case 'load-code':
        await this.loadCode(deviceId, payload);
        break;
      case 'execute-code':
        await this.executeCode(deviceId, payload);
        break;
      case 'repl-input':
        await this.sendReplInput(deviceId, payload);
        break;
      default:
        console.warn(`Unknown command type: ${type}`);
    }
  },
  
  async loadCode(deviceId, codePath) {
    const device = this.devices.get(deviceId);
    if (!device) {
      throw new Error(`Device ${deviceId} does not exist`);
    }
    
    try {
      const code = await fs.readFile(codePath, 'utf-8');
      device.window.webContents.send('device-message', { 
        type: 'load-code', 
        code 
      });
    } catch (error) {
      console.error(`Error loading code for device ${deviceId}:`, error);
      throw error;
    }
  },
  
  async executeCode(deviceId, code) {
    const device = this.devices.get(deviceId);
    if (!device) {
      throw new Error(`Device ${deviceId} does not exist`);
    }
    
    device.window.webContents.send('device-message', { 
      type: 'execute-code', 
      code 
    });
  },
  
  async sendReplInput(deviceId, input) {
    const device = this.devices.get(deviceId);
    if (!device) {
      throw new Error(`Device ${deviceId} does not exist`);
    }
    
    device.window.webContents.send('device-message', { 
      type: 'repl-input', 
      input 
    });
  },
  
  broadcastDeviceState(deviceId, state) {
    this.wsServer.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify({
          type: 'device-state',
          deviceId,
          state
        }));
      }
    });
  },

  broadcastConsoleOutput(deviceId, message) {
    this.wsServer.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify({
          type: 'console-output',
          deviceId,
          message
        }));
      }
    });
  },

  broadcastConsoleError(deviceId, message) {
    this.wsServer.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify({
          type: 'console-error',
          deviceId,
          message
        }));
      }
    });
  },

  broadcastReplOutput(deviceId, output) {
    this.wsServer.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify({
          type: 'repl-output',
          deviceId,
          output
        }));
      }
    });
  }
};

// Initialize device manager when app is ready
app.whenReady().then(async () => {
  createWindow();
  await deviceManager.initialize();
  
  // Set up IPC handler for device messages
  ipcMain.on('device-message', (event, message) => {
    // Find the device ID associated with this window
    let deviceId = null;
    for (const [id, device] of deviceManager.devices.entries()) {
      if (device.window.webContents === event.sender) {
        deviceId = id;
        break;
      }
    }
    
    if (!deviceId) {
      console.warn('Received message from unknown device window');
      return;
    }
    
    // Handle the message based on its type
    switch (message.type) {
      case 'device-state':
        deviceManager.broadcastDeviceState(deviceId, message.state);
        break;
      case 'console-output':
        deviceManager.broadcastConsoleOutput(deviceId, message.text);
        break;
      case 'console-error':
        deviceManager.broadcastConsoleError(deviceId, message.text);
        break;
      case 'repl-output':
        deviceManager.broadcastReplOutput(deviceId, message.result);
        break;
      case 'code-loaded':
      case 'code-executed':
        console.log(`Device ${deviceId}: ${message.type}`, message);
        break;
      case 'error':
        console.error(`Error in device ${deviceId}:`, message);
        break;
      default:
        console.log(`Device ${deviceId} sent message:`, message);
    }
  });
});
