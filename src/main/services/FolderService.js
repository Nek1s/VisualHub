// src/main/services/FolderService.js
const { FolderQueries } = require('../db/queries');
const { FolderModel } = require('../db/models');
const ValidationUtils = require('../utils/validation');
const CONSTANTS = require('../utils/constants');
const path = require('path');
const fs = require('fs');
const db = require('../db/database');

/**
 * Сервис для работы с папками
 */
class FolderService {
  constructor(baseDir) {
    this.baseDir = baseDir;
  }

  /**
   * Получить все папки с количеством изображений
   */
  async getAllFolders(sortBy = 'id') {
    try {
      // Синхронизировать физические папки с БД
      FolderQueries.syncPhysicalFolders(this.baseDir);

      // Получить все папки с подсчетом
      const folders = FolderQueries.getAllWithCounts(sortBy);

      return folders;
    } catch (error) {
      console.error('Ошибка получения папок:', error.message);
      throw error;
    }
  }

  /**
   * Создать новую пользовательскую папку
   */
  async createFolder(name) {
    try {
      // Валидация имени
      ValidationUtils.validateFolderName(name);
      
      // Очистка имени для файловой системы
      const sanitizedName = ValidationUtils.sanitizeFolderName(name);
      
      // Создание папки через queries
      const result = FolderQueries.createUserFolder(sanitizedName, this.baseDir);
      console.log('Папка создана:', result);
      return result;
    } catch (error) {
      console.error('Ошибка создания папки:', error.message);
      throw error;
    }
  }

  /**
   * Удалить пользовательскую папку (ОБНОВЛЕННЫЙ МЕТОД)
   */
  async deleteFolder(folderId) {
    try {
      console.log('Удаление папки ID:', folderId);
      
      // Проверяем, что папка существует
      const folder = FolderModel.getById(folderId);
      if (!folder) {
        throw new Error('Папка не найдена');
      }
      
      // Проверяем, что это не системная папка
      if (folderId <= 3) {
        throw new Error('Нельзя удалить системную папку');
      }
      
      // ===== НОВАЯ ЛОГИКА: Перемещаем все изображения в корзину =====
      console.log(`Перемещение изображений из папки ${folderId} в корзину...`);
      
      // Получаем все изображения из этой папки
      const images = db.prepare('SELECT id FROM images WHERE folderId = ?').all(folderId);
      
      // Перемещаем каждое изображение в корзину (folderId = 3)
      for (const image of images) {
        db.prepare('UPDATE images SET folderId = 3, modifiedAt = CURRENT_TIMESTAMP WHERE id = ?').run(image.id);
        console.log(`Изображение ${image.id} перемещено в корзину`);
      }
      
      // ===== КОНЕЦ НОВОЙ ЛОГИКИ =====
      
      // Удаляем физическую папку
      const folderPath = path.join(this.baseDir, folder.name);
      if (fs.existsSync(folderPath)) {
        fs.rmSync(folderPath, { recursive: true, force: true });
        console.log('Физическая папка удалена:', folderPath);
      }
      
      // Удаляем папку из БД
      const result = FolderQueries.deleteUserFolder(folderId, this.baseDir);
      
      console.log('Папка и её изображения удалены:', folderId);
      return result;
    } catch (error) {
      console.error('Ошибка удаления папки:', error.message);
      throw error;
    }
  }

  /**
   * Переименовать пользовательскую папку
   */
  async renameFolder(folderId, newName) {
    try {
      // Валидация нового имени
      ValidationUtils.validateFolderName(newName);
      
      // Очистка имени для файловой системы
      const sanitizedName = ValidationUtils.sanitizeFolderName(newName);
      
      const result = FolderQueries.renameUserFolder(folderId, sanitizedName, this.baseDir);
      console.log('Папка переименована:', folderId, '->', newName);
      return result;
    } catch (error) {
      console.error('Ошибка переименования папки:', error.message);
      throw error;
    }
  }

  /**
   * Восстановить системную папку
   */
  restoreSystemFolder(folderName) {
    const folderPath = path.join(this.baseDir, folderName);

    if (!fs.existsSync(folderPath)) {
      fs.mkdirSync(folderPath, { recursive: true });
      console.log('Восстановлена системная папка:', folderPath);
      return true;
    }
    return false;
  }

  /**
   * Проверить существование папки
   */
  folderExists(folderId) {
    const folder = FolderModel.getById(folderId);
    return !!folder;
  }

  /**
   * Проверить, является ли папка системной
   */
  isSystemFolder(folderId) {
    return folderId <= 3;
  }

  /**
   * Получить информацию о папке
   */
  getFolderInfo(folderId) {
    return FolderModel.getById(folderId);
  }

  /**
   * Получить количество изображений в папке
   */
  getImageCount(folderId) {
    try {
      if (folderId === 1) { // All
        return db.prepare('SELECT COUNT(*) as count FROM images WHERE folderId != 3').get().count || 0;
      } else if (folderId === 2) { // Uncategorized
        return db.prepare(`
          SELECT COUNT(*) as count FROM images
          WHERE (folderId IS NULL OR folderId = 2) AND folderId != 3
        `).get().count || 0;
      } else if (folderId === 3) { // Trash
        return db.prepare('SELECT COUNT(*) as count FROM images WHERE folderId = 3').get().count || 0;
      } else {
        return db.prepare('SELECT COUNT(*) as count FROM images WHERE folderId = ?').get(folderId)?.count || 0;
      }
    } catch (error) {
      console.error('Ошибка получения количества изображений:', error.message);
      return 0;
    }
  }

  /**
   * Получить статистику по папкам
   */
  getFolderStats() {
    try {
      const stats = {
        totalFolders: 0,
        totalImages: 0,
        trashCount: 0,
        userFolders: []
      };

      // Общее количество папок
      stats.totalFolders = db.prepare('SELECT COUNT(*) as count FROM folders WHERE id > 3').get().count || 0;

      // Общее количество изображений (кроме корзины)
      stats.totalImages = db.prepare('SELECT COUNT(*) as count FROM images WHERE folderId != 3').get().count || 0;

      // Количество в корзине
      stats.trashCount = db.prepare('SELECT COUNT(*) as count FROM images WHERE folderId = 3').get().count || 0;

      // Статистика по пользовательским папкам
      stats.userFolders = db.prepare(`
        SELECT 
          f.id,
          f.name,
          COUNT(i.id) as imageCount,
          SUM(i.fileSize) as totalSize
        FROM folders f
        LEFT JOIN images i ON f.id = i.folderId
        WHERE f.id > 3
        GROUP BY f.id
        ORDER BY f.name
      `).all();

      return stats;
    } catch (error) {
      console.error('Ошибка получения статистики:', error.message);
      return null;
    }
  }
}

module.exports = FolderService;