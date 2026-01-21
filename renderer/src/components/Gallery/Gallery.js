import React from 'react';
import './Gallery.css';

class Gallery extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      images: [],
      loading: true,
      contextMenu: { visible: false, x: 0, y: 0, imageId: null },
      selectedImages: new Set()
    };
    this.galleryRef = React.createRef();
  }

  componentDidMount() {
    this.loadImages();
    document.addEventListener('click', this.handleClickOutside);
    document.addEventListener('keydown', this.handleKeyDown);
  }
  handleGalleryClick = (e) => {
    // Если клик был не по изображению и не по контекстному меню
    if (!e.target.closest('.gallery-item') && !e.target.closest('.context-menu')) {
      this.setState({ 
        selectedImages: new Set(),
        contextMenu: { visible: false }
      });
      
      // Сбрасываем выбранное изображение в Rightbar
      if (this.props.onImageSelect) {
        this.props.onImageSelect(null);
      }
    }
  };
  componentWillUnmount() {
    document.removeEventListener('click', this.handleClickOutside);
    document.removeEventListener('keydown', this.handleKeyDown);
  }

  handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      this.setState({ 
        selectedImages: new Set(),
        contextMenu: { visible: false }
      });
      
      // Сбрасываем выбранное изображение в Rightbar
      if (this.props.onImageSelect) {
        this.props.onImageSelect(null);
      }
    }
  };

  componentDidUpdate(prevProps) {
    if (prevProps.folderId !== this.props.folderId) {
      this.loadImages();
      this.setState({ selectedImages: new Set() });
    }
  }

  handleClickOutside = (e) => {
    if (this.state.contextMenu.visible && 
        !e.target.closest('.context-menu')) {
      this.setState({ contextMenu: { visible: false } });
    }
  };

  loadImages = async () => {
    const { folderId, onImagesLoaded } = this.props;
    this.setState({ loading: true });

    try {
      console.log(`🔄 Загрузка изображений для папки ${folderId}...`);
      const images = await window.electronAPI.getImages(folderId);
      console.log(`📊 Получено ${images.length} изображений из БД`);
      
      const imagesWithUrls = await Promise.all(
        images.map(async (image) => {
          console.log(`Обработка изображения ${image.id}: ${image.fileName}`);
          console.log(`  thumbnailPath: ${image.thumbnailPath}`);
          console.log(`  filePath: ${image.filePath}`);
          
          let url = '';
          let originalUrl = '';
          let hasThumbnail = false;
          
          // Пробуем загрузить миниатюру
          if (image.thumbnailPath) {
            try {
              url = await window.electronAPI.getImageUrl(image.thumbnailPath);
              hasThumbnail = true;
              console.log(`  ✅ Миниатюра загружена: ${url.substring(0, 100)}...`);
            } catch (thumbError) {
              console.warn(`  ❌ Ошибка загрузки миниатюры: ${thumbError.message}`);
            }
          }
          
          // Если миниатюры нет или не загрузилась, пробуем оригинал
          if (!url && image.filePath) {
            try {
              url = await window.electronAPI.getImageUrl(image.filePath);
              originalUrl = url;
              console.log(`  📷 Используем оригинал: ${url.substring(0, 100)}...`);
            } catch (origError) {
              console.error(`  ❌ Ошибка загрузки оригинала: ${origError.message}`);
            }
          }
          
          return {
            ...image,
            url: url || 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgdmlld0JveD0iMCAwIDEwMCAxMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjEwMCIgaGVpZ2h0PSIxMDAiIGZpbGw9IiMyQTJBMkEiLz48cGF0aCBkPSJNNjUgMzVINDFDNCAzNSA0IDM1IDQgNzJDNCA3MiA0IDc4IDQxIDc4SDc5Qzc5IDc4IDg1IDc4IDg1IDcyQzg1IDcyIDg1IDU5IDg1IDU5VjQxQzg1IDM1IDc5IDM1IDc5IDM1SDY1WiIgZmlsbD0iIzRBNEE0QSIvPjxwYXRoIGQ9Ik0zNSA2NUg1OUwzNSA0MVY2NVoiIGZpbGw9IiM2NjYiLz48L3N2Zz4=',
            originalUrl,
            hasThumbnail,
            error: !url
          };
        })
      );
      
      console.log(`✅ Всего загружено ${imagesWithUrls.length} изображений`);
      console.log(`🎯 С миниатюрами: ${imagesWithUrls.filter(img => img.hasThumbnail).length}`);

      this.setState({ 
        images: imagesWithUrls, 
        loading: false 
      });
      
      if (onImagesLoaded) {
        onImagesLoaded(imagesWithUrls);
      }
    } catch (err) {
      console.error('❌ Ошибка загрузки изображений:', err);
      this.setState({ images: [], loading: false });
      
      if (onImagesLoaded) {
        onImagesLoaded([]);
      }
    }
  };

  handleImageClick = (e, image) => {
    e.stopPropagation();
    
    const { selectedImages } = this.state;
    const newSelectedImages = new Set(selectedImages);
    
    if (e.ctrlKey || e.metaKey) {
      if (newSelectedImages.has(image.id)) {
        newSelectedImages.delete(image.id);
      } else {
        newSelectedImages.add(image.id);
      }
    } else {
      newSelectedImages.clear();
      newSelectedImages.add(image.id);
      
      if (this.props.onImageSelect) {
        this.props.onImageSelect(image);
      }
    }
    
    this.setState({ selectedImages: newSelectedImages });
  };

  handleContextMenu = (e, image) => {
    e.preventDefault();
    
    const { selectedImages } = this.state;
    let newSelectedImages = new Set(selectedImages);
    
    if (!newSelectedImages.has(image.id)) {
      newSelectedImages.clear();
      newSelectedImages.add(image.id);
      
      if (this.props.onImageSelect) {
        this.props.onImageSelect(image);
      }
    }
    
    this.setState({ 
      selectedImages: newSelectedImages,
      contextMenu: { 
        visible: true, 
        x: e.clientX, 
        y: e.clientY, 
        imageId: image.id 
      } 
    });
  };

  handleMoveToTrash = (imageId = null) => {
    const { selectedImages } = this.state;
    const imagesToDelete = imageId ? [imageId] : Array.from(selectedImages);
    
    if (imagesToDelete.length === 0) return;
    
    if (window.confirm(`Удалить ${imagesToDelete.length} изображений в корзину?`)) {
      imagesToDelete.forEach(id => {
        if (this.props.onMoveToTrash) {
          this.props.onMoveToTrash(id);
        }
      });
      
      this.setState({ 
        selectedImages: new Set(),
        contextMenu: { visible: false }
      }, () => {
        setTimeout(() => this.loadImages(), 1000);
      });
    }
  };

  handleRestoreFromTrash = (imageId = null) => {
    const { selectedImages } = this.state;
    const imagesToRestore = imageId ? [imageId] : Array.from(selectedImages);
    
    if (imagesToRestore.length === 0) return;
    
    if (window.confirm(`Восстановить ${imagesToRestore.length} изображений из корзины?`)) {
      imagesToRestore.forEach(id => {
        if (this.props.onRestoreFromTrash) {
          this.props.onRestoreFromTrash(id, 2);
        }
      });
      
      this.setState({ 
        selectedImages: new Set(),
        contextMenu: { visible: false }
      }, () => {
        setTimeout(() => this.loadImages(), 1000);
      });
    }
  };

  handleDeletePermanently = (imageId = null) => {
    const { selectedImages } = this.state;
    const imagesToDelete = imageId ? [imageId] : Array.from(selectedImages);
    
    if (imagesToDelete.length === 0) return;
    
    const message = imagesToDelete.length === 1 
      ? 'Вы уверены, что хотите окончательно удалить это изображение?'
      : `Вы уверены, что хотите окончательно удалить ${imagesToDelete.length} изображений?`;
    
    if (window.confirm(message)) {
      imagesToDelete.forEach(id => {
        if (this.props.onDeletePermanently) {
          this.props.onDeletePermanently(id);
        }
      });
      
      this.setState({ 
        selectedImages: new Set(),
        contextMenu: { visible: false }
      }, () => {
        setTimeout(() => this.loadImages(), 1000);
      });
    }
  };

  render() {
    const { images, loading, contextMenu, selectedImages } = this.state;
    const { isTrashFolder, onEmptyTrash } = this.props;

    if (loading) {
      return (
        <div 
      className="gallery" 
      ref={this.galleryRef}
      onClick={this.handleGalleryClick}
        >
          <div className="gallery-header">
            <h2>Загрузка...</h2>
          </div>
          <div className="gallery-content">
            <div className="gallery-loading">
              <div className="loading-spinner"></div>
              <p>Загрузка изображений</p>
            </div>
          </div>
        </div>
      );
    }

    if (images.length === 0) {
      return (
        <div className="gallery">
          <div className="gallery-header">
            <h2>
              {isTrashFolder ? 'Корзина' : 'Изображения'}: 0
              {isTrashFolder && (
                <button 
                  className="gallery-empty-trash-btn"
                  onClick={() => onEmptyTrash && onEmptyTrash()}
                  title="Очистить корзину"
                >
                  Очистить корзину
                </button>
              )}
            </h2>
          </div>
          <div className="gallery-content">
            <div className="gallery-placeholder">
              <p>{isTrashFolder ? 'Корзина пуста' : 'Нет изображений в этой папке'}</p>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="gallery">
        <div className="gallery-header">
          <h2>
            {isTrashFolder ? 'Корзина' : 'Изображения'}: {images.length}
            {isTrashFolder && (
              <button 
                className="gallery-empty-trash-btn"
                onClick={() => onEmptyTrash && onEmptyTrash()}
                title="Очистить корзину"
              >
                Очистить корзину
              </button>
            )}
          </h2>
          <div className="gallery-selection-info">
            {selectedImages.size > 0 && `Выбрано: ${selectedImages.size}`}
            {selectedImages.size > 0 && !isTrashFolder && (
              <button 
                className="gallery-action-btn gallery-action-btn--delete"
                onClick={() => this.handleMoveToTrash()}
                title="Удалить выбранное в корзину"
              >
                Удалить ({selectedImages.size})
              </button>
            )}
            {selectedImages.size > 0 && isTrashFolder && (
              <>
                <button 
                  className="gallery-action-btn gallery-action-btn--restore"
                  onClick={() => this.handleRestoreFromTrash()}
                  title="Восстановить выбранное"
                >
                  Восстановить ({selectedImages.size})
                </button>
                <button 
                  className="gallery-action-btn gallery-action-btn--permanent"
                  onClick={() => this.handleDeletePermanently()}
                  title="Удалить выбранное навсегда"
                >
                  Удалить ({selectedImages.size})
                </button>
              </>
            )}
          </div>
        </div>
        
        <div className="gallery-content">
          <div className="gallery-grid">
            {images.map((image) => (
              <div
                key={image.id}
                className={`gallery-item ${selectedImages.has(image.id) ? 'selected' : ''}`}
                onClick={(e) => this.handleImageClick(e, image)}
                onContextMenu={(e) => this.handleContextMenu(e, image)}
              >
                <div className="gallery-item-image-container">
                  <img
                    src={image.url}
                    alt={image.fileName}
                    className="gallery-item-image"
                    onError={(e) => {
                      console.error(`Ошибка загрузки изображения ${image.id}:`, image.url);
                      e.target.style.display = 'none';
                      const errorDiv = e.target.nextElementSibling;
                      if (errorDiv) {
                        errorDiv.style.display = 'flex';
                      }
                    }}
                  />
                  {image.error && (
                    <div className="gallery-item-error">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <circle cx="12" cy="12" r="10" strokeWidth="2"/>
                        <path d="M12 8v4m0 4h.01" strokeWidth="2"/>
                      </svg>
                      <p>Ошибка загрузки</p>
                    </div>
                  )}
                  
                  {selectedImages.has(image.id) && (
                    <div className="gallery-item-selection">
                      <div className="selection-checkbox">
                        ✓
                      </div>
                    </div>
                  )}
                  
                  {image.hasThumbnail && (
                    <div className="thumbnail-badge" title="Миниатюра">
                      📷
                    </div>
                  )}
                </div>
                <div className="gallery-item-name">
                  {image.fileName}
                </div>
              </div>
            ))}
          </div>
        </div>

        {contextMenu.visible && (
          <div 
            className="context-menu"
            style={{ 
              position: 'fixed', 
              left: contextMenu.x, 
              top: contextMenu.y, 
              zIndex: 1000 
            }}
            onClick={() => this.setState({ contextMenu: { visible: false } })}
          >
            {!isTrashFolder ? (
              <>
                <button
                  className="context-menu__item"
                  onClick={() => this.handleMoveToTrash(contextMenu.imageId)}
                >
                  Удалить в корзину
                </button>
              </>
            ) : (
              <>
                <button
                  className="context-menu__item"
                  onClick={() => this.handleRestoreFromTrash(contextMenu.imageId)}
                >
                  Восстановить
                </button>
                <button
                  className="context-menu__item context-menu__item--danger"
                  onClick={() => this.handleDeletePermanently(contextMenu.imageId)}
                >
                  Удалить навсегда
                </button>
              </>
            )}
          </div>
        )}
      </div>
    );
  }
}

export default Gallery;