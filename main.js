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
      nodeIntegration: true, // Отключено для безопасности
    }
  });

  // Запуск приложения с билда
  // mainWindow.loadFile(path.join(__dirname, './build/index.html'));
  
  // Режим разработчика, просто F12 как в браузере будет открываться в реакте, удобно когда ничего не грузит.
  // mainWindow.webContents.openDevTools();

  // Запуск приложения с реакта. Сначала запустить реакт, потом electron
  mainWindow.loadURL('http://localhost:3000') 
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