// See the Electron documentation for details on how to use preload scripts:
// https://www.electronjs.org/docs/latest/tutorial/process-model#preload-scripts
const { contextBridge, ipcRenderer } = require("electron/renderer");

contextBridge.exposeInMainWorld("test", {
    readFile: (filePath) => ipcRenderer.send("readfile", filePath),
    onContent: (callback) => ipcRenderer.on("content", (_event, content) => callback(content))
});
