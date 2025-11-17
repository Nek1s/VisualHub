import React from 'react';
import './Gallery.css';

class Gallery extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      images: [],
      loading: true
    };
  }

  componentDidMount() {
    this.loadImages();
  }

  componentDidUpdate(prevProps) {
    if (prevProps.folderId !== this.props.folderId) {
      this.loadImages();
    }
  }

  loadImages = async () => {
    const { folderId } = this.props;
    this.setState({ loading: true });

    try {
      const images = await window.electronAPI.getImages(folderId);
      const imagesWithUrls = await Promise.all(
        images.map(async (image) => {
          if (image.filePath) {
            const url = await window.electronAPI.getImageUrl(image.filePath);
            return { ...image, url };
          } else {
            console.warn('Изображение без filePath:', image);
            return image;
          }
        })
      );

      this.setState({ images: imagesWithUrls, loading: false });
    } catch (err) {
      console.error('Ошибка загрузки изображений:', err);
      this.setState({ images: [], loading: false });
    }
  };

  handleImageClick = (image) => {
    if (this.props.onImageSelect) {
      this.props.onImageSelect(image);
    }
  };

  formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  render() {
    const { images, loading } = this.state;

    if (loading) {
      return (
        <div className="gallery">
          <div className="gallery-loading">
            <div className="gallery-spinner"></div>
            <p>Загрузка изображений...</p>
          </div>
        </div>
      );
    }

    if (images.length === 0) {
      return (
        <div className="gallery">
          <div className="gallery-placeholder">
            <svg
              className="gallery-placeholder-icon"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
            >
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2" strokeWidth="2"/>
              <circle cx="8.5" cy="8.5" r="1.5" strokeWidth="2"/>
              <path d="M21 15l-5-5L5 21" strokeWidth="2"/>
            </svg>
            <p>Нет изображений в этой папке</p>
          </div>
        </div>
      );
    }

    return (
      <div className="gallery">
        <div className="gallery-header">
          <h2>Изображений: {images.length}</h2>
        </div>
        <div className="gallery-grid">
          {images.map((image) => (
            <div
              key={image.id}
              className="gallery-item"
              onClick={() => this.handleImageClick(image)}
            >
              <img
                src={image.url}
                alt={image.fileName}
                className="gallery-item-image"
                onError={(e) => {
                  e.target.style.display = 'none';
                  e.target.nextSibling.style.display = 'flex';
                }}
              />
              <div className="gallery-item-error" style={{ display: 'none' }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <circle cx="12" cy="12" r="10" strokeWidth="2"/>
                  <path d="M12 8v4m0 4h.01" strokeWidth="2"/>
                </svg>
                <p>Ошибка загрузки</p>
              </div>
              <div className="gallery-item-info">
                <div className="gallery-item-name">{image.fileName}</div>
                <div className="gallery-item-date">{this.formatDate(image.created_at)}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }
}

export default Gallery;
