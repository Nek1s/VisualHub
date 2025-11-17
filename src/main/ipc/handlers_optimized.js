// src/main/ipc/handlers_optimized.js
const { ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');
const chokidar = require('chokidar');

// Импорты наших оптимизированных модулей
const { ImageQueries, FolderQueries } = require('../db/queries');
const { ImageModel } = require('../db/models');
const FolderService = require('../services/FolderService');
const ValidationUtils = require('../utils/validation');
const CONSTANTS = require('../utils/constants');

// Создание необходимых директорий
[CONSTANTS.IMAGES_DIR, CONSTANTS.THUMBS_DIR, CONSTANTS.FOLDERS_DIR].forEach(dir => fs.mkdirSync(dir, { recursive: true }));

const folderService = new FolderService(CONSTANTS.FOLDERS_DIR);

// Инициализация системных папок при запуске
const initializeSystemFolders = () => {
  console.log('Инициализация системных папок...');

  // Синхронизируем все папки с файловой системой
  FolderQueries.syncPhysicalFolders(CONSTANTS.FOLDERS_DIR);

  console.log('Системные папки инициализированы');
};

// Вызываем инициализацию
initializeSystemFolders();

/**
 * Обработчик загрузки изображений
 */
ipcMain.handle('upload-image', async (event, fileBuffer, fileName, folderId) => {
  try {
    console.log('Получен запрос на загрузку:', fileName, 'в папку', folderId);

    const result = await ImageQueries.addImage(fileBuffer, fileName, folderId, path.dirname(CONSTANTS.IMAGES_DIR));

    console.log('Загружено успешно, ID:', result.id);
    return { success: true, id: result.id };

  } catch (error) {
    console.error('Ошибка загрузки:', error.message);
    return { success: false, error: error.message };
  }
});

/**
 * Обработчик получения изображений
 */
ipcMain.handle('get-images', async (event, folderId) => {
  try {
    console.log('Запрос изображений для папки:', folderId);
    return ImageModel.getByFolderId(folderId);
  } catch (error) {
    console.error('Ошибка получения изображений:', error.message);
    return [];
  }
});

/**
 * Обработчик получения URL изображения
 */
ipcMain.handle('get-image-url', (event, imagePath) => {
  console.log('URL для:', imagePath);
  if (!imagePath) {
    console.error('Путь к изображению не задан');
    return '';
  }
  return `file://${path.resolve(imagePath)}`;
});

/**
 * Обработчик создания папки
 */
ipcMain.handle('add-folder', async (event, name) => {
  try {
    console.log('Создание папки:', name);
    const result = await folderService.createFolder(name);
    return { success: true, ...result };
  } catch (error) {
    console.error('Ошибка создания папки:', error.message);
    return { success: false, error: error.message };
  }
});

/**
 * Обработчик удаления папки
 */
ipcMain.handle('delete-folder', async (event, folderId) => {
  try {
    console.log('Удаление папки:', folderId);
    await folderService.deleteFolder(folderId);
    return { success: true };
  } catch (error) {
    console.error('Ошибка удаления папки:', error.message);
    return { success: false, error: error.message };
  }
});

/**
 * Обработчик переименования папки
 */
ipcMain.handle('rename-folder', async (event, folderId, newName) => {
  try {
    console.log('Переименование папки:', folderId, 'в', newName);
    await folderService.renameFolder(folderId, newName);
    return { success: true };
  } catch (error) {
    console.error('Ошибка переименования папки:', error.message);
    return { success: false, error: error.message };
  }
});

/**
 * Обработчик получения всех папок
 */
ipcMain.handle('get-folders', async (event, sortBy) => {
  try {
    return await folderService.getAllFolders(sortBy);
  } catch (error) {
    console.error('Ошибка получения папок:', error.message);
    return [];
  }
});

/**
 * Настройка отслеживания изменений в папке folders для защиты системных папок
 */
const watcher = chokidar.watch(CONSTANTS.FOLDERS_DIR, CONSTANTS.WATCHER_CONFIG);

/**
 * Восстановление системной папки при удалении
 */
watcher.on('unlinkDir', (deletedPath) => {
  const folderName = path.basename(deletedPath);

  // Проверяем, была ли удалена системная папка
  if (['All', 'Uncategorized', 'Trash'].includes(folderName)) {
    console.log('Попытка удаления системной папки обнаружена, восстанавливаем:', folderName);

    // Восстанавливаем папку через небольшую задержку
    setTimeout(() => {
      folderService.restoreSystemFolder(folderName);
    }, 100);
  } else {
    console.log('Удалена пользовательская папка:', folderName);
    // Отправляем событие всем окнам для обновления интерфейса
    const { BrowserWindow } = require('electron');
    BrowserWindow.getAllWindows().forEach(window => {
      window.webContents.send('folders-changed');
    });
  }
});

/**
 * Обработка создания новых папок
 */
watcher.on('addDir', (path) => {
  console.log('Новая папка обнаружена:', path);
  // Отправляем событие всем окнам
  const { BrowserWindow } = require('electron');
  BrowserWindow.getAllWindows().forEach(window => {
    window.webContents.send('folders-changed');
  });
});

/**
 * Обработка переименования папок
 */
watcher.on('rename', (oldPath, newPath) => {
  console.log('Папка переименована:', oldPath, '->', newPath);
  // Отправляем событие всем окнам
  const { BrowserWindow } = require('electron');
  BrowserWindow.getAllWindows().forEach(window => {
    window.webContents.send('folders-changed');
  });
});

console.log('Оптимизированные обработчики IPC и file watcher запущены');
