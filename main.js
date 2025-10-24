const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('node:path');

// Создание окна
const createWindow = () => {
  const mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'), // Подключаем preload скрипт
      contextIsolation: true, // Включено для безопасности
      nodeIntegration: false, // Отключено для безопасности
    }
  });

  // Запуск приложения с билда
  mainWindow.loadFile(path.join(__dirname, './build/index.html'));
  
  // Для разработки можно раскомментировать следующую строку, чтобы открыть инструменты разработчика
  // mainWindow.webContents.openDevTools();

  // Запуск приложения с хоста реакта. Сначала запустить реакт, потом electron.
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