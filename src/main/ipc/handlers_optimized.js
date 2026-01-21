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

// Импорты новых сервисов
const db = require('../db/database');
const sharp = require('sharp');
const ThumbnailUtils = require('../utils/thumbnailUtils');

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

// ==================== СУЩЕСТВУЮЩИЕ ОБРАБОТЧИКИ ====================

ipcMain.handle('upload-image', async (event, fileBuffer, fileName, folderId) => {
  try {
    console.log('Получен запрос на загрузку:', fileName, 'в папку', folderId);

    // Запрещаем загрузку в корзину
    if (folderId === 3) {
      throw new Error('Нельзя загружать изображения напрямую в корзину');
    }

    // Валидация расширения
    const ext = path.extname(fileName).toLowerCase();
    if (!CONSTANTS.ALLOWED_IMAGE_EXTENSIONS.test(ext)) {
      throw new Error('Неподдерживаемый формат файла');
    }

    // Генерация уникального имени
    const baseName = path.basename(fileName, ext);
    const timestamp = Date.now();
    const uniqueName = `${baseName}_${timestamp}${ext}`;
    
    // Пути для сохранения
    const filePath = path.join(CONSTANTS.IMAGES_DIR, uniqueName);
    const thumbnailPath = path.join(CONSTANTS.THUMBS_DIR, `${baseName}_${timestamp}_thumb${ext}`);

    console.log('Сохраняем оригинал:', filePath);
    console.log('Сохраняем миниатюру:', thumbnailPath);

    // Сохраняем оригинальный файл
    fs.writeFileSync(filePath, fileBuffer);

    // Создаем миниатюру используя ThumbnailUtils
    const thumbCreated = await ThumbnailUtils.createThumbnail(filePath, thumbnailPath);
    
    if (!thumbCreated) {
      console.warn('Не удалось создать миниатюру, используем оригинал');
      fs.copyFileSync(filePath, thumbnailPath);
    }

    // Получаем метаданные
    let width = 0, height = 0, fileSize = fileBuffer.length;
    try {
      const metadata = await sharp(filePath).metadata();
      width = metadata.width || 0;
      height = metadata.height || 0;
    } catch (metaError) {
      console.warn('Не удалось получить метаданные:', metaError.message);
    }

    // Сохраняем в БД с title равным оригинальному имени файла
    const result = db.prepare(`
      INSERT INTO images (filePath, fileName, title, folderId, width, height, fileSize, thumbnailPath)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      filePath,
      fileName,  // Имя файла с расширением
      baseName,  // Title - имя без расширения
      folderId,
      width,
      height,
      fileSize,
      thumbnailPath
    );

    console.log('Изображение сохранено в БД, ID:', result.lastInsertRowid);
    return { success: true, id: result.lastInsertRowid };

  } catch (error) {
    console.error('Ошибка загрузки:', error.message);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('get-image-by-id', async (event, imageId) => {
  try {
    console.log('Запрос изображения по ID:', imageId);
    
    const image = db.prepare('SELECT * FROM images WHERE id = ?').get(imageId);
    if (!image) {
      throw new Error('Изображение не найдено');
    }
    
    return image;
  } catch (error) {
    console.error('Ошибка получения изображения по ID:', error.message);
    throw error;
  }
});

/**
 * Обработчик получения изображений
 */
ipcMain.handle('get-images', async (event, folderId) => {
  try {
    console.log(`📁 Запрос изображений для папки: ${folderId}`);
    
    let images = [];
    
    if (folderId === 1) { // All
      images = db.prepare(`
        SELECT *, COALESCE(title, fileName) as displayName FROM images 
        WHERE folderId != 3 
        ORDER BY createdAt DESC
      `).all();
    } else if (folderId === 2) { // Uncategorized
      images = db.prepare(`
        SELECT *, COALESCE(title, fileName) as displayName FROM images 
        WHERE (folderId IS NULL OR folderId = 2) AND folderId != 3 
        ORDER BY createdAt DESC
      `).all();
    } else if (folderId === 3) { // Trash
      images = db.prepare(`
        SELECT *, COALESCE(title, fileName) as displayName FROM images 
        WHERE folderId = 3 
        ORDER BY modifiedAt DESC
      `).all();
    } else {
      images = db.prepare(`
        SELECT *, COALESCE(title, fileName) as displayName FROM images 
        WHERE folderId = ? 
        ORDER BY createdAt DESC
      `).all(folderId);
    }
    
    console.log(`📊 Найдено ${images.length} изображений в папке ${folderId}`);
    return images;
  } catch (error) {
    console.error('❌ Ошибка получения изображений:', error.message);
    return [];
  }
});

/**
 * Обработчик получения URL изображения
 */
ipcMain.handle('get-image-url', (event, imagePath) => {
  try {
    if (!imagePath) {
      console.warn('⚠️  Путь к изображению не указан');
      return '';
    }
    
    // Проверяем существование файла
    if (!fs.existsSync(imagePath)) {
      console.warn(`⚠️  Файл не существует: ${imagePath}`);
      return '';
    }
    
    // Нормализуем путь для Windows
    const normalizedPath = path.resolve(imagePath);
    const url = `file:///${normalizedPath.replace(/\\/g, '/')}`;
    
    console.log(`🔗 Создан URL для: ${imagePath}`);
    console.log(`   → ${url.substring(0, 100)}...`);
    
    return url;
  } catch (error) {
    console.error('❌ Ошибка создания URL:', error.message);
    return '';
  }
});

ipcMain.handle('regenerate-thumbnails', async () => {
  try {
    const ThumbnailUtils = require('../utils/thumbnailUtils');
    const count = await ThumbnailUtils.createThumbnailsForAll();
    return { success: true, count };
  } catch (error) {
    console.error('Ошибка пересоздания миниатюр:', error.message);
    return { success: false, error: error.message };
  }
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
 * Обновить поле изображения
 */
ipcMain.handle('update-image-field', async (event, imageId, field, value) => {
  try {
    console.log(`Обновление поля ${field} для изображения ${imageId}: ${value}`);
    
    // Проверяем допустимость поля
    const allowedFields = ['title', 'description', 'link'];
    if (!allowedFields.includes(field)) {
      throw new Error(`Недопустимое поле: ${field}`);
    }
    
    // Получаем текущую информацию об изображении
    const image = db.prepare('SELECT * FROM images WHERE id = ?').get(imageId);
    if (!image) {
      throw new Error('Изображение не найдено');
    }
    
    let oldFilePath = image.filePath;
    let oldFileName = image.fileName;
    
    // Если меняем title, нужно переименовать файл
    if (field === 'title' && value && value.trim() !== '') {
      const newTitle = value.trim();
      const ext = path.extname(oldFilePath);
      const dir = path.dirname(oldFilePath);
      
      // Генерируем новое имя файла на основе title
      // Убираем недопустимые символы в именах файлов
      const sanitizedTitle = newTitle
        .replace(/[<>:"/\\|?*]/g, '')
        .replace(/\s+/g, '_')
        .substring(0, 100);
      
      const newFileName = `${sanitizedTitle}${ext}`;
      const newFilePath = path.join(dir, newFileName);
      
      // Проверяем, не существует ли уже файл с таким именем
      let counter = 1;
      let finalNewFilePath = newFilePath;
      let finalNewFileName = newFileName;
      
      while (fs.existsSync(finalNewFilePath) && finalNewFilePath !== oldFilePath) {
        const baseName = path.basename(sanitizedTitle, ext);
        finalNewFileName = `${baseName}_${counter}${ext}`;
        finalNewFilePath = path.join(dir, finalNewFileName);
        counter++;
      }
      
      // Переименовываем основной файл
      if (oldFilePath !== finalNewFilePath) {
        fs.renameSync(oldFilePath, finalNewFilePath);
        console.log(`Файл переименован: ${oldFilePath} -> ${finalNewFilePath}`);
      }
      
      // Также переименовываем миниатюру, если она существует
      if (image.thumbnailPath && fs.existsSync(image.thumbnailPath)) {
        const thumbDir = path.dirname(image.thumbnailPath);
        const thumbExt = path.extname(image.thumbnailPath);
        const newThumbPath = path.join(thumbDir, `${path.basename(finalNewFileName, thumbExt)}_thumb${thumbExt}`);
        
        // Проверяем, не существует ли уже миниатюра с таким именем
        let thumbCounter = 1;
        let finalNewThumbPath = newThumbPath;
        
        while (fs.existsSync(finalNewThumbPath) && finalNewThumbPath !== image.thumbnailPath) {
          const thumbBaseName = path.basename(finalNewFileName, thumbExt);
          finalNewThumbPath = path.join(thumbDir, `${thumbBaseName}_thumb_${thumbCounter}${thumbExt}`);
          thumbCounter++;
        }
        
        fs.renameSync(image.thumbnailPath, finalNewThumbPath);
        console.log(`Миниатюра переименована: ${image.thumbnailPath} -> ${finalNewThumbPath}`);
        
        // Обновляем путь к миниатюре в БД
        db.prepare('UPDATE images SET thumbnailPath = ? WHERE id = ?').run(finalNewThumbPath, imageId);
      }
      
      // Обновляем filePath и fileName в БД
      db.prepare('UPDATE images SET filePath = ?, fileName = ? WHERE id = ?').run(
        finalNewFilePath,
        finalNewFileName,
        imageId
      );
      
      // Обновляем title
      db.prepare('UPDATE images SET title = ?, modifiedAt = CURRENT_TIMESTAMP WHERE id = ?').run(newTitle, imageId);
      
      console.log(`Title и имя файла обновлены для изображения ${imageId}`);
      
    } else {
      // Для других полей просто обновляем значение в БД
      db.prepare(`UPDATE images SET ${field} = ?, modifiedAt = CURRENT_TIMESTAMP WHERE id = ?`).run(value, imageId);
    }
    
    return { success: true };
  } catch (error) {
    console.error('❌ Ошибка обновления поля:', error.message);
    return { success: false, error: error.message };
  }
});

/**
 * Экспорт изображения
 */
ipcMain.handle('export-image', async (event, imageId) => {
  try {
    const image = db.prepare('SELECT * FROM images WHERE id = ?').get(imageId);
    if (!image) {
      throw new Error('Изображение не найдено');
    }

    const { dialog, BrowserWindow } = require('electron');
    const mainWindow = BrowserWindow.getFocusedWindow();

    // Определяем расширение файла
    const ext = path.extname(image.fileName) || '.png';
    
    const result = await dialog.showSaveDialog(mainWindow, {
      title: 'Экспорт изображения',
      defaultPath: path.basename(image.fileName, ext) + '_export' + ext,
      filters: [
        { name: 'Все изображения', extensions: ['jpg', 'jpeg', 'png', 'webp', 'gif'] },
        { name: 'JPEG', extensions: ['jpg', 'jpeg'] },
        { name: 'PNG', extensions: ['png'] },
        { name: 'WebP', extensions: ['webp'] }
      ]
    });

    if (result.canceled) {
      return { success: false, message: 'Экспорт отменен' };
    }

    const savePath = result.filePath;
    
    // Копируем файл
    fs.copyFileSync(image.filePath, savePath);
    
    console.log('Изображение экспортировано:', savePath);
    return { success: true, path: savePath };
  } catch (error) {
    console.error('Ошибка экспорта:', error.message);
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

// ==================== НОВЫЕ ОБРАБОТЧИКИ ДЛЯ УДАЛЕНИЯ ====================

/**
 * Получить информацию об изображении по ID
 */
function getImageInfo(id) {
  return db.prepare('SELECT * FROM images WHERE id = ?').get(id);
}

/**
 * Удалить файл если он существует
 */
function deleteFileIfExists(filePath) {
  try {
    if (filePath && fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      console.log('Файл удален:', filePath);
      return true;
    }
  } catch (error) {
    console.warn('Не удалось удалить файл:', filePath, error.message);
  }
  return false;
}

/**
 * Обработчик перемещения в корзину
 */
ipcMain.handle('move-to-trash', async (event, imageId) => {
  try {
    console.log('Перемещение в корзину:', imageId);
    
    const image = getImageInfo(imageId);
    if (!image) {
      throw new Error('Изображение не найдено');
    }
    
    // Обновляем folderId на 3 (Trash)
    db.prepare('UPDATE images SET folderId = 3, modifiedAt = CURRENT_TIMESTAMP WHERE id = ?').run(imageId);
    console.log('Изображение перемещено в корзину:', imageId);
    
    return { success: true };
  } catch (error) {
    console.error('Ошибка перемещения в корзину:', error.message);
    return { success: false, error: error.message };
  }
});

/**
 * Обработчик восстановления из корзины
 */
ipcMain.handle('restore-from-trash', async (event, imageId, targetFolderId = 2) => {
  try {
    console.log('Восстановление из корзины:', imageId, 'в папку', targetFolderId);
    
    const image = getImageInfo(imageId);
    if (!image) {
      throw new Error('Изображение не найдено');
    }
    
    // Проверяем, что изображение в корзине
    if (image.folderId !== 3) {
      throw new Error('Изображение не в корзине');
    }
    
    // Восстанавливаем в указанную папку (по умолчанию Uncategorized)
    db.prepare('UPDATE images SET folderId = ?, modifiedAt = CURRENT_TIMESTAMP WHERE id = ?').run(targetFolderId, imageId);
    console.log('Изображение восстановлено из корзины:', imageId);
    
    return { success: true };
  } catch (error) {
    console.error('Ошибка восстановления из корзины:', error.message);
    return { success: false, error: error.message };
  }
});

/**
 * Обработчик окончательного удаления
 */
ipcMain.handle('delete-permanently', async (event, imageId) => {
  try {
    console.log('Окончательное удаление:', imageId);
    
    const image = getImageInfo(imageId);
    if (!image) {
      throw new Error('Изображение не найдено');
    }

    // Проверяем, что изображение в корзине
    if (image.folderId !== 3) {
      throw new Error('Можно удалять только изображения из корзины');
    }

    // Удаляем файл изображения
    deleteFileIfExists(image.filePath);

    // Удаляем миниатюру
    deleteFileIfExists(image.thumbnailPath);

    // Удаляем запись из БД
    db.prepare('DELETE FROM images WHERE id = ?').run(imageId);
    
    // Также удаляем связи с тегами
    db.prepare('DELETE FROM image_tags WHERE imageId = ?').run(imageId);
    
    console.log('Изображение окончательно удалено:', imageId);
    return { success: true };
  } catch (error) {
    console.error('Ошибка окончательного удаления:', error.message);
    return { success: false, error: error.message };
  }
});

/**
 * Обработчик очистки корзины
 */
ipcMain.handle('empty-trash', async (event) => {
  try {
    console.log('Очистка корзины');
    
    // Получаем все изображения из корзины
    const images = db.prepare('SELECT * FROM images WHERE folderId = 3').all();
    
    let deletedCount = 0;
    for (const image of images) {
      // Удаляем файлы
      deleteFileIfExists(image.filePath);
      deleteFileIfExists(image.thumbnailPath);
      deletedCount++;
    }
    
    // Удаляем записи из БД
    db.prepare('DELETE FROM images WHERE folderId = 3').run();
    db.prepare('DELETE FROM image_tags WHERE imageId IN (SELECT id FROM images WHERE folderId = 3)').run();
    
    console.log(`Корзина очищена, удалено ${deletedCount} изображений`);
    return { success: true, deletedCount };
  } catch (error) {
    console.error('Ошибка очистки корзины:', error.message);
    return { success: false, error: error.message };
  }
});

/**
 * Обработчик перемещения изображения
 */
ipcMain.handle('move-image', async (event, imageId, newFolderId) => {
  try {
    console.log('Перемещение изображения:', imageId, 'в папку', newFolderId);
    
    const image = getImageInfo(imageId);
    if (!image) {
      throw new Error('Изображение не найдено');
    }
    
    // Проверяем, что папка существует
    const folder = db.prepare('SELECT * FROM folders WHERE id = ?').get(newFolderId);
    if (!folder && newFolderId > 3) { // Системные папки всегда существуют
      throw new Error('Папка назначения не найдена');
    }
    
    // Обновляем folderId
    db.prepare('UPDATE images SET folderId = ?, modifiedAt = CURRENT_TIMESTAMP WHERE id = ?').run(newFolderId, imageId);
    console.log('Изображение перемещено:', imageId, '→ папка', newFolderId);
    
    return { success: true };
  } catch (error) {
    console.error('Ошибка перемещения изображения:', error.message);
    return { success: false, error: error.message };
  }
});

/**
 * Обработчик получения изображений из корзины
 */
ipcMain.handle('get-trash-images', async (event) => {
  try {
    return db.prepare(`
      SELECT 
        i.*,
        GROUP_CONCAT(t.name) as tags
      FROM images i
      LEFT JOIN image_tags it ON i.id = it.imageId
      LEFT JOIN tags t ON it.tagId = t.id
      WHERE i.folderId = 3
      GROUP BY i.id
      ORDER BY i.modifiedAt DESC
    `).all();
  } catch (error) {
    console.error('Ошибка получения изображений из корзины:', error.message);
    return [];
  }
});

/**
 * Обработчик получения количества изображений в корзине
 */
ipcMain.handle('get-trash-count', async (event) => {
  try {
    return db.prepare('SELECT COUNT(*) as count FROM images WHERE folderId = 3').get().count || 0;
  } catch (error) {
    console.error('Ошибка получения количества изображений в корзине:', error.message);
    return 0;
  }
});

/**
 * Обработчик обрезки изображения
 */
ipcMain.handle('crop-image', async (event, imageId, cropOptions) => {
  try {
    console.log('Обрезка изображения:', imageId, cropOptions);
    
    const { x, y, width, height } = cropOptions;
    const image = getImageInfo(imageId);
    
    if (!image) {
      throw new Error('Изображение не найдено');
    }

    const originalPath = image.filePath;
    const ext = path.extname(originalPath);
    const timestamp = Date.now();
    const newFileName = `${path.basename(originalPath, ext)}_cropped_${timestamp}${ext}`;
    const newFilePath = path.join(path.dirname(originalPath), newFileName);

    // Выполняем обрезку
    await sharp(originalPath)
      .extract({ left: x, top: y, width, height })
      .toFile(newFilePath);

    // Обновляем информацию в БД
    const metadata = await sharp(newFilePath).metadata();
    db.prepare(`
      UPDATE images 
      SET filePath = ?, fileName = ?, width = ?, height = ?, fileSize = ?, modifiedAt = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(
      newFilePath,
      newFileName,
      metadata.width,
      metadata.height,
      fs.statSync(newFilePath).size,
      imageId
    );

    // Обновляем миниатюру
    try {
      await sharp(newFilePath)
        .resize(200, 200, { fit: 'cover' })
        .toFile(image.thumbnailPath);
    } catch (thumbError) {
      console.warn('Не удалось обновить миниатюру:', thumbError.message);
    }

    console.log('Изображение обрезано:', imageId);
    return { success: true, newFilePath };

  } catch (error) {
    console.error('Ошибка обрезки:', error.message);
    return { success: false, error: error.message };
  }
});

/**
 * Обработчик поворота изображения
 */
ipcMain.handle('rotate-image', async (event, imageId, angle) => {
  try {
    console.log('Поворот изображения:', imageId, 'на угол', angle);
    
    const image = getImageInfo(imageId);
    
    if (!image) {
      throw new Error('Изображение не найдено');
    }

    const originalPath = image.filePath;
    const ext = path.extname(originalPath);
    const timestamp = Date.now();
    const newFileName = `${path.basename(originalPath, ext)}_rotated_${timestamp}${ext}`;
    const newFilePath = path.join(path.dirname(originalPath), newFileName);

    // Выполняем поворот
    await sharp(originalPath)
      .rotate(angle)
      .toFile(newFilePath);

    // Обновляем информацию в БД
    const metadata = await sharp(newFilePath).metadata();
    db.prepare(`
      UPDATE images 
      SET filePath = ?, fileName = ?, width = ?, height = ?, fileSize = ?, modifiedAt = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(
      newFilePath,
      newFileName,
      metadata.width,
      metadata.height,
      fs.statSync(newFilePath).size,
      imageId
    );

    // Обновляем миниатюру
    try {
      await sharp(newFilePath)
        .resize(200, 200, { fit: 'cover' })
        .toFile(image.thumbnailPath);
    } catch (thumbError) {
      console.warn('Не удалось обновить миниатюру:', thumbError.message);
    }

    // Удаляем старый файл, если он отличается от нового
    if (originalPath !== newFilePath && fs.existsSync(originalPath)) {
      try {
        fs.unlinkSync(originalPath);
        console.log('Старый файл удален:', originalPath);
      } catch (deleteError) {
        console.warn('Не удалось удалить старый файл:', deleteError.message);
      }
    }

    console.log('Изображение повернуто:', imageId, 'на угол:', angle);
    return { success: true, newFilePath };

  } catch (error) {
    console.error('Ошибка поворота:', error.message);
    return { success: false, error: error.message };
  }
});

// ==================== FILE WATCHER ====================

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