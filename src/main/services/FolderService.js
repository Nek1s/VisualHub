// src/main/services/FolderService.js
const { FolderQueries } = require('../db/queries');
const { FolderModel } = require('../db/models');
const ValidationUtils = require('../utils/validation');
const CONSTANTS = require('../utils/constants');
const path = require('path');
const fs = require('fs');

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
  async getAllFolders() {
    try {
      // Синхронизировать физические папки с БД
      FolderQueries.syncPhysicalFolders(this.baseDir);

      // Получить все папки с подсчетом
      const folders = FolderQueries.getAllWithCounts();

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
      const result = FolderQueries.createUserFolder(name, this.baseDir);
      console.log('Папка создана:', result);
      return result;
    } catch (error) {
      console.error('Ошибка создания папки:', error.message);
      throw error;
    }
  }

  /**
   * Удалить пользовательскую папку
   */
  async deleteFolder(folderId) {
    try {
      const result = FolderQueries.deleteUserFolder(folderId, this.baseDir);
      console.log('Папка удалена:', folderId);
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
      const result = FolderQueries.renameUserFolder(folderId, newName, this.baseDir);
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
}

module.exports = FolderService;
