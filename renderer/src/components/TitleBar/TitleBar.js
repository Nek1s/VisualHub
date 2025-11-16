// components/TitleBar.jsx
import React from 'react';
import './TitleBar.css';
import { ReactComponent as CloseIcon } from '../../icons/TitleBar/ic_close.svg';
import { ReactComponent as MaximizeIcon } from '../../icons/TitleBar/ic_maximize.svg';
import { ReactComponent as MinimizeIcon } from '../../icons/TitleBar/ic_minimize.svg';

const TitleBar = () => {
  const handleMinimize = () => {
    if (window.electronAPI) {
      window.electronAPI.minimizeWindow();
    }
  };

  const handleMaximize = () => {
    if (window.electronAPI) {
      window.electronAPI.maximizeWindow();
    }
  };

  const handleClose = () => {
    if (window.electronAPI) {
      window.electronAPI.closeWindow();
    }
  };

  return (
    <div className="title-bar">
      <div className="title-bar-controls">
        <button className="title-bar-button title-bar-minimize" onClick={handleMinimize}>
          <MinimizeIcon className="title-bar-icon" />
        </button>
        <button className="title-bar-button title-bar-maximize" onClick={handleMaximize}>
          <MaximizeIcon className="title-bar-icon" />
        </button>
        <button className="title-bar-button title-bar-close" onClick={handleClose}>
          <CloseIcon className="title-bar-icon" />
        </button>        
      </div>
    </div>
  );
};

export default TitleBar;