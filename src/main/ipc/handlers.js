const { ipcMain, app } = require('electron');
const path = require('path');
const fs = require('fs');
const sharp = require('sharp');
const db = require('../db/database');

const IMAGES_DIR = path.join(app.getPath('userData'), 'images');
const THUMBS_DIR = path.join(app.getPath('userData'), 'thumbnails');
const FOLDERS_DIR = path.join(app.getPath('userData'), 'folders');
[IMAGES_DIR, THUMBS_DIR, FOLDERS_DIR].forEach(dir => fs.mkdirSync(dir, { recursive: true }));

// Функция для очистки имени папки от недопустимых символов
function sanitizeFolderName(name) {
  return name
    .replace(/[<>:"/\\|?*]/g, '') // Удаляем недопустимые символы
    .replace(/\s+/g, '_') // Заменяем пробелы на подчеркивания
    .substring(0, 50) // Ограничиваем длину
    .trim();
}

ipcMain.handle('upload-image', async (event, fileBuffer, fileName, folderId) => {
  console.log('Получен запрос на загрузку:', fileName, 'в папку', folderId); // Лог для отладки

  try {
    const ext = path.extname(fileName).toLowerCase();
    if (!ext.match(/\.(jpg|jpeg|png|webp|gif)$/i)) throw new Error('Не изображение');

    const baseName = path.basename(fileName, ext);
    const timestamp = Date.now();
    const uniqueName = `${baseName}_${timestamp}${ext}`;
    const filePath = path.join(IMAGES_DIR, uniqueName);
    const thumbPath = path.join(THUMBS_DIR, `${baseName}_${timestamp}_thumb${ext}`);

    await sharp(fileBuffer).toFile(filePath);
    await sharp(fileBuffer).resize(200, 200, { fit: 'cover' }).toFile(thumbPath);

    const result = db.prepare(`
      INSERT INTO images (filePath, fileName, thumbnailPath, folderId, createdAt, modifiedAt)
      VALUES (?, ?, ?, ?, datetime('now'), datetime('now'))
    `).run(filePath, fileName, thumbPath, folderId);

    console.log('Загружено успешно, ID:', result.lastInsertRowid); // Лог успеха

    return { success: true, id: result.lastInsertRowid };
  } catch (error) {
    console.error('Ошибка загрузки:', error.message); // Лог ошибки
    return { success: false, error: error.message };
  }
});

ipcMain.handle('get-images', async (event, folderId) => {
  console.log('Запрос изображений для папки:', folderId);
  return db.prepare(`
    SELECT * FROM images WHERE folderId = ? ORDER BY createdAt DESC
  `).all(folderId);
});

ipcMain.handle('get-image-url', (event, imagePath) => {
  console.log('URL для:', imagePath);
  return `file://${path.resolve(imagePath)}`;
});

ipcMain.handle('add-folder', async (event, name) => {
  console.log('Создаём папку:', name);

  try {
    // Очищаем имя от недопустимых символов
    const sanitizedName = sanitizeFolderName(name);
    if (!sanitizedName) {
      throw new Error('Недопустимое имя папки');
    }

    // Создаём запись в БД
    const result = db.prepare('INSERT INTO folders (name) VALUES (?)').run(name);
    const folderId = result.lastInsertRowid;

    // Создаём физическую папку с уникальным именем
    let folderPath = path.join(FOLDERS_DIR, sanitizedName);
    let counter = 1;

    // Если папка уже существует, добавляем суффикс
    while (fs.existsSync(folderPath)) {
      folderPath = path.join(FOLDERS_DIR, `${sanitizedName}_${counter}`);
      counter++;
    }

    fs.mkdirSync(folderPath, { recursive: true });

    // Обновляем путь в БД
    db.prepare('UPDATE folders SET path = ? WHERE id = ?').run(folderPath, folderId);

    console.log('Папка создана:', folderPath);
    return { success: true, id: folderId, name, path: folderPath };
  } catch (error) {
    console.error('Ошибка создания папки:', error.message);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('delete-folder', async (event, folderId) => {
  console.log('Удаляем папку:', folderId);
  
  try {
    // Получаем информацию о папке
    const folder = db.prepare('SELECT * FROM folders WHERE id = ?').get(folderId);
    
    if (!folder) {
      throw new Error('Папка не найдена');
    }
    
    // Запрещаем удалять системные папки
    if (folderId <= 3) {
      throw new Error('Нельзя удалить системную папку');
    }
    
    // Удаляем физическую папку, если она существует
    if (folder.path && fs.existsSync(folder.path)) {
      fs.rmSync(folder.path, { recursive: true, force: true });
      console.log('Физическая папка удалена:', folder.path);
    }
    
    // Удаляем изображения, связанные с папкой
    db.prepare('DELETE FROM images WHERE folderId = ?').run(folderId);
    
    // Удаляем папку из БД
    db.prepare('DELETE FROM folders WHERE id = ?').run(folderId);
    
    console.log('Папка удалена из БД');
    return { success: true };
  } catch (error) {
    console.error('Ошибка удаления папки:', error.message);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('rename-folder', async (event, folderId, newName) => {
  console.log('Переименовываем папку:', folderId, 'в', newName);

  try {
    // Запрещаем переименовывать системные папки
    if (folderId <= 3) {
      throw new Error('Нельзя переименовать системную папку');
    }

    // Очищаем новое имя
    const sanitizedName = sanitizeFolderName(newName);
    if (!sanitizedName) {
      throw new Error('Недопустимое имя папки');
    }

    // Получаем текущую информацию о папке
    const folder = db.prepare('SELECT * FROM folders WHERE id = ?').get(folderId);
    if (!folder) {
      throw new Error('Папка не найдена');
    }

    // Переименовываем физическую папку, если она существует
    if (folder.path && fs.existsSync(folder.path)) {
      let newFolderPath = path.join(FOLDERS_DIR, sanitizedName);
      let counter = 1;

      // Если папка с таким именем уже существует (кроме текущей), добавляем суффикс
      while (fs.existsSync(newFolderPath) && newFolderPath !== folder.path) {
        newFolderPath = path.join(FOLDERS_DIR, `${sanitizedName}_${counter}`);
        counter++;
      }

      fs.renameSync(folder.path, newFolderPath);

      // Обновляем путь в БД
      db.prepare('UPDATE folders SET path = ?, name = ? WHERE id = ?').run(newFolderPath, newName, folderId);
      console.log('Физическая папка переименована:', folder.path, '->', newFolderPath);
    } else {
      // Обновляем только имя в БД
      db.prepare('UPDATE folders SET name = ? WHERE id = ?').run(newName, folderId);
    }

    console.log('Папка переименована');
    return { success: true };
  } catch (error) {
    console.error('Ошибка переименования папки:', error.message);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('get-folders', async () => {
  // Сначала проверяем и удаляем "осиротевшие" папки (которых нет физически)
  const allFolders = db.prepare('SELECT * FROM folders WHERE id > 3 ORDER BY id').all();

  for (const folder of allFolders) {
    if (folder.path && !fs.existsSync(folder.path)) {
      console.log('Найдена осиротевшая папка, удаляем из БД:', folder.name, folder.path);

      // Удаляем изображения, связанные с этой папкой
      db.prepare('DELETE FROM images WHERE folderId = ?').run(folder.id);

      // Удаляем папку из БД
      db.prepare('DELETE FROM folders WHERE id = ?').run(folder.id);
    }
  }

  // Теперь проверяем наличие новых физических папок, которые нужно добавить в БД
  try {
    const physicalFolders = fs.readdirSync(FOLDERS_DIR, { withFileTypes: true })
      .filter(dirent => dirent.isDirectory())
      .map(dirent => dirent.name);

    // Получаем список папок из БД для сравнения
    const dbFolders = db.prepare('SELECT path FROM folders WHERE id > 3 AND path IS NOT NULL').all()
      .map(f => path.basename(f.path));

    // Находим новые папки, которых нет в БД
    const newFolders = physicalFolders.filter(folderName =>
      !dbFolders.includes(folderName)
    );

    // Добавляем новые папки в БД
    for (const folderName of newFolders) {
      const folderPath = path.join(FOLDERS_DIR, folderName);

      // Используем имя папки как отображаемое имя (заменяем подчеркивания на пробелы)
      const displayName = folderName.replace(/_/g, ' ');

      console.log('Найдена новая физическая папка, добавляем в БД:', displayName, folderPath);

      db.prepare('INSERT INTO folders (name, path) VALUES (?, ?)').run(displayName, folderPath);
    }
  } catch (error) {
    console.error('Ошибка при проверке новых папок:', error.message);
  }

  // Теперь получаем актуальный список папок
  const folders = db.prepare('SELECT * FROM folders ORDER BY id').all();
  folders.forEach(f => {
    if (f.id === 1) {
      f.count = db.prepare('SELECT COUNT(*) as c FROM images').get().c;
    } else {
      f.count = db.prepare('SELECT COUNT(*) as c FROM images WHERE folderId = ?').get(f.id)?.c || 0;
    }
  });
  return folders;
});
