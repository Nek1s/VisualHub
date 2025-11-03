import React, { useState, useRef } from 'react';
import './FileUpload.css';

const FileUpload = () => {
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({});
  const fileInputRef = useRef(null);

  // Функция для логирования информации о файлах
  const logFilesInfo = (files, method) => {
    console.log(`📁 Файлы добавлены через: ${method}`);
    console.log(`📊 Количество файлов: ${files.length}`);
    
    files.forEach((file, index) => {
      console.log(`  ${index + 1}. Имя: ${file.name}`);
      console.log(`     Размер: ${formatFileSize(file.size)}`);
      console.log(`     Тип: ${file.type || 'Неизвестный тип'}`);
      console.log(`     Последнее изменение: ${new Date(file.lastModified).toLocaleString()}`);
    });
    
    console.log('---');
  };

  // Обработчик выбора файлов через диалог
  const handleFileSelect = (event) => {
    const files = Array.from(event.target.files);
    if (files.length > 0) {
      setSelectedFiles(prev => [...prev, ...files]);
      logFilesInfo(files, 'диалог выбора файлов');
      
      // Автоматическая "загрузка" файлов (симуляция)
      simulateFileUpload(files);
    }
  };

  // Обработчик drag and drop
  const handleDragOver = (event) => {
    event.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (event) => {
    event.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (event) => {
    event.preventDefault();
    setIsDragging(false);
    
    const files = Array.from(event.dataTransfer.files);
    if (files.length > 0) {
      setSelectedFiles(prev => [...prev, ...files]);
      logFilesInfo(files, 'Drag and Drop');
      
      // Автоматическая "загрузка" файлов (симуляция)
      simulateFileUpload(files);
    }
  };

  // Обработчик клика по области загрузки
  const handleAreaClick = () => {
    fileInputRef.current?.click();
  };

  // Симуляция загрузки файлов
  const simulateFileUpload = async (files) => {
    console.log('🚀 Начало автоматической загрузки файлов...');
    
    const newProgress = {};
    files.forEach((_, index) => {
      const globalIndex = selectedFiles.length + index;
      newProgress[globalIndex] = 0;
    });
    setUploadProgress(prev => ({...prev, ...newProgress}));

    // Симуляция прогресса загрузки для каждого файла
    for (let i = 0; i < files.length; i++) {
      const globalIndex = selectedFiles.length + i;
      const file = files[i];
      
      console.log(`📤 Загрузка файла: ${file.name}`);
      
      for (let progress = 0; progress <= 100; progress += 20) {
        await new Promise(resolve => setTimeout(resolve, 150));
        setUploadProgress(prev => ({
          ...prev,
          [globalIndex]: progress
        }));
        
        // Логируем прогресс каждые 40%
        if (progress % 40 === 0 && progress > 0) {
          console.log(`  ↳ Прогресс загрузки "${file.name}": ${progress}%`);
        }
      }
      
      console.log(`✅ Файл успешно загружен: ${file.name}`);
    }

    console.log('🎉 Все файлы автоматически загружены!');
    console.log('📈 Статистика загрузки:');
    files.forEach((file, index) => {
      console.log(`  ${index + 1}. ${file.name} - ${formatFileSize(file.size)} - ✅ Успешно`);
    });
    
    // Очищаем прогресс через 2 секунды после завершения
    setTimeout(() => {
      setUploadProgress({});
      console.log('🔄 Прогресс загрузки очищен');
    }, 2000);
  };

  // Форматирование размера файла
  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="file-upload">      
      {/* Область для drag and drop */}
      <div
        className={`upload-area ${isDragging ? 'dragging' : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleAreaClick}
      >
        <div className="upload-content">
          <p>Перетащите файлы сюда или <br /> нажмите для выбора</p>
          <span className="upload-hint">Поддерживаются любые типы файлов</span>
        </div>
        
        <input
          ref={fileInputRef}
          type="file"
          multiple
          onChange={handleFileSelect}
          style={{ display: 'none' }}
        />
      </div>
    </div>
  );
};

export default FileUpload;