import React, { useState, useRef, useEffect } from 'react';
import './FileUpload.css';
import AddFolderButton from '../AddFolderButton/AddFolderButton';
import ImportImagesButton from '../ImportImagesButton/ImportImagesButton';

const FileUpload = ({ folderId, onAddFolder, onUploadComplete, hasImages }) => {
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({});
  const [isDragOverApp, setIsDragOverApp] = useState(false);
  const fileInputRef = useRef(null);
  const dragCounter = useRef(0);
  const isTrashFolder = folderId === 3;

  // --- ИСПРАВЛЕНИЕ: useEffect перенесен ВВЕРХ, до любого return ---
  
  // Отслеживаем drag over всего приложения
  useEffect(() => {
    // Если мы в корзине, не навешиваем слушатели или сразу выходим
    if (isTrashFolder) return;

    const handleDocumentDragOver = (event) => {
      event.preventDefault();
    };

    const handleDocumentDragEnter = (event) => {
      event.preventDefault();
      if (event.dataTransfer.types.includes('Files')) {
        dragCounter.current++;
        if (dragCounter.current === 1) {
          setIsDragOverApp(true);
        }
      }
    };

    const handleDocumentDragLeave = (event) => {
      event.preventDefault();
      if (!event.relatedTarget || event.relatedTarget === document.documentElement) {
        dragCounter.current = 0;
        setIsDragOverApp(false);
        setIsDragging(false);
      } else {
        dragCounter.current--;
        if (dragCounter.current <= 0) {
          dragCounter.current = 0;
          setIsDragOverApp(false);
          setIsDragging(false);
        }
      }
    };

    const handleDocumentDrop = (event) => {
      event.preventDefault();
      
      const files = Array.from(event.dataTransfer.files);
      
      if (files.length > 0 && hasImages && isDragOverApp) {
        handleFilesAdded(files, 'Global Drag and Drop');
      }
      
      dragCounter.current = 0;
      setIsDragOverApp(false);
      setIsDragging(false);
    };

    document.addEventListener('dragover', handleDocumentDragOver);
    document.addEventListener('dragenter', handleDocumentDragEnter);
    document.addEventListener('dragleave', handleDocumentDragLeave);
    document.addEventListener('drop', handleDocumentDrop);

    return () => {
      document.removeEventListener('dragover', handleDocumentDragOver);
      document.removeEventListener('dragenter', handleDocumentDragEnter);
      document.removeEventListener('dragleave', handleDocumentDragLeave);
      document.removeEventListener('drop', handleDocumentDrop);
    };
  }, [hasImages, isDragOverApp, isTrashFolder]); // Добавлен isTrashFolder в зависимости

  // --- Конец useEffect ---

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

  const handleFileSelect = (event) => {
    const files = Array.from(event.target.files);
    if (files.length > 0) {
      handleFilesAdded(files, 'диалог выбора файлов');
    }
  };

  const handleImportFiles = (files) => {
    handleFilesAdded(files, 'кнопка Import');
  };

  const handleFilesAdded = (files, method) => {
    setSelectedFiles(prev => [...prev, ...files]);
    logFilesInfo(files, method);
    simulateFileUpload(files);
  };

  const handleDragOver = (event) => {
    event.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (event) => {
    event.preventDefault();
    if (!event.currentTarget.contains(event.relatedTarget)) {
      setIsDragging(false);
    }
  };

  const handleDrop = (event) => {
    event.preventDefault();
    setIsDragging(false);
    setIsDragOverApp(false);
    dragCounter.current = 0;
    
    const files = Array.from(event.dataTransfer.files);
    if (files.length > 0) {
      handleFilesAdded(files, 'Drag and Drop');
    }
  };

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
      
      try {
        const buffer = await file.arrayBuffer();
        const array = new Uint8Array(buffer);
        const result = await window.electronAPI.uploadImage(array, file.name, folderId);

        if (result.success) {
          console.log(`Успешно загружено: ${file.name} (ID: ${result.id})`);

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

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // --- ИСПРАВЛЕНИЕ: Условный рендеринг перемещен СЮДА, после всех хуков и логики ---
  
  if (isTrashFolder) {
    return (
      <div className="file-upload-container">
        <div className="upload-disabled-message">
          <svg xmlns="http://www.w3.org/2000/svg" className="upload-disabled-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.694-.833-2.464 0L4.332 16.5c-.77.833.192 2.5 1.732 2.5z"/>
          </svg>
          <p>Загрузка в корзину невозможна</p>
          <p className="upload-disabled-sub">Выберите другую папку для загрузки изображений</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`file-upload-overlay ${hasImages ? 'has-images' : 'no-images'} ${isDragOverApp ? 'drag-active' : ''}`}>
      <div
        className={`upload-area ${isDragging ? 'dragging' : ''} ${hasImages ? 'has-images' : 'no-images'}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <div className="upload-content">
          <h1>Upload files</h1>
          <span className="upload-hint">
            {hasImages 
              ? 'Drop files anywhere to upload' 
              : 'Drag and drop your files here or use the Import button below'
            }
          </span>
          
          {!hasImages && (
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
          )}
        </div>
        
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*"
          onChange={handleFileSelect}
          style={{ display: 'none' }}
        />
      </div>

      {selectedFiles.length > 0 && (
        <div className="files-list-overlay">
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