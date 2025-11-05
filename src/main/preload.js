const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  uploadImage: (fileBuffer, fileName, folderId = 2) => ipcRenderer.invoke('upload-image', fileBuffer, fileName, folderId),
  getImages: (folderId) => ipcRenderer.invoke('get-images', folderId),
  getImageUrl: (imagePath) => ipcRenderer.invoke('get-image-url', imagePath),
});