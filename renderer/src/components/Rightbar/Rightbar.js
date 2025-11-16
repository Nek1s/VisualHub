import React from 'react';
import './Rightbar.css';
import InputField from '../InputField/InputField';
import ImagePreview from '../imagePreview/imagePreview';
import ExportButton from '../ExportButton/ExportButton';
import { ReactComponent as FolderIcon } from '../../icons/system_folders/ic_folder.svg';

class Rightbar extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      title: '',
      description: '',
      link: '',
      isCopied: false,
      selectedFolders: ['Design', 'Inspiration'],
      availableFolders: ['Design', 'Inspiration', 'Work', 'Personal', 'Archive', 'Projects', 'References'],
      isFolderMenuOpen: false,
      newFolderName: '',
      // Данные изображения
      imageProperties: {
        dimension: '1920 × 1080',
        size: '2.4 MB',
        type: 'JPEG',
        dataImported: '2024-01-15'
      }
    };
    this.textareaRef = React.createRef();
    this.folderMenuRef = React.createRef();
    this.copyTimeout = null;
  }

  componentDidMount() {
    this.adjustTextareaHeight();
    document.addEventListener('mousedown', this.handleClickOutside);
  }

  componentWillUnmount() {
    document.removeEventListener('mousedown', this.handleClickOutside);
    if (this.copyTimeout) {
      clearTimeout(this.copyTimeout);
    }
  }

  handleClickOutside = (event) => {
    if (this.folderMenuRef.current && !this.folderMenuRef.current.contains(event.target)) {
      this.setState({ isFolderMenuOpen: false });
    }
  };

  handleTitleChange = (value) => {
    this.setState({ title: value });
  };

  handleDescriptionChange = (value) => {
    this.setState({ description: value }, () => {
      this.adjustTextareaHeight();
    });
  };

  handleLinkChange = (value) => {
    this.setState({ link: value });
  };

  adjustTextareaHeight = () => {
    const textarea = this.textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = textarea.scrollHeight + 'px';
    }
  };

  // Открытие/закрытие меню папок
  toggleFolderMenu = () => {
    this.setState(prevState => ({ 
      isFolderMenuOpen: !prevState.isFolderMenuOpen,
      newFolderName: '' // очищаем поле при открытии
    }));
  };

  // Добавление папки в выбранные
  addFolder = (folderName) => {
    const { selectedFolders, availableFolders } = this.state;
    
    if (!folderName || selectedFolders.includes(folderName)) return;

    // Если папки нет в доступных, добавляем её
    if (!availableFolders.includes(folderName)) {
      this.setState(prevState => ({
        availableFolders: [...prevState.availableFolders, folderName]
      }));
    }

    this.setState(prevState => ({
      selectedFolders: [...prevState.selectedFolders, folderName]
    }));
  };

  // Удаление папки из выбранных
  removeFolder = (folderToRemove) => {
    this.setState(prevState => ({
      selectedFolders: prevState.selectedFolders.filter(folder => folder !== folderToRemove)
    }));
  };

  // Создание новой папки
  handleCreateFolder = () => {
    const { newFolderName } = this.state;
    if (newFolderName.trim()) {
      this.addFolder(newFolderName.trim());
      this.setState({ newFolderName: '' });
    }
  };

  // Обработчик Enter для создания папки
  handleNewFolderKeyPress = (e) => {
    if (e.key === 'Enter') {
      this.handleCreateFolder();
    }
  };

  handleNewFolderNameChange = (value) => {
    this.setState({ newFolderName: value });
  };

  handleCopyLink = async () => {
    const { link } = this.state;
    
    if (!link || !link.trim()) {
      alert('Пожалуйста, введите ссылку');
      return;
    }

    let formattedLink = link.trim();
    
    if (!formattedLink.startsWith('http://') && !formattedLink.startsWith('https://')) {
      formattedLink = 'https://' + formattedLink;
    }

    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(formattedLink);
      } else {
        this.fallbackCopyToClipboard(formattedLink);
      }
      
      this.setState({ isCopied: true });
      
      if (this.copyTimeout) {
        clearTimeout(this.copyTimeout);
      }
      this.copyTimeout = setTimeout(() => {
        this.setState({ isCopied: false });
      }, 2000);
      
    } catch (error) {
      console.error('Failed to copy link:', error);
      alert('Не удалось скопировать ссылку в буфер обмена');
    }
  };

  fallbackCopyToClipboard = (text) => {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.top = '0';
    textArea.style.left = '0';
    textArea.style.opacity = '0';
    
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    
    try {
      const successful = document.execCommand('copy');
      if (!successful) {
        throw new Error('Copy command failed');
      }
    } catch (err) {
      throw err;
    } finally {
      document.body.removeChild(textArea);
    }
  };

  handleLinkKeyPress = (e) => {
    if (e.key === 'Enter') {
      this.handleCopyLink();
    }
  };

  componentDidUpdate(prevProps, prevState) {
    if (prevState.description !== this.state.description) {
      this.adjustTextareaHeight();
    }
  }

  render() {
    const { 
      title, 
      description, 
      link, 
      isCopied, 
      imageProperties, 
      selectedFolders, 
      availableFolders,
      isFolderMenuOpen,
      newFolderName
    } = this.state;

    // Папки доступные для добавления (исключая уже выбранные)
    const availableToAdd = availableFolders.filter(folder => !selectedFolders.includes(folder));

    return (
      <div className='Rightbar'>
        <div className="rightbar-content">
          <ImagePreview />
          
          <div className="rightbar-section">
            <label className="rightbar-label">Name</label>
            <InputField
              value={title}
              onChange={this.handleTitleChange}
              placeholder="Enter name"
            />
          </div>
          
          <div className="rightbar-section">
            <label className="rightbar-label">Description</label>
            <textarea
              ref={this.textareaRef}
              className="rightbar-textarea rightbar-textarea--autoexpand"
              value={description}
              onChange={(e) => this.handleDescriptionChange(e.target.value)}
              placeholder="Enter Description"
              rows={3}
            />
          </div>

          <div className="rightbar-section">
            <label className="rightbar-label">Link</label>
            <div className="link-input-container">
              <InputField
                value={link}
                onChange={this.handleLinkChange}
                placeholder="Enter Link"
                onKeyPress={this.handleLinkKeyPress}
                className="link-input"
              />
              <button
                className={`link-button ${isCopied ? 'link-button--copied' : ''}`}
                onClick={this.handleCopyLink}
                disabled={!link.trim()}
                title={isCopied ? "Ссылка скопирована!" : "Скопировать ссылку в буфер обмена"}
                type="button"
              >
                {isCopied ? (
                  <svg className="link-button-icon" viewBox="0 0 24 24" fill="none">
                    <path d="M20 6L9 17L4 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                ) : (
                  <svg className="link-button-icon" viewBox="0 0 24 24" fill="none">
                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2" stroke="currentColor" strokeWidth="2"/>
                    <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" stroke="currentColor" strokeWidth="2"/>
                  </svg>
                )}
              </button>
            </div>
          </div>

          {/* Секция выбора папок */}
          <div className="rightbar-section">
            <label className="rightbar-label">Folders</label>
            <div className="folders-container" ref={this.folderMenuRef}>
              {/* Выбранные папки (теги) */}
              <div className="selected-folders">
                {selectedFolders.map((folder, index) => (
                  <div key={index} className="folder-tag">
                    <span className="folder-tag__text">{folder}</span>
                    <button
                      type="button"
                      className="folder-tag__remove"
                      onClick={() => this.removeFolder(folder)}
                      title={`Удалить ${folder}`}
                    >
                      <svg className="folder-tag__remove-icon" viewBox="0 0 24 24" fill="none">
                        <path d="M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </button>
                  </div>
                ))}
                
                {/* Кнопка добавления */}
                <button
                  type="button"
                  className="folder-add-button"
                  onClick={this.toggleFolderMenu}
                  title="Добавить папку"
                >
                  <svg className="folder-add-button__icon" viewBox="0 0 24 24" fill="none">
                    <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>
              </div>

              {/* Выпадающее меню */}
              {isFolderMenuOpen && (
                <div className="folder-menu">
                  
                  {/* Создание новой папки */}
                  <div className="folder-menu__create">
                    <InputField
                      className="folder-menu__input"
                      value={newFolderName}
                      onChange={this.handleNewFolderNameChange}
                      onKeyPress={this.handleNewFolderKeyPress}
                      placeholder="Enter Name"
                      
                    />
                    <button
                      type="button"
                      className="folder-menu__create-button"
                      onClick={this.handleCreateFolder}
                      disabled={!newFolderName.trim()}
                    >
                      Create
                    </button>
                  </div>

                  {/* Список доступных папок */}
                  <div className="folder-menu__list">
                    {availableToAdd.length > 0 ? (
                      availableToAdd.map((folder, index) => (
                        <button
                          key={index}
                          type="button"
                          className="folder-menu__item"
                          onClick={() => this.addFolder(folder)}
                        >
                          <span className="folder-menu__item-icon">
                            <FolderIcon className="folder-menu-item__svg" />
                          </span>

                          <span className="folder-menu__item-text">{folder}</span>
                        </button>
                      ))
                    ) : (
                      <div className="folder-menu__empty">
                        All folders have already been added
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Секция Properties для изображения */}
          <div className="rightbar-section">
            <label className="rightbar-label">Properties</label>
            <div className="properties-grid">
              <div className="property-row">
                <span className="property-label">Dimension</span>
                <span className="property-value">{imageProperties.dimension}</span>
              </div>
              <div className="property-row">
                <span className="property-label">Size</span>
                <span className="property-value">{imageProperties.size}</span>
              </div>
              <div className="property-row">
                <span className="property-label">Type</span>
                <span className="property-value">{imageProperties.type}</span>
              </div>
              <div className="property-row">
                <span className="property-label">Data imported</span>
                <span className="property-value">{imageProperties.dataImported}</span>
              </div>
            </div>
          </div>

          <ExportButton 
            onClick={() => console.log('Export clicked')}
            label="Export image"
          />
        </div>
      </div>
    );
  }
}

export default Rightbar;