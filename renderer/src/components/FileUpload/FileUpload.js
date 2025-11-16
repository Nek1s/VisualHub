import React, { useState, useRef } from 'react';
import './FileUpload.css';
import AddFolderButton from '../AddFolderButton/AddFolderButton';
import ImportImagesButton from '../ImportImagesButton/ImportImagesButton';

const FileUpload = ({ folderId = 2, onUploadComplete, onAddFolder }) => {
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
      handleFilesAdded(files, 'диалог выбора файлов');
    }
  };

  // Обработчик выбора файлов через кнопку Import
  const handleImportFiles = (files) => {
    handleFilesAdded(files, 'кнопка Import');
  };

  // Общая функция для обработки добавленных файлов
  const handleFilesAdded = (files, method) => {
    setSelectedFiles(prev => [...prev, ...files]);
    logFilesInfo(files, method);
    
    // Автоматическая загрузка файлов
    simulateFileUpload(files);
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
      handleFilesAdded(files, 'Drag and Drop');
    }
  };

  // Убрали handleAreaClick, так как клик по области больше не открывает диалог

  const simulateFileUpload = async (files) => {
    console.log('Начало автоматической загрузки файлов...');
    
    const newProgress = {};
    files.forEach((_, index) => {
      const globalIndex = selectedFiles.length + index;
      newProgress[globalIndex] = 0;
    });
    setUploadProgress(prev => ({...prev, ...newProgress}));

    for (let i = 0; i < files.length; i++) {
      const globalIndex = selectedFiles.length + i;
      const file = files[i];
      
      // === РЕАЛЬНАЯ ЗАГРУЗКА ===
      try {
        const buffer = await file.arrayBuffer();
        const array = new Uint8Array(buffer);
        const result = await window.electronAPI.uploadImage(array, file.name, folderId);

        if (result.success) {
          console.log(`Успешно загружено: ${file.name} (ID: ${result.id})`);

          // Обновляем галерею
          if (window.electronAPI?.getImages && typeof onUploadComplete === 'function') {
            const images = await window.electronAPI.getImages(folderId);
            onUploadComplete(images);
          }
        } else {
          console.error(`Ошибка загрузки: ${result.error}`);
        }
      } catch (err) {
        console.error(`Ошибка API:`, err);
      }
      // ---------- КОНЕЦ ЗАГРУЗКИ ----------

      // Симуляция прогресса
      for (let progress = 0; progress <= 100; progress += 20) {
        await new Promise(resolve => setTimeout(resolve, 150));
        setUploadProgress(prev => ({
          ...prev,
          [globalIndex]: progress
        }));
      }
      
      console.log(`Файл успешно загружен: ${file.name}`);
    }

    console.log('Все файлы автоматически загружены!');

    setTimeout(() => {
      setUploadProgress({});
      setSelectedFiles([]);
      console.log('Прогресс загрузки очищен');
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
      {/* Область для drag and drop - теперь без onClick */}
      <div
        className={`upload-area ${isDragging ? 'dragging' : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        // onClick убран - клик по области больше не открывает диалог
      >
        <div className="upload-content">
          <h1>Upload files</h1>
          <span className="upload-hint">
            Drag and drop your files here or use the Import button below
          </span>
          <div className='upload-buttons'>
            <AddFolderButton
              className="upload-content__add-button"
              onClick={onAddFolder}
              label="Create folder"
              icon="+"
            />
            
            <ImportImagesButton
              onFilesSelected={handleImportFiles}
            />
            
          </div>
        </div>
        
        {/* Input для кнопки Import - остается скрытым */}
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*"
          onChange={handleFileSelect}
          style={{ display: 'none' }}
        />
      </div>

      {/* Список выбранных файлов */}
      {selectedFiles.length > 0 && (
        <div className="files-list">
          <h3>Selected Files ({selectedFiles.length})</h3>
          {selectedFiles.map((file, index) => (
            <div key={index} className="file-item">
              <div className="file-info">
                <div className="file-name">{file.name}</div>
                <div className="file-size">{formatFileSize(file.size)}</div>
              </div>
              <div className="file-actions">
                {uploadProgress[index] !== undefined && uploadProgress[index] < 100 && (
                  <div className="progress-bar">
                    <div 
                      className="progress-fill" 
                      style={{ width: `${uploadProgress[index]}%` }}
                    ></div>
                    <div className="progress-text">{uploadProgress[index]}%</div>
                  </div>
                )}
                {uploadProgress[index] === 100 && (
                  <span style={{ color: '#28a745', fontSize: '12px' }}>✓ Done</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default FileUpload;