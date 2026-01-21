// src/main/services/storage.js
const db = require('../db/database');
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const CONSTANTS = require('../utils/constants');

/**
 * Сервис для работы с хранением изображений
 */
class StorageService {
  constructor() {
    this.imagesDir = CONSTANTS.IMAGES_DIR;
    this.thumbsDir = CONSTANTS.THUMBS_DIR;
    this.foldersDir = CONSTANTS.FOLDERS_DIR;
    
    // Создаем директории при инициализации
    [this.imagesDir, this.thumbsDir, this.foldersDir].forEach(dir => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    });
  }

  /**
   * Получить информацию об изображении по ID
   */
  getImageInfo(id) {
    return db.prepare(`
      SELECT 
        i.*,
        GROUP_CONCAT(t.name) as tags
      FROM images i
      LEFT JOIN image_tags it ON i.id = it.imageId
      LEFT JOIN tags t ON it.tagId = t.id
      WHERE i.id = ?
      GROUP BY i.id
    `).get(id);
  }

  /**
   * Переместить изображение в корзину
   */
  moveToTrash(imageId) {
    const image = this.getImageInfo(imageId);
    if (!image) {
      throw new Error('Изображение не найдено');
    }
    
    db.prepare('UPDATE images SET folderId = 3, modifiedAt = CURRENT_TIMESTAMP WHERE id = ?').run(imageId);
    console.log('Изображение перемещено в корзину:', imageId);
    return true;
  }

  /**
   * Восстановить изображение из корзины
   */
  restoreFromTrash(imageId, targetFolderId = 2) {
    const image = this.getImageInfo(imageId);
    if (!image) {
      throw new Error('Изображение не найдено');
    }
    
    if (image.folderId !== 3) {
      throw new Error('Изображение не в корзине');
    }
    
    db.prepare('UPDATE images SET folderId = ?, modifiedAt = CURRENT_TIMESTAMP WHERE id = ?').run(targetFolderId, imageId);
    console.log('Изображение восстановлено из корзины:', imageId);
    return true;
  }

  /**
   * Окончательно удалить изображение
   */
  deletePermanently(imageId) {
    const image = this.getImageInfo(imageId);
    if (!image) {
      throw new Error('Изображение не найдено');
    }

    if (image.folderId !== 3) {
      throw new Error('Можно удалять только изображения из корзины');
    }

    // Удаляем физические файлы
    this._deleteFileIfExists(image.filePath);
    this._deleteFileIfExists(image.thumbnailPath);

    // Удаляем из БД
    db.prepare('DELETE FROM images WHERE id = ?').run(imageId);
    db.prepare('DELETE FROM image_tags WHERE imageId = ?').run(imageId);
    
    console.log('Изображение окончательно удалено:', imageId);
    return true;
  }

  /**
   * Очистить корзину
   */
  emptyTrash() {
    try {
      const images = db.prepare('SELECT * FROM images WHERE folderId = 3').all();
      
      for (const image of images) {
        this._deleteFileIfExists(image.filePath);
        this._deleteFileIfExists(image.thumbnailPath);
      }
      
      // Удаляем записи из БД
      db.prepare('DELETE FROM images WHERE folderId = 3').run();
      db.prepare('DELETE FROM image_tags WHERE imageId IN (SELECT id FROM images WHERE folderId = 3)').run();
      
      const deletedCount = images.length;
      console.log(`Корзина очищена, удалено ${deletedCount} изображений`);
      return { success: true, deletedCount };
    } catch (error) {
      console.error('Ошибка очистки корзины:', error.message);
      throw error;
    }
  }

  /**
   * Переместить изображение в другую папку
   */
  moveImage(imageId, newFolderId) {
    const image = this.getImageInfo(imageId);
    if (!image) {
      throw new Error('Изображение не найдено');
    }
    
    const folder = db.prepare('SELECT * FROM folders WHERE id = ?').get(newFolderId);
    if (!folder && newFolderId > 3) {
      throw new Error('Папка назначения не найдена');
    }
    
    db.prepare('UPDATE images SET folderId = ?, modifiedAt = CURRENT_TIMESTAMP WHERE id = ?').run(newFolderId, imageId);
    console.log('Изображение перемещено:', imageId, '→ папка', newFolderId);
    return true;
  }

  /**
   * Получить изображения из корзины
   */
  getTrashImages() {
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
  }

  /**
   * Получить количество изображений в корзине
   */
  getTrashCount() {
    return db.prepare('SELECT COUNT(*) as count FROM images WHERE folderId = 3').get().count || 0;
  }

  /**
   * Вспомогательный метод для безопасного удаления файла
   */
  _deleteFileIfExists(filePath) {
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
   * Проверить существование файла
   */
  fileExists(filePath) {
    return fs.existsSync(filePath);
  }

  /**
   * Получить размер файла
   */
  getFileSize(filePath) {
    try {
      return fs.statSync(filePath).size;
    } catch (error) {
      return 0;
    }
  }
}

module.exports = StorageService;