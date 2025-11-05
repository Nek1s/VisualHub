// src/main/db/database.js
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

db.prepare(`
CREATE TABLE IF NOT EXISTS folders (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  path TEXT,
  createdAt TEXT DEFAULT CURRENT_TIMESTAMP
)
`).run();

db.prepare(`
CREATE TABLE IF NOT EXISTS images (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  filePath TEXT NOT NULL,
  fileName TEXT,
  folderId INTEGER,
  thumbnailPath TEXT,
  createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
  modifiedAt TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (folderId) REFERENCES folders(id) ON DELETE SET NULL
)
`).run();

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

module.exports = db;