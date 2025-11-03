// src/main/db/queries.js
const db = require('./database');

module.exports = {
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

  addImage: (filePath, fileName, folderId = null) => {
    const thumbnailPath = filePath.replace(/\.[^.]+$/, '_thumb$&');
    const result = db.prepare(`
      INSERT INTO images (filePath, fileName, folderId, thumbnailPath)
      VALUES (?, ?, ?, ?)
    `).run(filePath, fileName, folderId, thumbnailPath);
    return { id: result.lastInsertRowid };
  },
};