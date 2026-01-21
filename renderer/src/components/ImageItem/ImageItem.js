import React from 'react';
import './ImageItem.css';

class ImageItem extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      isHovered: false,
      isSelected: false,
      imageError: false,
      imageLoaded: false
    };
  }

  componentDidMount() {
    // Предзагрузка изображения
    this.preloadImage();
  }

  componentDidUpdate(prevProps) {
    if (prevProps.image.url !== this.props.image.url) {
      this.preloadImage();
    }
  }

  preloadImage = () => {
    const { image } = this.props;
    
    if (image.url) {
      const img = new Image();
      img.src = image.url;
      img.onload = () => {
        this.setState({ imageLoaded: true, imageError: false });
      };
      img.onerror = () => {
        console.error('Ошибка загрузки изображения:', image.url);
        this.setState({ imageError: true, imageLoaded: false });
        
        // Пробуем загрузить оригинал как fallback
        if (image.originalUrl && image.originalUrl !== image.url) {
          const fallbackImg = new Image();
          fallbackImg.src = image.originalUrl;
          fallbackImg.onload = () => {
            console.log('Загружен оригинал как fallback');
            this.setState({ imageLoaded: true, imageError: false });
          };
        }
      };
    }
  };

  handleClick = (e) => {
    if (this.props.onClick) {
      this.props.onClick(e, this.props.image);
    }
  };

  handleContextMenu = (e) => {
    e.preventDefault();
    if (this.props.onContextMenu) {
      this.props.onContextMenu(e, this.props.image);
    }
  };

  handleMouseEnter = () => {
    this.setState({ isHovered: true });
  };

  handleMouseLeave = () => {
    this.setState({ isHovered: false });
  };

  handleImageError = () => {
    this.setState({ imageError: true });
  };

  handleImageLoad = () => {
    this.setState({ imageLoaded: true, imageError: false });
  };

  render() {
    const { image, isSelected, isTrashFolder } = this.props;
    const { isHovered, imageError, imageLoaded } = this.state;

    return (
      <div
        className={`image-item ${isSelected ? 'selected' : ''}`}
        onClick={this.handleClick}
        onContextMenu={this.handleContextMenu}
        onMouseEnter={this.handleMouseEnter}
        onMouseLeave={this.handleMouseLeave}
        data-image-id={image.id}
      >
        <div className="image-item-image-container">
          {image.url && !imageError ? (
            <img
              src={image.url}
              alt={image.fileName}
              className={`image-item-image ${imageLoaded ? 'loaded' : 'loading'}`}
              onError={this.handleImageError}
              onLoad={this.handleImageLoad}
              loading="lazy"
            />
          ) : (
            <div className="image-item-placeholder">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2" strokeWidth="2"/>
                <circle cx="8.5" cy="8.5" r="1.5" strokeWidth="2"/>
                <path d="M21 15l-5-5L5 21" strokeWidth="2"/>
              </svg>
              <span>No Image</span>
            </div>
          )}
          
          {/* Индикатор миниатюры */}
          {image.hasThumbnail && (
            <div className="thumbnail-badge" title="Миниатюра">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2" strokeWidth="2"/>
                <circle cx="8.5" cy="8.5" r="1.5" strokeWidth="2"/>
              </svg>
            </div>
          )}
          
          {/* Чекбокс выделения */}
          {isSelected && (
            <div className="image-item-selection">
              <div className="selection-checkbox">
                <svg viewBox="0 0 24 24" fill="none">
                  <path d="M20 6L9 17l-5-5" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
            </div>
          )}
          
          {/* Overlay с информацией */}
          {(isHovered || isSelected) && (
            <div className="image-item-overlay">
              <div className="image-item-info">
                <span className="image-item-name">{image.fileName}</span>
                {isTrashFolder && image.modifiedAt && (
                  <span className="image-item-deleted-date">
                    Удалено: {new Date(image.modifiedAt).toLocaleDateString()}
                  </span>
                )}
              </div>
              
              {/* Быстрые действия */}
              <div className="image-item-actions">
                {!isTrashFolder ? (
                  <button
                    className="image-item-action-btn image-item-action-btn--delete"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (this.props.onMoveToTrash) {
                        this.props.onMoveToTrash(image.id);
                      }
                    }}
                    title="Удалить в корзину"
                  >
                    <svg viewBox="0 0 24 24" fill="none">
                      <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2M10 11v6M14 11v6" 
                        stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </button>
                ) : (
                  <>
                    <button
                      className="image-item-action-btn image-item-action-btn--restore"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (this.props.onRestoreFromTrash) {
                          this.props.onRestoreFromTrash(image.id);
                        }
                      }}
                      title="Восстановить"
                    >
                      <svg viewBox="0 0 24 24" fill="none">
                        <path d="M3 10h10a8 8 0 018 8v2M3 10l6 6M3 10l6-6" 
                          stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </button>
                    <button
                      className="image-item-action-btn image-item-action-btn--permanent"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (this.props.onDeletePermanently) {
                          this.props.onDeletePermanently(image.id);
                        }
                      }}
                      title="Удалить навсегда"
                    >
                      <svg viewBox="0 0 24 24" fill="none">
                        <path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" 
                          stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </button>
                  </>
                )}
              </div>
            </div>
          )}
          
          {/* Индикатор загрузки */}
          {!imageLoaded && !imageError && (
            <div className="image-item-loading">
              <div className="loading-spinner-small"></div>
            </div>
          )}
        </div>
      </div>
    );
  }
}

export default ImageItem;