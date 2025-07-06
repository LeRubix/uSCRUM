const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electron', {
  onAppReady: (callback) => ipcRenderer.once('app-ready', callback)
}); 