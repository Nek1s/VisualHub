// src/main/services/import.js
const path = require('path');
const fs = require('fs');
const sharp = require('sharp');
const db = require('../db/database');
const CONSTANTS = require('../utils/constants');

/**
 * Сервис для импорта изображений
 */
class ImportService {
  constructor() {
    this.imagesDir = CONSTANTS.IMAGES_DIR;
    this.thumbsDir = CONSTANTS.THUMBS_DIR;
  }

  /**
   * Импортировать изображение из буфера
   */
  async importFromBuffer(fileBuffer, fileName, folderId = 2) {
    try {
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
      const filePath = path.join(this.imagesDir, uniqueName);
      const thumbnailPath = path.join(this.thumbsDir, `${baseName}_${timestamp}_thumb${ext}`);

      // Сохраняем оригинал
      await sharp(fileBuffer).toFile(filePath);

      // Создаем миниатюру
      await sharp(fileBuffer)
        .resize(CONSTANTS.THUMBNAIL_SIZE, CONSTANTS.THUMBNAIL_SIZE, { 
          fit: 'cover',
          withoutEnlargement: true 
        })
        .toFile(thumbnailPath);

      // Получаем метаданные
      const metadata = await sharp(filePath).metadata();
      
      // Сохраняем в БД
      const result = db.prepare(`
        INSERT INTO images (filePath, fileName, folderId, width, height, fileSize, thumbnailPath)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run(
        filePath,
        fileName,
        folderId,
        metadata.width || 0,
        metadata.height || 0,
        fileBuffer.length,
        thumbnailPath
      );

      console.log('Изображение импортировано:', fileName, 'ID:', result.lastInsertRowid);
      return { 
        success: true, 
        id: result.lastInsertRowid,
        filePath,
        thumbnailPath
      };

    } catch (error) {
      console.error('Ошибка импорта:', error.message);
      throw error;
    }
  }

  /**
   * Импортировать из файловой системы
   */
  async importFromFile(sourcePath, folderId = 2) {
    try {
      const fileName = path.basename(sourcePath);
      const fileBuffer = fs.readFileSync(sourcePath);
      return await this.importFromBuffer(fileBuffer, fileName, folderId);
    } catch (error) {
      console.error('Ошибка импорта файла:', error.message);
      throw error;
    }
  }

  /**
   * Импортировать из буфера обмена
   */
  async importFromClipboard(imageBuffer, folderId = 2) {
    try {
      const fileName = `clipboard_${Date.now()}.png`;
      return await this.importFromBuffer(imageBuffer, fileName, folderId);
    } catch (error) {
      console.error('Ошибка импорта из буфера:', error.message);
      throw error;
    }
  }

  /**
   * Проверить, поддерживается ли формат файла
   */
  isSupportedFormat(fileName) {
    const ext = path.extname(fileName).toLowerCase();
    return CONSTANTS.ALLOWED_IMAGE_EXTENSIONS.test(ext);
  }

  /**
   * Получить список поддерживаемых форматов
   */
  getSupportedFormats() {
    return ['jpg', 'jpeg', 'png', 'webp', 'gif'];
  }
}

module.exports = ImportService;