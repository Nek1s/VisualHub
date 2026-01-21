// src/main/preload.js
const { contextBridge, ipcRenderer, shell } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  // ============= Управление окном =============
  minimizeWindow: () => ipcRenderer.send('window-minimize'),
  maximizeWindow: () => ipcRenderer.send('window-maximize'),
  closeWindow: () => ipcRenderer.send('window-close'),
  
  // ============= Методы для работы с папками =============
  getFolders: (sortBy) => ipcRenderer.invoke('get-folders', sortBy),
  addFolder: (name) => ipcRenderer.invoke('add-folder', name),
  renameFolder: (id, newName) => ipcRenderer.invoke('rename-folder', id, newName),
  deleteFolder: (id) => ipcRenderer.invoke('delete-folder', id),
  
  regenerateThumbnails: () => ipcRenderer.invoke('regenerate-thumbnails'),

  updateImageField: (imageId, field, value) => ipcRenderer.invoke('update-image-field', imageId, field, value),
  exportImage: (imageId) => ipcRenderer.invoke('export-image', imageId),
  
  getImageById: (imageId) => ipcRenderer.invoke('get-image-by-id', imageId),

  // ============= Изображения: загрузка и получение =============
  uploadImage: (fileBuffer, fileName, folderId = 2) => ipcRenderer.invoke('upload-image', fileBuffer, fileName, folderId),
  getImages: (folderId) => ipcRenderer.invoke('get-images', folderId),
  getImageUrl: (imagePath) => ipcRenderer.invoke('get-image-url', imagePath),
  
  // ============= Управление удалением и корзиной =============
  moveToTrash: (imageId) => ipcRenderer.invoke('move-to-trash', imageId),
  restoreFromTrash: (imageId, targetFolderId) => ipcRenderer.invoke('restore-from-trash', imageId, targetFolderId),
  deletePermanently: (imageId) => ipcRenderer.invoke('delete-permanently', imageId),
  emptyTrash: () => ipcRenderer.invoke('empty-trash'),
  moveImage: (imageId, newFolderId) => ipcRenderer.invoke('move-image', imageId, newFolderId),
  getTrashImages: () => ipcRenderer.invoke('get-trash-images'),
  getTrashCount: () => ipcRenderer.invoke('get-trash-count'),
  
  // ============= Редактирование изображений =============
  cropImage: (imageId, cropOptions) => ipcRenderer.invoke('crop-image', imageId, cropOptions),
  rotateImage: (imageId, angle) => ipcRenderer.invoke('rotate-image', imageId, angle),
  
  // ============= Вспомогательные методы =============
  openInExplorer: (path) => {
    if (path) {
      shell.showItemInFolder(path);
    }
  },
  
  openUrl: (url) => {
    shell.openExternal(url);
  }
});

// Обработчики событий от main процесса
ipcRenderer.on('folders-changed', () => {
  // Отправляем событие в React приложение
  window.dispatchEvent(new Event('folders-changed'));
});

console.log('Preload script loaded successfully');