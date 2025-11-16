import React from 'react';
import './imagePreview.css';

class ImagePreview extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      imageError: false,
      imageLoaded: false
    };
  }

  componentDidUpdate(prevProps) {
    // Сбрасываем состояние при смене изображения
    if (prevProps.imagePath !== this.props.imagePath) {
      this.setState({
        imageError: false,
        imageLoaded: false
      });
    }
  }

  handleImageError = () => {
    this.setState({ imageError: true, imageLoaded: false });
  };

  handleImageLoad = () => {
    this.setState({ imageError: false, imageLoaded: true });
  };

  render() {
    const { imagePath, className = '', onClick } = this.props;
    const { imageError, imageLoaded } = this.state;

    return (
      <div 
        className={`image-preview ${className}`}
        onClick={onClick}
        style={{ cursor: onClick ? 'pointer' : 'default' }}
      >
        {imagePath && !imageError ? (
          <img
            src={imagePath}
            alt="Preview"
            className="image-preview__img"
            onError={this.handleImageError}
            onLoad={this.handleImageLoad}
            style={{ 
              opacity: imageLoaded ? 1 : 0,
              transition: 'opacity 0.3s ease'
            }}
          />
        ) : (
          <div className="image-preview__placeholder">
            <svg 
              className="image-preview__placeholder-icon" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor"
            >
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2" strokeWidth="2"/>
              <circle cx="8.5" cy="8.5" r="1.5" strokeWidth="2"/>
              <path d="M21 15l-5-5L5 21" strokeWidth="2"/>
            </svg>
          </div>
        )}
        
        {imagePath && !imageLoaded && !imageError && (
          <div className="image-preview__loader">
            <div className="image-preview__loader-spinner"></div>
          </div>
        )}
      </div>
    );
  }
}

export default ImagePreview;