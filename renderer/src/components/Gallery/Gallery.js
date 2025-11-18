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
    const { folderId, onImagesLoaded } = this.props;
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
      
      if (onImagesLoaded) {
        onImagesLoaded(imagesWithUrls);
      }
    } catch (err) {
      console.error('Ошибка загрузки изображений:', err);
      this.setState({ images: [], loading: false });
      
      if (onImagesLoaded) {
        onImagesLoaded([]);
      }
    }
  };

  handleImageClick = (image) => {
    if (this.props.onImageSelect) {
      this.props.onImageSelect(image);
    }
  };

  render() {
    const { images, loading } = this.state;

    if (loading) {
      return (
        <div className="gallery">
          <div className="gallery-header">
            <h2>Loading...</h2>
          </div>
        </div>
      );
    }

    if (images.length === 0) {
      return (
        <div className="gallery">
          <div className="gallery-header">
            <h2>Images: 0</h2>
          </div>
          <div className="gallery-content">
            <div className="gallery-placeholder">
              <p>Нет изображений в этой папке</p>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="gallery">
        <div className="gallery-header">
          <h2>Images: {images.length}</h2>
        </div>
        <div className="gallery-content">
          <div className="gallery-grid">
            {images.map((image) => (
              <div
                key={image.id}
                className="gallery-item"
                onClick={() => this.handleImageClick(image)}
              >
                <div className="gallery-item-image-container">
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
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }
}

export default Gallery;