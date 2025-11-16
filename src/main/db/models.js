// src/main/db/models.js
const db = require('./database');

const FolderModel = {
  /**
   * Получить папку по ID
   */
  getById: (id) => {
    return db.prepare('SELECT * FROM folders WHERE id = ?').get(id);
  },

  /**
   * Получить все папки
   */
  getAll: () => {
    return db.prepare('SELECT * FROM folders ORDER BY id').all();
  },
};

const ImageModel = {
  /**
   * Получить изображения по folderId
   */
  getByFolderId: (folderId) => {
    if (folderId === 1) { // All
      return db.prepare(`
        SELECT
          i.*,
          GROUP_CONCAT(t.name) as tags
        FROM images i
        LEFT JOIN image_tags it ON i.id = it.imageId
        LEFT JOIN tags t ON it.tagId = t.id
        GROUP BY i.id
      `).all();
    } else if (folderId === 2) { // Uncategorized
      return db.prepare(`
        SELECT
          i.*,
          GROUP_CONCAT(t.name) as tags
        FROM images i
        LEFT JOIN image_tags it ON i.id = it.imageId
        LEFT JOIN tags t ON it.tagId = t.id
        WHERE i.folderId IS NULL OR i.folderId = 2
        GROUP BY i.id
      `).all();
    } else if (folderId === 3) { // Trash
      return db.prepare(`
        SELECT
          i.*,
          GROUP_CONCAT(t.name) as tags
        FROM images i
        LEFT JOIN image_tags it ON i.id = it.imageId
        LEFT JOIN tags t ON it.tagId = t.id
        WHERE i.folderId = 3
        GROUP BY i.id
      `).all();
    } else {
      return db.prepare(`
        SELECT
          i.*,
          GROUP_CONCAT(t.name) as tags
        FROM images i
        LEFT JOIN image_tags it ON i.id = it.imageId
        LEFT JOIN tags t ON it.tagId = t.id
        WHERE i.folderId = ?
        GROUP BY i.id
      `).all(folderId);
    }
  },
};

module.exports = {
  FolderModel,
  ImageModel,
};
