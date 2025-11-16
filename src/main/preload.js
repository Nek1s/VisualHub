const { contextBridge, ipcRenderer, shell } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  // Управление окном
  minimizeWindow: () => ipcRenderer.send('window-minimize'),
  maximizeWindow: () => ipcRenderer.send('window-maximize'),
  closeWindow: () => ipcRenderer.send('window-close'),
  
  // Методы для работы с папками
  getFolders: (sortBy) => ipcRenderer.invoke('get-folders', sortBy),
  addFolder: (name) => ipcRenderer.invoke('add-folder', name),
  renameFolder: (id, newName) => ipcRenderer.invoke('rename-folder', id, newName),
  deleteFolder: (id) => ipcRenderer.invoke('delete-folder', id),
  uploadImage: (fileBuffer, fileName, folderId = 2) => ipcRenderer.invoke('upload-image', fileBuffer, fileName, folderId),
  getImages: (folderId) => ipcRenderer.invoke('get-images', folderId),
  getImageUrl: (imagePath) => ipcRenderer.invoke('get-image-url', imagePath),
});