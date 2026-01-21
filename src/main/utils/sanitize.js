const path = require('path');

/**
 * Утилиты для очистки имен файлов и путей
 */
class SanitizeUtils {
  /**
   * Очистить имя файла от недопустимых символов
   */
  static sanitizeFileName(fileName, maxLength = 100) {
    if (!fileName) return '';
    
    // Получаем расширение
    const ext = path.extname(fileName);
    const baseName = path.basename(fileName, ext);
    
    // Очищаем имя файла
    const sanitized = baseName
      .replace(/[<>:"/\\|?*]/g, '') // Удаляем недопустимые символы
      .replace(/\s+/g, '_') // Заменяем пробелы на подчеркивания
      .substring(0, maxLength) // Ограничиваем длину
      .trim();
    
    return sanitized + ext;
  }
  
  /**
   * Очистить строку для использования в качестве title
   */
  static sanitizeTitle(title, maxLength = 100) {
    if (!title) return '';
    
    return title
      .replace(/[<>:"/\\|?*]/g, '') // Удаляем недопустимые символы
      .substring(0, maxLength) // Ограничиваем длину
      .trim();
  }
}

module.exports = SanitizeUtils;