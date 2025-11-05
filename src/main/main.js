// src/main/main.js
const { app, BrowserWindow } = require('electron');
const path = require('path');

// Подключаем обработчики IPC и БД
require('./ipc/handlers');     // ← добавим позже
require('./db/database');      // ← добавим позже

const createWindow = () => {
  const mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false, // ← ОБЯЗАТЕЛЬНО false!
    },
  });

  // Загружаем собранный React (с билда)
  mainWindow.loadFile(path.join(__dirname, '../../build/index.html'));

  // Режим разработчика (раскомментируй при отладке)
  // mainWindow.webContents.openDevTools();

  // Запуск приложения с реакта. Сначала запустить реакт, потом electron
  // mainWindow.loadURL('http://localhost:3000')
};

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});