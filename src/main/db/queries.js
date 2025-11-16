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
          // Восстанавливаем только системные папки
          if (folder.id <= 3) {
            fs.mkdirSync(folderPath, { recursive: true });
            console.log('Восстановлена системная папка:', folderPath);
          } else {
            // Для пользовательских папок, если их нет физически, удаляем из БД
            console.log('Удалена пользовательская папка из БД:', folder.name);
            db.prepare('DELETE FROM folders WHERE id = ?').run(folder.id);
            // Также удаляем связанные изображения
            db.prepare('DELETE FROM images WHERE folderId = ?').run(folder.id);
          }
        }
      });

      // Проверить наличие новых физических папок, которых нет в БД
      const physicalFolders = fs.readdirSync(baseDir, { withFileTypes: true })
        .filter(dirent => dirent.isDirectory())
        .map(dirent => dirent.name);

      // Получить список папок из БД для сравнения (только пользовательские)
      const dbFolders = db.prepare('SELECT name FROM folders WHERE id > 3').all()
        .map(f => f.name);

      // Находим новые папки, которых нет в БД
      const newFolders = physicalFolders.filter(folderName =>
        !dbFolders.includes(folderName) && !['All', 'Uncategorized', 'Trash'].includes(folderName)
      );

      // Добавляем новые папки в БД
      for (const folderName of newFolders) {
        const folderPath = path.join(baseDir, folderName);
        const displayName = folderName.replace(/_/g, ' ');

        console.log('Найдена новая физическая папка, добавляем в БД:', displayName, folderPath);

        db.prepare('INSERT INTO folders (name, path) VALUES (?, ?)').run(displayName, folderPath);
      }
    } catch (error) {
      console.error('Ошибка синхронизации папок:', error.message);
    }
  },

  /**
   * Получить все папки с количеством изображений
   */
  getAllWithCounts: (sortBy = 'id') => {
    // Сначала получаем системные папки (id <= 3)
    const systemFolders = db.prepare(`
      SELECT
        f.*,
        COUNT(i.id) as imageCount
      FROM folders f
      LEFT JOIN images i ON f.id = i.folderId
      WHERE f.id <= 3
      GROUP BY f.id
      ORDER BY f.id
    `).all();

    // Затем пользовательские папки с сортировкой
    let orderBy;
    switch (sortBy) {
      case 'name':
        orderBy = 'f.name ASC';
        break;
      case 'date':
        orderBy = 'f.createdAt DESC';
        break;
      default:
        orderBy = 'f.id ASC';
    }

    const userFolders = db.prepare(`
      SELECT
        f.*,
        COUNT(i.id) as imageCount
      FROM folders f
      LEFT JOIN images i ON f.id = i.folderId
      WHERE f.id > 3
      GROUP BY f.id
      ORDER BY ${orderBy}
    `).all();

    return [...systemFolders, ...userFolders];
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
