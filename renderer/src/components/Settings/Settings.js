// src/components/Settings/Settings.js
import React, { useState } from 'react';
import './Settings.css';

const Settings = () => {
  const [regeneratingThumbs, setRegeneratingThumbs] = useState(false);
  const [message, setMessage] = useState('');

  const handleRegenerateThumbnails = async () => {
    if (!window.confirm('Пересоздать все миниатюры? Это может занять некоторое время.')) {
      return;
    }

    setRegeneratingThumbs(true);
    setMessage('Создание миниатюр...');

    try {
      const result = await window.electronAPI.regenerateThumbnails();
      
      if (result.success) {
        setMessage(`✅ ${result.message}`);
        
        // Обновляем галерею через 2 секунды
        setTimeout(() => {
          window.location.reload();
        }, 2000);
      } else {
        setMessage(`❌ ${result.message || result.error}`);
      }
    } catch (error) {
      setMessage(`❌ Ошибка: ${error.message}`);
      console.error('Ошибка пересоздания миниатюр:', error);
    } finally {
      setRegeneratingThumbs(false);
    }
  };

  return (
    <div className="settings">
      <h3 className="settings-title">Настройки</h3>
      
      <div className="settings-section">
        <h4 className="settings-section-title">Миниатюры</h4>
        <p className="settings-description">
          Пересоздать миниатюры для всех изображений. Полезно если миниатюры не отображаются или повреждены.
        </p>
        
        <button
          className={`settings-button ${regeneratingThumbs ? 'settings-button--disabled' : ''}`}
          onClick={handleRegenerateThumbnails}
          disabled={regeneratingThumbs}
          title="Пересоздать все миниатюры"
        >
          {regeneratingThumbs ? (
            <>
              <span className="settings-button-spinner"></span>
              Создание...
            </>
          ) : (
            'Пересоздать миниатюры'
          )}
        </button>
        
        {message && (
          <div className={`settings-message ${message.includes('✅') ? 'success' : 'error'}`}>
            {message}
          </div>
        )}
      </div>
    </div>
  );
};

export default Settings;