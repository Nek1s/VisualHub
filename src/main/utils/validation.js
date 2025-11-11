// src/main/utils/validation.js
const CONSTANTS = require('./constants');

/**
 * Утилиты валидации
 */
class ValidationUtils {
  /**
   * Валидация имени папки
   */
  static validateFolderName(name) {
    if (!name || typeof name !== 'string') {
      throw new Error('Имя папки не может быть пустым');
    }

    if (name.trim().length === 0) {
      throw new Error('Имя папки не может состоять только из пробелов');
    }

    if (name.length > CONSTANTS.MAX_FOLDER_NAME_LENGTH) {
      throw new Error(`Имя папки не может быть длиннее ${CONSTANTS.MAX_FOLDER_NAME_LENGTH} символов`);
    }

    return true;
  }

  /**
   * Очистка имени папки от недопустимых символов
   */
  static sanitizeFolderName(name) {
    return name
      .replace(/[<>:"/\\|?*]/g, '') // Удаляем недопустимые символы
      .replace(/\s+/g, '_') // Заменяем пробелы на подчеркивания
      .substring(0, CONSTANTS.MAX_FOLDER_NAME_LENGTH) // Ограничиваем длину
      .trim();
  }

  /**
   * Валидация расширения файла изображения
   */
  static validateImageExtension(fileName) {
    const ext = require('path').extname(fileName).toLowerCase();
    if (!CONSTANTS.ALLOWED_IMAGE_EXTENSIONS.test(ext)) {
      throw new Error('Неподдерживаемый формат файла. Разрешены: JPG, PNG, WebP, GIF');
    }
    return true;
  }

  /**
   * Проверка, является ли папка системной
   */
  static isSystemFolder(folderId) {
    return folderId <= 3;
  }

  /**
   * Получение списка имен системных папок
   */
  static getSystemFolderNames() {
    return Object.values(CONSTANTS.SYSTEM_FOLDERS).map(folder => folder.dirName);
  }
}

module.exports = ValidationUtils;
