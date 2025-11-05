// src/main/preload.js
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  // Импорт изображения
  uploadImage: (fileBuffer, fileName) => 
    ipcRenderer.invoke('upload-image', fileBuffer, fileName),

  // Получить все изображения
  getImages: () => 
    ipcRenderer.invoke('get-images'),

  // Получить URL для отображения
  getImageUrl: (imagePath) => 
    ipcRenderer.invoke('get-image-url', imagePath),
});