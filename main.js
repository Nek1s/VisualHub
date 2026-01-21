// src/main/main.js (полный обновленный файл)
const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');

// Подключаем обработчики IPC и БД
require('./ipc/handlers_optimized');
require('./db/database');

// Импортируем утилиту для миниатюр
const ThumbnailUtils = require('./utils/thumbnailUtils');

const createWindow = () => {
  const mainWindow = new BrowserWindow({
    width: 1200,
    height: 700,
    autoHideMenuBar: true,
    titleBarStyle: 'hidden',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
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
  
  // Проверяем и создаем недостающие миниатюры через 3 секунды после запуска
  setTimeout(async () => {
    console.log('Проверка недостающих миниатюр...');
    try {
      const createdCount = await ThumbnailUtils.checkAndCreateMissingThumbnails();
      if (createdCount > 0) {
        console.log(`✅ Создано ${createdCount} недостающих миниатюр`);
      } else {
        console.log('✅ Все миниатюры в порядке');
      }
    } catch (error) {
      console.error('❌ Ошибка проверки миниатюр:', error);
    }
  }, 3000);
  
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});