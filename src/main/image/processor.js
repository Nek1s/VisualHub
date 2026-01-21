// src/main/services/processor.js
const sharp = require('sharp');
const fs = require('fs');
const path = require('path');
const db = require('../db/database');

/**
 * Сервис для обработки изображений
 */
class ImageProcessor {
  /**
   * Обрезать изображение
   */
  async crop(imageId, cropOptions) {
    try {
      const { x, y, width, height } = cropOptions;
      const image = db.prepare('SELECT * FROM images WHERE id = ?').get(imageId);
      
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
      await this._updateThumbnail(imageId, newFilePath);

      console.log('Изображение обрезано:', imageId);
      return { success: true, newFilePath };

    } catch (error) {
      console.error('Ошибка обрезки:', error.message);
      throw error;
    }
  }

  /**
   * Повернуть изображение
   */
  async rotate(imageId, angle) {
    try {
      const image = db.prepare('SELECT * FROM images WHERE id = ?').get(imageId);
      
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
      await this._updateThumbnail(imageId, newFilePath);

      // Удаляем старый файл
      this._deleteOldFile(originalPath, newFilePath);

      console.log('Изображение повернуто:', imageId, 'на угол:', angle);
      return { success: true, newFilePath };

    } catch (error) {
      console.error('Ошибка поворота:', error.message);
      throw error;
    }
  }

  /**
   * Изменить размер изображения
   */
  async resize(imageId, width, height) {
    try {
      const image = db.prepare('SELECT * FROM images WHERE id = ?').get(imageId);
      
      if (!image) {
        throw new Error('Изображение не найдено');
      }

      const originalPath = image.filePath;
      const ext = path.extname(originalPath);
      const timestamp = Date.now();
      const newFileName = `${path.basename(originalPath, ext)}_resized_${timestamp}${ext}`;
      const newFilePath = path.join(path.dirname(originalPath), newFileName);

      // Выполняем изменение размера
      await sharp(originalPath)
        .resize(width, height, { fit: 'contain' })
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
      await this._updateThumbnail(imageId, newFilePath);

      // Удаляем старый файл
      this._deleteOldFile(originalPath, newFilePath);

      console.log('Размер изображения изменен:', imageId);
      return { success: true, newFilePath };

    } catch (error) {
      console.error('Ошибка изменения размера:', error.message);
      throw error;
    }
  }

  /**
   * Обновить миниатюру изображения
   */
  async _updateThumbnail(imageId, imagePath) {
    try {
      const image = db.prepare('SELECT * FROM images WHERE id = ?').get(imageId);
      if (!image || !image.thumbnailPath) return;

      await sharp(imagePath)
        .resize(200, 200, { fit: 'cover' })
        .toFile(image.thumbnailPath);

    } catch (error) {
      console.warn('Не удалось обновить миниатюру:', error.message);
    }
  }

  /**
   * Удалить старый файл, если он отличается от нового
   */
  _deleteOldFile(oldPath, newPath) {
    try {
      if (oldPath !== newPath && fs.existsSync(oldPath)) {
        fs.unlinkSync(oldPath);
        console.log('Старый файл удален:', oldPath);
      }
    } catch (error) {
      console.warn('Не удалось удалить старый файл:', error.message);
    }
  }

  /**
   * Получить метаданные изображения
   */
  async getMetadata(imageId) {
    try {
      const image = db.prepare('SELECT * FROM images WHERE id = ?').get(imageId);
      if (!image || !image.filePath) return null;

      return await sharp(image.filePath).metadata();
    } catch (error) {
      console.error('Ошибка получения метаданных:', error.message);
      return null;
    }
  }
}

module.exports = ImageProcessor;