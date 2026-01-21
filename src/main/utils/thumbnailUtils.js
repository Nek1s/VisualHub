// src/main/utils/thumbnailUtils.js
const sharp = require('sharp');
const fs = require('fs');
const path = require('path');
const db = require('../db/database');
const CONSTANTS = require('./constants');

/**
 * Утилиты для работы с миниатюрами
 */
class ThumbnailUtils {
  /**
   * Создать миниатюру для изображения
   */
  static async createThumbnail(imagePath, thumbnailPath) {
    try {
      // Создаем директорию для миниатюр если её нет
      const thumbDir = path.dirname(thumbnailPath);
      if (!fs.existsSync(thumbDir)) {
        fs.mkdirSync(thumbDir, { recursive: true });
      }

      await sharp(imagePath)
        .resize(CONSTANTS.THUMBNAIL_SIZE, CONSTANTS.THUMBNAIL_SIZE, {
          fit: 'cover',
          withoutEnlargement: true,
          fastShrinkOnLoad: true
        })
        .jpeg({ quality: 80, mozjpeg: true })
        .toFile(thumbnailPath);
      
      console.log('✅ Миниатюра создана:', thumbnailPath);
      return true;
    } catch (error) {
      console.error('❌ Ошибка создания миниатюры для', imagePath, ':', error.message);
      
      // Пробуем скопировать оригинал как fallback
      try {
        fs.copyFileSync(imagePath, thumbnailPath);
        console.log('📋 Используем оригинал как миниатюру:', thumbnailPath);
        return true;
      } catch (copyError) {
        console.error('❌ Ошибка копирования оригинала:', copyError.message);
        return false;
      }
    }
  }

  /**
   * Проверить и создать отсутствующие миниатюры
   */
  static async checkAndCreateMissingThumbnails() {
    try {
      console.log('🔍 Проверка отсутствующих миниатюр...');
      
      // Получаем все изображения с миниатюрами
      const images = db.prepare('SELECT * FROM images WHERE thumbnailPath IS NOT NULL').all();
      console.log(`📊 Найдено ${images.length} изображений с миниатюрами в БД`);
      
      let createdCount = 0;
      
      for (const image of images) {
        // Проверяем существование файла миниатюры
        if (image.thumbnailPath && !fs.existsSync(image.thumbnailPath)) {
          console.log('⚠️  Миниатюра отсутствует, создаем:', image.fileName);
          
          // Проверяем существование оригинала
          if (fs.existsSync(image.filePath)) {
            const success = await this.createThumbnail(image.filePath, image.thumbnailPath);
            if (success) {
              createdCount++;
            }
          } else {
            console.warn('❌ Оригинальный файл отсутствует:', image.filePath);
          }
        }
      }
      
      console.log(`✅ Создано ${createdCount} недостающих миниатюр`);
      return createdCount;
    } catch (error) {
      console.error('❌ Ошибка проверки миниатюр:', error.message);
      return 0;
    }
  }

  /**
   * Создать миниатюры для всех изображений без них
   */
  static async createThumbnailsForAll() {
    try {
      console.log('🔄 Создание миниатюр для всех изображений...');
      
      const images = db.prepare('SELECT * FROM images').all();
      console.log(`📊 Всего изображений в БД: ${images.length}`);
      
      let createdCount = 0;
      
      for (const image of images) {
        // Если нет пути к миниатюре или миниатюра не существует
        if ((!image.thumbnailPath || !fs.existsSync(image.thumbnailPath)) && 
            image.filePath && fs.existsSync(image.filePath)) {
          
          // Генерируем путь для миниатюры
          const ext = path.extname(image.filePath);
          const baseName = path.basename(image.filePath, ext);
          const thumbnailPath = path.join(CONSTANTS.THUMBS_DIR, `${baseName}_thumb${ext}`);
          
          console.log(`➕ Создаем миниатюру для: ${image.fileName}`);
          
          const success = await this.createThumbnail(image.filePath, thumbnailPath);
          
          if (success) {
            // Обновляем путь в БД
            db.prepare('UPDATE images SET thumbnailPath = ? WHERE id = ?')
              .run(thumbnailPath, image.id);
            createdCount++;
          }
        }
      }
      
      console.log(`✅ Готово! Создано ${createdCount} новых миниатюр`);
      return createdCount;
    } catch (error) {
      console.error('❌ Ошибка создания миниатюр:', error.message);
      return 0;
    }
  }

  /**
   * Получить путь к миниатюре
   */
  static getThumbnailPath(imagePath) {
    const ext = path.extname(imagePath);
    const baseName = path.basename(imagePath, ext);
    return path.join(CONSTANTS.THUMBS_DIR, `${baseName}_thumb${ext}`);
  }

  /**
   * Проверить существование миниатюры
   */
  static thumbnailExists(thumbnailPath) {
    return fs.existsSync(thumbnailPath);
  }
}

module.exports = ThumbnailUtils;