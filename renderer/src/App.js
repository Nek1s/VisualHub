import React, { useState, useEffect } from 'react';
import './App.css';
import Leftbar from "./components/Leftbar/Leftbar";
import Rightbar from "./components/Rightbar/Rightbar";
import FileUpload from './components/FileUpload/FileUpload';
import Gallery from './components/Gallery/Gallery';
import TitleBar from './components/TitleBar/TitleBar';
import Settings from './components/Settings/Settings'; // <-- Добавляем импорт

function App() {
  const [selectedFolderId, setSelectedFolderId] = useState(1);
  const [selectedImage, setSelectedImage] = useState(null);
  const [showAddFolderModal, setShowAddFolderModal] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [galleryKey, setGalleryKey] = useState(0);
  const [hasImages, setHasImages] = useState(false);
  const [trashCount, setTrashCount] = useState(0);
  const [showSettings, setShowSettings] = useState(false); // <-- Добавляем состояние для настроек
  const [regeneratingThumbs, setRegeneratingThumbs] = useState(false); // <-- Состояние для кнопки

  const handleRegenerateThumbnails = async () => {
    if (window.confirm('Пересоздать все миниатюры? Это может занять некоторое время.')) {
      setRegeneratingThumbs(true);
      try {
        const result = await window.electronAPI.regenerateThumbnails();
        if (result.success) {
          alert(`Создано ${result.count} миниатюр`);
          setGalleryKey(prev => prev + 1);
        } else {
          alert('Ошибка: ' + result.error);
        }
      } catch (error) {
        console.error('Ошибка:', error);
      } finally {
        setRegeneratingThumbs(false);
      }
    }
  };

  // Загрузка количества изображений в корзине
  useEffect(() => {
    const loadTrashCount = async () => {
      if (window.electronAPI?.getTrashCount) {
        try {
          const count = await window.electronAPI.getTrashCount();
          setTrashCount(count);
        } catch (error) {
          console.error('Ошибка загрузки количества в корзине:', error);
        }
      }
    };

    loadTrashCount();
    const interval = setInterval(loadTrashCount, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleImageUpdated = () => {
    // Просто увеличиваем ключ, чтобы принудительно перезагрузить галерею
    setGalleryKey(prev => prev + 1);
    // Сбрасываем выбранное изображение в Rightbar
    setSelectedImage(null);
  };

  const handleAddFolder = () => {
    setShowAddFolderModal(true);
    setNewFolderName('');
  };

  const handleCloseModal = () => {
    setShowAddFolderModal(false);
    setNewFolderName('');
  };

  const handleUploadComplete = (images) => {
    setHasImages(images && images.length > 0);
    setGalleryKey(prev => prev + 1);
  };

  const handleGalleryUpdate = (images) => {
    setHasImages(images && images.length > 0);
  };

  // Обработчики для удаления
  const handleMoveToTrash = async (imageId) => {
    if (!window.electronAPI?.moveToTrash) return;
    
    try {
      const result = await window.electronAPI.moveToTrash(imageId);
      if (result.success) {
        console.log('Изображение перемещено в корзину');
        setGalleryKey(prev => prev + 1);
        // Обновляем счетчик корзины
        const count = await window.electronAPI.getTrashCount();
        setTrashCount(count);
      }
    } catch (error) {
      console.error('Ошибка перемещения в корзину:', error);
    }
  };

  const handleRestoreFromTrash = async (imageId, targetFolderId = 2) => {
    if (!window.electronAPI?.restoreFromTrash) return;
    
    try {
      const result = await window.electronAPI.restoreFromTrash(imageId, targetFolderId);
      if (result.success) {
        console.log('Изображение восстановлено из корзины');
        setGalleryKey(prev => prev + 1);
        // Обновляем счетчик корзины
        const count = await window.electronAPI.getTrashCount();
        setTrashCount(count);
      }
    } catch (error) {
      console.error('Ошибка восстановления из корзины:', error);
    }
  };

  const handleDeletePermanently = async (imageId) => {
    if (!window.electronAPI?.deletePermanently) return;
    
    try {
      const result = await window.electronAPI.deletePermanently(imageId);
      if (result.success) {
        console.log('Изображение окончательно удалено');
        setGalleryKey(prev => prev + 1);
        // Обновляем счетчик корзины
        const count = await window.electronAPI.getTrashCount();
        setTrashCount(count);
      }
    } catch (error) {
      console.error('Ошибка окончательного удаления:', error);
    }
  };

  const handleEmptyTrash = async () => {
    if (!window.electronAPI?.emptyTrash) return;
    
    if (window.confirm('Вы уверены, что хотите очистить корзину? Все изображения будут удалены безвозвратно.')) {
      try {
        const result = await window.electronAPI.emptyTrash();
        if (result.success) {
          console.log(`Корзина очищена, удалено ${result.deletedCount} изображений`);
          setTrashCount(0);
          if (selectedFolderId === 3) {
            setGalleryKey(prev => prev + 1);
          }
        }
      } catch (error) {
        console.error('Ошибка очистки корзины:', error);
      }
    }
  };

  return (
    <div className="App">
      <TitleBar />
      <div className="app-items">
        <Leftbar 
          onFolderSelect={setSelectedFolderId}
          onAddFolder={handleAddFolder}
          showAddFolderModal={showAddFolderModal}
          onCloseModal={handleCloseModal}
          newFolderName={newFolderName}
          onFolderNameChange={setNewFolderName}
          trashCount={trashCount}
          onEmptyTrash={handleEmptyTrash}
        />
        <div className="app-content">
          <FileUpload
            folderId={selectedFolderId}
            onAddFolder={handleAddFolder}
            onUploadComplete={handleUploadComplete}
            hasImages={hasImages}
          />
          
          <div className="app-gallery-section">
            <Gallery
              key={galleryKey}
              folderId={selectedFolderId}
              onImageSelect={setSelectedImage}
              onImagesLoaded={handleGalleryUpdate}
              onMoveToTrash={handleMoveToTrash}
              onRestoreFromTrash={handleRestoreFromTrash}
              onDeletePermanently={handleDeletePermanently}
              onEmptyTrash={handleEmptyTrash}
              isTrashFolder={selectedFolderId === 3}
              onImageUpdated={handleImageUpdated} // Добавьте эту строку
            />
          </div>
        </div>
        {/* Rightbar всегда отображается, если не открыты настройки */}
        {!showSettings && (
          <Rightbar 
            selectedImage={selectedImage} 
            onMoveToTrash={handleMoveToTrash}
            onRestoreFromTrash={handleRestoreFromTrash}
            onDeletePermanently={handleDeletePermanently}
            isTrashFolder={selectedFolderId === 3}
            onImageUpdated={handleImageUpdated} // Добавьте эту строку
          />
        )}
      </div>
    </div>
  );
}

export default App;