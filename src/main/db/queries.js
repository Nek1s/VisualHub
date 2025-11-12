// src/main/db/queries.js
const db = require('./database');
const path = require('path');
const fs = require('fs');

const ImageQueries = {
  getAllImages: () => {
    return db.prepare(`
      SELECT
        i.*,
        GROUP_CONCAT(t.name) as tags
      FROM images i
      LEFT JOIN image_tags it ON i.id = it.imageId
      LEFT JOIN tags t ON it.tagId = t.id
      GROUP BY i.id
    `).all();
  },

  addImage: (fileBuffer, fileName, folderId, imagesDir, thumbsDir) => {
    const filePath = path.join(imagesDir, fileName);
    const thumbnailPath = path.join(thumbsDir, fileName);

    // Сохраняем файл
    fs.writeFileSync(filePath, fileBuffer);

    const result = db.prepare(`
      INSERT INTO images (filePath, fileName, folderId, thumbnailPath)
      VALUES (?, ?, ?, ?)
    `).run(filePath, fileName, folderId, thumbnailPath);
    return { id: result.lastInsertRowid };
  },
};

const FolderQueries = {
  /**
   * Синхронизировать физические папки с БД
   */
  syncPhysicalFolders: (baseDir) => {
    try {
      // Получить все папки из БД
      const folders = db.prepare('SELECT * FROM folders').all();

      folders.forEach(folder => {
        const folderPath = path.join(baseDir, folder.name);
        if (!fs.existsSync(folderPath)) {
          fs.mkdirSync(folderPath, { recursive: true });
          console.log('Создана папка:', folderPath);
        }
      });
    } catch (error) {
      console.error('Ошибка синхронизации папок:', error.message);
    }
  },

  /**
   * Получить все папки с количеством изображений
   */
  getAllWithCounts: () => {
    return db.prepare(`
      SELECT
        f.*,
        COUNT(i.id) as imageCount
      FROM folders f
      LEFT JOIN images i ON f.id = i.folderId
      GROUP BY f.id
      ORDER BY f.id
    `).all();
  },

  /**
   * Создать пользовательскую папку
   */
  createUserFolder: (name, baseDir) => {
    const folderPath = path.join(baseDir, name);

    // Создать физическую папку
    if (!fs.existsSync(folderPath)) {
      fs.mkdirSync(folderPath, { recursive: true });
    }

    // Добавить в БД
    const result = db.prepare('INSERT INTO folders (name, path) VALUES (?, ?)').run(name, folderPath);
    return { id: result.lastInsertRowid, name, path: folderPath };
  },

  /**
   * Удалить пользовательскую папку
   */
  deleteUserFolder: (folderId, baseDir) => {
    const folder = db.prepare('SELECT * FROM folders WHERE id = ?').get(folderId);
    if (!folder) throw new Error('Папка не найдена');

    // Проверить, что это не системная папка
    if (folderId <= 3) throw new Error('Нельзя удалить системную папку');

    const folderPath = path.join(baseDir, folder.name);

    // Удалить физическую папку
    if (fs.existsSync(folderPath)) {
      fs.rmSync(folderPath, { recursive: true, force: true });
    }

    // Удалить из БД
    db.prepare('DELETE FROM folders WHERE id = ?').run(folderId);
  },

  /**
   * Переименовать пользовательскую папку
   */
  renameUserFolder: (folderId, newName, baseDir) => {
    const folder = db.prepare('SELECT * FROM folders WHERE id = ?').get(folderId);
    if (!folder) throw new Error('Папка не найдена');

    // Проверить, что это не системная папка
    if (folderId <= 3) throw new Error('Нельзя переименовать системную папку');

    const oldPath = path.join(baseDir, folder.name);
    const newPath = path.join(baseDir, newName);

    // Переименовать физическую папку
    if (fs.existsSync(oldPath)) {
      fs.renameSync(oldPath, newPath);
    }

    // Обновить в БД
    db.prepare('UPDATE folders SET name = ?, path = ? WHERE id = ?').run(newName, newPath, folderId);
  },
};

module.exports = {
  ImageQueries,
  FolderQueries,
};
