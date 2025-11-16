import React from 'react';
import './ExportButton.css';
import { ReactComponent as ExportIcon } from '../../icons/ic_export.svg';

const ExportButton = ({ 
  onClick, 
  disabled = false, 
  label = "Export", 
  icon = null,
  className = "",
  type = "button"
}) => {
  const handleClick = (e) => {
    if (!disabled && onClick) {
      onClick(e);
    }
  };

  return (
    <button
      type={type}
      className={`ExportButton ${className} ${disabled ? 'ExportButton--disabled' : ''}`}
      onClick={handleClick}
      disabled={disabled}
    >
      <span className="ExportButton__icon">
        <ExportIcon className="ExportImagesButton__svg" />
      </span>
      <span className="ExportButton__label">
        {label}
      </span>
    </button>
  );
};

export default ExportButton;