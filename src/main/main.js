// src/main/main.js
const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');

// Подключаем обработчики IPC и БД
require('./ipc/handlers_optimized');
require('./db/database');

const createWindow = () => {
  const mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    autoHideMenuBar: true,
    titleBarStyle: 'hidden',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false, // ← ОБЯЗАТЕЛЬНО false!
      webSecurity: false,
      allowRunningInsecureContent: true
    },
  });

  // Загружаем собранный React (с билда)
  // mainWindow.loadFile(path.join(__dirname, '../../build/index.html'));

  // Режим разработчика (раскомментируй при отладке)
  mainWindow.webContents.openDevTools();

  // Запуск приложения с реакта. Сначала запустить реакт, потом electron
  mainWindow.loadURL('http://localhost:3000');
};

// Обработчики для управления окном
ipcMain.on('window-minimize', (event) => {
  const window = BrowserWindow.fromWebContents(event.sender);
  if (window) window.minimize();
});

ipcMain.on('window-maximize', (event) => {
  const window = BrowserWindow.fromWebContents(event.sender);
  if (window) {
    if (window.isMaximized()) {
      window.unmaximize();
    } else {
      window.maximize();
    }
  }
});

ipcMain.on('window-close', (event) => {
  const window = BrowserWindow.fromWebContents(event.sender);
  if (window) window.close();
});

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});