const { ipcMain, app } = require('electron');
const path = require('path');
const fs = require('fs');
const sharp = require('sharp');
const db = require('../db/database');

const IMAGES_DIR = path.join(app.getPath('userData'), 'images');
const THUMBS_DIR = path.join(app.getPath('userData'), 'thumbnails');
[IMAGES_DIR, THUMBS_DIR].forEach(dir => fs.mkdirSync(dir, { recursive: true }));

ipcMain.handle('upload-image', async (event, fileBuffer, fileName, folderId) => {
  console.log('Получен запрос на загрузку:', fileName, 'в папку', folderId); // Лог для отладки

  try {
    const ext = path.extname(fileName).toLowerCase();
    if (!ext.match(/\.(jpg|jpeg|png|webp|gif)$/i)) throw new Error('Не изображение');

    const baseName = path.basename(fileName, ext);
    const timestamp = Date.now();
    const uniqueName = `${baseName}_${timestamp}${ext}`;
    const filePath = path.join(IMAGES_DIR, uniqueName);
    const thumbPath = path.join(THUMBS_DIR, `${baseName}_${timestamp}_thumb${ext}`);

    await sharp(fileBuffer).toFile(filePath);
    await sharp(fileBuffer).resize(200, 200, { fit: 'cover' }).toFile(thumbPath);

    const result = db.prepare(`
      INSERT INTO images (filePath, fileName, thumbnailPath, folderId, createdAt, modifiedAt)
      VALUES (?, ?, ?, ?, datetime('now'), datetime('now'))
    `).run(filePath, fileName, thumbPath, folderId);

    console.log('Загружено успешно, ID:', result.lastInsertRowid); // Лог успеха

    return { success: true, id: result.lastInsertRowid };
  } catch (error) {
    console.error('Ошибка загрузки:', error.message); // Лог ошибки
    return { success: false, error: error.message };
  }
});

ipcMain.handle('get-images', async (event, folderId) => {
  console.log('Запрос изображений для папки:', folderId);
  return db.prepare(`
    SELECT * FROM images WHERE folderId = ? ORDER BY createdAt DESC
  `).all(folderId);
});

ipcMain.handle('get-image-url', (event, imagePath) => {
  console.log('URL для:', imagePath);
  return `file://${path.resolve(imagePath)}`;
});