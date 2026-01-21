const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');
const { app } = require('electron');

const dataDir = app.getPath('userData');
const dbPath = path.join(dataDir, 'images.db');

console.log('БД:', dbPath);

if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const db = new Database(dbPath);
db.pragma('foreign_keys = ON');

// Создаем таблицу folders
db.prepare(`
CREATE TABLE IF NOT EXISTS folders (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  path TEXT,
  createdAt TEXT DEFAULT CURRENT_TIMESTAMP
)
`).run();

// Создаем таблицу images с ВСЕМИ колонками
db.prepare(`
CREATE TABLE IF NOT EXISTS images (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  filePath TEXT NOT NULL,
  fileName TEXT,
  folderId INTEGER,
  width INTEGER DEFAULT 0,
  height INTEGER DEFAULT 0,
  fileSize INTEGER DEFAULT 0,
  thumbnailPath TEXT,
  createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
  modifiedAt TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (folderId) REFERENCES folders(id) ON DELETE SET NULL
)
`).run();

// Проверяем и добавляем отсутствующие колонки
const checkAndAddColumns = () => {
  const columns = db.prepare("PRAGMA table_info(images)").all();
  const columnNames = columns.map(col => col.name);
  
  console.log('Существующие колонки в images:', columnNames);
  
  // Список необходимых колонок
  const requiredColumns = [
    { name: 'width', type: 'INTEGER DEFAULT 0' },
    { name: 'height', type: 'INTEGER DEFAULT 0' },
    { name: 'fileSize', type: 'INTEGER DEFAULT 0' },
    { name: 'thumbnailPath', type: 'TEXT' },
    { name: 'title', type: 'TEXT' }, // Добавляем title
    { name: 'description', type: 'TEXT' }, // Добавляем description
    { name: 'link', type: 'TEXT' }, // Добавляем link
    { name: 'createdAt', type: 'TEXT DEFAULT CURRENT_TIMESTAMP' },
    { name: 'modifiedAt', type: 'TEXT DEFAULT CURRENT_TIMESTAMP' }
  ];
  
  for (const column of requiredColumns) {
    if (!columnNames.includes(column.name)) {
      console.log(`Добавляем колонку ${column.name} в таблицу images`);
      try {
        db.prepare(`ALTER TABLE images ADD COLUMN ${column.name} ${column.type}`).run();
        console.log(`✅ Колонка ${column.name} добавлена`);
      } catch (error) {
        console.error(`❌ Ошибка добавления колонки ${column.name}:`, error.message);
      }
    }
  }
};

// Вызываем проверку колонок
checkAndAddColumns();

// Создаем остальные таблицы
db.prepare(`
CREATE TABLE IF NOT EXISTS tags (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT UNIQUE NOT NULL
)
`).run();

db.prepare(`
CREATE TABLE IF NOT EXISTS image_tags (
  imageId INTEGER,
  tagId INTEGER,
  FOREIGN KEY (imageId) REFERENCES images(id) ON DELETE CASCADE,
  FOREIGN KEY (tagId) REFERENCES tags(id) ON DELETE CASCADE,
  PRIMARY KEY (imageId, tagId)
)
`).run();

// Вставляем системные папки
db.prepare(`
  INSERT OR IGNORE INTO folders (id, name) VALUES
  (1, 'All'), (2, 'Uncategorized'), (3, 'Trash')
`).run();

// Обновляем существующие записи без createdAt и modifiedAt
try {
  db.prepare(`
    UPDATE images SET createdAt = datetime('now'), modifiedAt = datetime('now')
    WHERE createdAt IS NULL OR createdAt = ''
  `).run();
} catch (error) {
  console.warn('Ошибка обновления дат:', error.message);
}

console.log('✅ База данных инициализирована');

module.exports = db;