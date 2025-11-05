// src/main/ipc/handlers.js
const { ipcMain } = require('electron');

ipcMain.handle('get-images', async () => {
  return []; // пока пусто
});

ipcMain.handle('upload-image', async (event, fileBuffer, fileName) => {
  console.log('Получено изображение:', fileName);
  return { success: true };
});

ipcMain.handle('get-image-url', async (event, imagePath) => {
  return `file://${imagePath}`;
});