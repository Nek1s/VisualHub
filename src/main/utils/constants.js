// src/main/utils/constants.js
const path = require('path');
const { app } = require('electron');

/**
 * Константы приложения
 */
const CONSTANTS = {
  // Директории
  IMAGES_DIR: path.join(app.getPath('userData'), 'images'),
  THUMBS_DIR: path.join(app.getPath('userData'), 'thumbnails'),
  FOLDERS_DIR: path.join(app.getPath('userData'), 'folders'),

  // Системные папки
  SYSTEM_FOLDERS: {
    ALL: { id: 1, name: 'All', dirName: 'All' },
    UNCATEGORIZED: { id: 2, name: 'Uncategorized', dirName: 'Uncategorized' },
    TRASH: { id: 3, name: 'Trash', dirName: 'Trash' }
  },

  // Максимальная длина имени папки
  MAX_FOLDER_NAME_LENGTH: 50,

  // Разрешенные расширения изображений
  ALLOWED_IMAGE_EXTENSIONS: /\.(jpg|jpeg|png|webp|gif)$/i,

  // Размер миниатюр
  THUMBNAIL_SIZE: 200,

  // Настройки file watcher
  WATCHER_CONFIG: {
    ignored: /(^|[\/\\])\../, // игнорируем скрытые файлы
    persistent: true,
    ignoreInitial: true, // не отправляем события при запуске
    awaitWriteFinish: {
      stabilityThreshold: 2000,
      pollInterval: 100
    }
  }
};

module.exports = CONSTANTS;
