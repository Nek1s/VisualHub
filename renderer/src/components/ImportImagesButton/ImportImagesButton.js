// ImportImagesButton.js с SVG иконкой
import React, { useRef } from 'react';
import './ImportImagesButton.css';
import { ReactComponent as ImportIcon } from '../../icons/ic_import.svg'; // Путь к вашей иконке

const ImportImagesButton = ({ onFilesSelected, disabled = false }) => {
  const fileInputRef = useRef(null);

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileSelect = (event) => {
    const files = Array.from(event.target.files);
    if (files.length > 0 && onFilesSelected) {
      onFilesSelected(files);
    }
    event.target.value = '';
  };

  return (
    <>
      <button
        className="ImportImagesButton"
        onClick={handleButtonClick}
        disabled={disabled}
        type="button"
      >
        <span className="ImportImagesButton__icon">
          <ImportIcon className="ImportImagesButton__svg" />
        </span>
        <span className="ImportImagesButton__label">Import images</span>
      </button>
      
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/*"
        onChange={handleFileSelect}
        style={{ display: 'none' }}
      />
    </>
  );
};

export default ImportImagesButton;