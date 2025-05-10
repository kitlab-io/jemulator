// See the Electron documentation for details on how to use preload scripts:
// https://www.electronjs.org/docs/latest/tutorial/process-model#preload-scripts

const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  // Send messages to main process
  sendToMain: (message) => ipcRenderer.send('device-message', message),
  
  // Receive messages from main process
  onMessage: (callback) => {
    ipcRenderer.on('device-message', (_, message) => callback(message));
    return () => {
      ipcRenderer.removeAllListeners('device-message');
    };
  },
  
  // Receive component events from main process
  onComponentEvent: (callback) => {
    ipcRenderer.on('component-event', (_, message) => callback(message));
    return () => {
      ipcRenderer.removeAllListeners('component-event');
    };
  }
});
