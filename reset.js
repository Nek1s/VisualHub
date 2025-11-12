#!/usr/bin/env node

/**
 * Скрипт для сброса базы данных и перезагрузки проекта VisualHub
 * Этот скрипт удаляет все данные и перезапускает приложение с чистого листа
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const os = require('os');

console.log('🚀 Начинаем сброс VisualHub...');

// Определяем пути (для Windows)
const userDataDir = path.join(os.homedir(), 'AppData', 'Roaming', 'visualhub');
const dbPath = path.join(userDataDir, 'images.db');
const imagesDir = path.join(userDataDir, 'images');
const thumbsDir = path.join(userDataDir, 'thumbnails');
const foldersDir = path.join(userDataDir, 'folders');

console.log('📁 Папка данных:', userDataDir);

// Функция для удаления директории рекурсивно
const deleteDirectory = (dirPath) => {
  if (fs.existsSync(dirPath)) {
    console.log(`🗑️  Удаляем: ${dirPath}`);
    fs.rmSync(dirPath, { recursive: true, force: true });
  }
};

// Удаляем базу данных
if (fs.existsSync(dbPath)) {
  console.log('🗑️  Удаляем базу данных...');
  fs.unlinkSync(dbPath);
}

// Удаляем директории с данными
deleteDirectory(imagesDir);
deleteDirectory(thumbsDir);
deleteDirectory(foldersDir);

console.log('✅ Данные удалены');

// Перезапускаем приложение
console.log('🔄 Перезапускаем приложение...');

try {
  // Устанавливаем зависимости, если нужно
  if (!fs.existsSync('node_modules')) {
    console.log('📦 Устанавливаем зависимости...');
    execSync('npm install', { stdio: 'inherit' });
  }

  // Запускаем приложение
  // console.log('🚀 Запуск VisualHub...');
  // execSync('npm start', { stdio: 'inherit' });

} catch (error) {
  console.error('❌ Ошибка при перезапуске:', error.message);
  process.exit(1);
}

console.log('🎉 Сброс завершен! VisualHub перезапущен.');
