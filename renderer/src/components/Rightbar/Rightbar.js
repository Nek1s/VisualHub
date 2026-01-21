import React from 'react';
import './Rightbar.css';
import InputField from '../InputField/InputField';
import ImagePreview from '../imagePreview/imagePreview';
import ExportButton from '../ExportButton/ExportButton';

// Вспомогательная функция для получения имени файла без расширения
const getFileNameWithoutExtension = (filename) => {
  if (!filename) return '';
  const lastDotIndex = filename.lastIndexOf('.');
  if (lastDotIndex === -1) return filename;
  return filename.substring(0, lastDotIndex);
};

// Вспомогательная функция для получения расширения файла
const getFileExtension = (filename) => {
  if (!filename) return '';
  const lastDotIndex = filename.lastIndexOf('.');
  if (lastDotIndex === -1) return '';
  return filename.substring(lastDotIndex + 1).toLowerCase();
};

class Rightbar extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      title: '',
      description: '',
      link: '',
      isCopied: false,
      selectedFolders: [],
      availableFolders: [],
      isFolderMenuOpen: false,
      newFolderName: '',
      // Данные изображения
      imageProperties: {
        dimension: '0 × 0',
        size: '0 Bytes',
        type: 'Unknown',
        dataImported: 'Unknown'
      },
      // Состояние для редактирования
      isEditingTitle: false,
      isEditingDescription: false,
      isEditingLink: false,
      originalTitle: '',
      originalDescription: '',
      originalLink: ''
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

  componentDidUpdate(prevProps) {
    // Обновляем данные при смене выбранного изображения
    if (prevProps.selectedImage !== this.props.selectedImage) {
      this.loadImageData(this.props.selectedImage);
    }

    if (prevProps.selectedImage && !this.props.selectedImage) {
      // Если изображение снято, сбрасываем поля
      this.resetFields();
    }

    // Автоподстройка высоты textarea
    if (this.textareaRef.current) {
      this.textareaRef.current.style.height = 'auto';
      this.textareaRef.current.style.height = this.textareaRef.current.scrollHeight + 'px';
    }
  }

  loadImageData = (image) => {
    if (!image) {
      this.resetFields();
      return;
    }

    console.log('Rightbar обновился для изображения:', image);

    // Загружаем теги/папки для изображения
    this.loadFoldersForImage(image.id);

    // Получаем имя файла без расширения для отображения
    const fileNameWithoutExt = image.fileName ? getFileNameWithoutExtension(image.fileName) : '';
    
    this.setState({
      title: image.title || fileNameWithoutExt || '',
      description: image.description || '',
      link: image.link || '',
      originalTitle: image.title || fileNameWithoutExt || '',
      originalDescription: image.description || '',
      originalLink: image.link || '',
      imageProperties: {
        dimension: image.width && image.height ? `${image.width} × ${image.height}` : 'Unknown',
        size: image.fileSize ? this.formatFileSize(image.fileSize) : 'Unknown',
        type: this.getFileType(image.fileName),
        dataImported: image.createdAt ? new Date(image.createdAt).toLocaleDateString() : 'Unknown'
      }
    });
  };

  resetFields = () => {
    this.setState({
      title: '',
      description: '',
      link: '',
      selectedFolders: [],
      imageProperties: {
        dimension: '0 × 0',
        size: '0 Bytes',
        type: 'Unknown',
        dataImported: 'Unknown'
      }
    });
  };

  loadFoldersForImage = async (imageId) => {
    // TODO: Реализовать загрузку тегов/папок для изображения из БД
    // Пока используем заглушку
    this.setState({
      selectedFolders: [],
      availableFolders: ['Design', 'Inspiration', 'Work', 'Personal']
    });
  };

  // ============= ОБРАБОТЧИКИ ИЗМЕНЕНИЯ ПОЛЕЙ =============

  handleTitleChange = (value) => {
    this.setState({ title: value });
  };

  handleDescriptionChange = (value) => {
    this.setState({ description: value });
  };

  handleLinkChange = (value) => {
    this.setState({ link: value });
  };

  // Сохранение изменений в БД
  saveFieldToDatabase = async (field, value) => {
    const { selectedImage, onImageUpdated } = this.props;
    if (!selectedImage || !window.electronAPI?.updateImageField) return;

    try {
      const result = await window.electronAPI.updateImageField(selectedImage.id, field, value);
      if (result.success) {
        console.log(`Поле ${field} сохранено`);
        
        // Оповещаем родительский компонент об обновлении изображения
        if (onImageUpdated) {
          onImageUpdated(); // Вызываем без параметров
        }
          
        // Обновляем оригинальные значения
        if (field === 'title') {
          this.setState({ originalTitle: value });
        } else if (field === 'description') {
          this.setState({ originalDescription: value });
        } else if (field === 'link') {
          this.setState({ originalLink: value });
        }
        
        // Показываем уведомление
        alert('Изменения сохранены');
      } else {
        console.error(`Ошибка сохранения поля ${field}:`, result.error);
        alert(`Ошибка сохранения: ${result.error}`);
      }
    } catch (error) {
      console.error('Ошибка сохранения поля:', error);
      alert('Ошибка сохранения поля');
    }
  };

  handleTitleBlur = () => {
    if (this.state.title !== this.state.originalTitle && this.state.title.trim() !== '') {
      this.saveFieldToDatabase('title', this.state.title);
    }
  };

  handleDescriptionBlur = () => {
    if (this.state.description !== this.state.originalDescription) {
      this.saveFieldToDatabase('description', this.state.description);
    }
  };

  handleLinkBlur = () => {
    if (this.state.link !== this.state.originalLink) {
      this.saveFieldToDatabase('link', this.state.link);
    }
  };

  handleTitleKeyPress = (e) => {
    if (e.key === 'Enter') {
      e.target.blur();
    }
  };

  // ============= РАБОТА С ПАПКАМИ/ТЕГАМИ =============

  toggleFolderMenu = () => {
    this.setState(prevState => ({ 
      isFolderMenuOpen: !prevState.isFolderMenuOpen,
      newFolderName: ''
    }));
  };

  addFolder = (folderName) => {
    const { selectedFolders, availableFolders } = this.state;
    
    if (!folderName || selectedFolders.includes(folderName)) return;

    const newSelectedFolders = [...selectedFolders, folderName];
    this.setState({ selectedFolders: newSelectedFolders });

    // TODO: Сохранить связь изображения с папкой/тегом в БД
    console.log('Добавлена папка:', folderName);
  };

  removeFolder = (folderToRemove) => {
    const newSelectedFolders = this.state.selectedFolders.filter(
      folder => folder !== folderToRemove
    );
    this.setState({ selectedFolders: newSelectedFolders });

    // TODO: Удалить связь изображения с папкой/тегом в БД
    console.log('Удалена папка:', folderToRemove);
  };

  handleCreateFolder = () => {
    const { newFolderName } = this.state;
    if (newFolderName.trim()) {
      this.addFolder(newFolderName.trim());
      this.setState({ newFolderName: '' });
    }
  };

  handleNewFolderKeyPress = (e) => {
    if (e.key === 'Enter') {
      this.handleCreateFolder();
    }
  };

  handleNewFolderNameChange = (value) => {
    this.setState({ newFolderName: value });
  };

  // ============= РАБОТА С ССЫЛКАМИ =============

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

  // ============= УТИЛИТЫ =============

  formatFileSize = (bytes) => {
    if (!bytes || bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  getFileType = (filename) => {
    if (!filename) return 'Unknown';
    const ext = getFileExtension(filename);
    return ext === 'jpeg' ? 'jpg' : ext;
  };

  adjustTextareaHeight = () => {
    const textarea = this.textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = textarea.scrollHeight + 'px';
    }
  };

  // ============= ДЕЙСТВИЯ С ИЗОБРАЖЕНИЕМ =============

  handleMoveToTrash = () => {
    const { selectedImage, onMoveToTrash } = this.props;
    if (selectedImage && onMoveToTrash) {
      onMoveToTrash(selectedImage.id);
    }
  };

  handleRestoreFromTrash = () => {
    const { selectedImage, onRestoreFromTrash } = this.props;
    if (selectedImage && onRestoreFromTrash) {
      onRestoreFromTrash(selectedImage.id, 2); // Восстанавливаем в Uncategorized
    }
  };

  handleDeletePermanently = () => {
    const { selectedImage, onDeletePermanently } = this.props;
    if (selectedImage && onDeletePermanently) {
      if (window.confirm('Вы уверены, что хотите окончательно удалить это изображение?')) {
        onDeletePermanently(selectedImage.id);
      }
    }
  };

  handleExportImage = async () => {
    const { selectedImage } = this.props;
    if (!selectedImage || !window.electronAPI?.exportImage) return;

    try {
      const result = await window.electronAPI.exportImage(selectedImage.id);
      if (result.success) {
        alert(`Изображение успешно экспортировано:\n${result.path}`);
      } else {
        alert(`Ошибка экспорта: ${result.error || result.message}`);
      }
    } catch (error) {
      console.error('Ошибка экспорта:', error);
      alert('Ошибка при экспорте изображения');
    }
  };

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

    const { selectedImage, isTrashFolder } = this.props;
    const currentImagePath = selectedImage ? selectedImage.url : undefined;

    // Папки доступные для добавления
    const availableToAdd = availableFolders.filter(folder => !selectedFolders.includes(folder));

    return (
      <div className='Rightbar'>
        <div className="rightbar-content">
          <ImagePreview imagePath={currentImagePath} />
          
          {/* Секция действий с изображением */}
          {selectedImage && (
            <div className="rightbar-section">
              <label className="rightbar-label">Actions</label>
              <div className="actions-container">
                {!isTrashFolder ? (
                  <>
                    <button
                      className="action-button action-button--rename"
                      onClick={() => document.querySelector('.title-input')?.focus()}
                      title="Переименовать"
                    >
                      <svg className="action-button-icon" viewBox="0 0 24 24" fill="none">
                        <path d="M17 3a2.828 2.828 0 114 4L7.5 20.5 2 22l1.5-5.5L17 3z" 
                          stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                      <span>Rename</span>
                    </button>
                    <button
                      className="action-button action-button--delete"
                      onClick={this.handleMoveToTrash}
                      title="Удалить в корзину"
                    >
                      <svg className="action-button-icon" viewBox="0 0 24 24" fill="none">
                        <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2M10 11v6M14 11v6" 
                          stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                      <span>Delete</span>
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      className="action-button action-button--restore"
                      onClick={this.handleRestoreFromTrash}
                      title="Восстановить из корзины"
                    >
                      <svg className="action-button-icon" viewBox="0 0 24 24" fill="none">
                        <path d="M3 10h10a8 8 0 018 8v2M3 10l6 6M3 10l6-6" 
                          stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                      <span>Restore</span>
                    </button>
                    <button
                      className="action-button action-button--permanent"
                      onClick={this.handleDeletePermanently}
                      title="Удалить навсегда"
                    >
                      <svg className="action-button-icon" viewBox="0 0 24 24" fill="none">
                        <path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" 
                          stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                      <span>Delete</span>
                    </button>
                  </>
                )}
              </div>
            </div>
          )}
          
          {/* Основная информация */}
          <div className="rightbar-section">
            <label className="rightbar-label">Name</label>
            <InputField
              value={title}
              onChange={this.handleTitleChange}
              onBlur={this.handleTitleBlur}
              onKeyPress={this.handleTitleKeyPress}
              placeholder="Enter name"
              className="title-input"
              disabled={!selectedImage || isTrashFolder} // Блокируем если в корзине
            />
          </div>
          
          <div className="rightbar-section">
            <label className="rightbar-label">Description</label>
            <textarea
              ref={this.textareaRef}
              className="rightbar-textarea rightbar-textarea--autoexpand"
              value={description}
              onChange={(e) => this.handleDescriptionChange(e.target.value)}
              onBlur={this.handleDescriptionBlur}
              placeholder="Enter Description"
              rows={3}
              disabled={!selectedImage || isTrashFolder} // Блокируем если в корзине
            />
          </div>

          <div className="rightbar-section">
            <label className="rightbar-label">Link</label>
            <div className="link-input-container">
              <InputField
                value={link}
                onChange={this.handleLinkChange}
                onBlur={this.handleLinkBlur}
                onKeyPress={this.handleLinkKeyPress}
                placeholder="Enter Link"
                className="link-input"
                disabled={!selectedImage || isTrashFolder} // Блокируем если в корзине
              />
              <button
                className={`link-button ${isCopied ? 'link-button--copied' : ''}`}
                onClick={this.handleCopyLink}
                disabled={!link.trim() || !selectedImage || isTrashFolder}
                title={isCopied ? "Ссылка скопирована!" : "Скопировать ссылку"}
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

          {/* Секция папок/тегов */}
          <div className="rightbar-section">
            <label className="rightbar-label">Folders / Tags</label>
            <div className="folders-container" ref={this.folderMenuRef}>
              <div className="selected-folders">
                {selectedFolders.map((folder, index) => (
                  <div key={index} className="folder-tag">
                    <span className="folder-tag__text">{folder}</span>
                    <button
                      type="button"
                      className="folder-tag__remove"
                      onClick={() => this.removeFolder(folder)}
                      title={`Удалить ${folder}`}
                      disabled={!selectedImage || isTrashFolder}
                    >
                      <svg className="folder-tag__remove-icon" viewBox="0 0 24 24" fill="none">
                        <path d="M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </button>
                  </div>
                ))}
                
                <button
                  type="button"
                  className="folder-add-button"
                  onClick={this.toggleFolderMenu}
                  title="Добавить папку/тег"
                  disabled={!selectedImage || isTrashFolder}
                >
                  <svg className="folder-add-button__icon" viewBox="0 0 24 24" fill="none">
                    <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>
              </div>

              {isFolderMenuOpen && (
                <div className="folder-menu">
                  <div className="folder-menu__create">
                    <InputField
                      className="folder-menu__input"
                      value={newFolderName}
                      onChange={this.handleNewFolderNameChange}
                      onKeyPress={this.handleNewFolderKeyPress}
                      placeholder="Новый тег"
                      disabled={!selectedImage || isTrashFolder}
                    />
                    <button
                      type="button"
                      className="folder-menu__create-button"
                      onClick={this.handleCreateFolder}
                      disabled={!newFolderName.trim() || !selectedImage || isTrashFolder}
                    >
                      Create
                    </button>
                  </div>

                  <div className="folder-menu__list">
                    {availableToAdd.length > 0 ? (
                      availableToAdd.map((folder, index) => (
                        <button
                          key={index}
                          type="button"
                          className="folder-menu__item"
                          onClick={() => this.addFolder(folder)}
                          disabled={!selectedImage || isTrashFolder}
                        >
                          <span className="folder-menu__item-text">{folder}</span>
                        </button>
                      ))
                    ) : (
                      <div className="folder-menu__empty">
                        Нет доступных тегов
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Свойства изображения */}
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
                <span className="property-label">Imported</span>
                <span className="property-value">{imageProperties.dataImported}</span>
              </div>
            </div>
          </div>

          {/* Кнопка экспорта */}
          <ExportButton 
            onClick={this.handleExportImage}
            label="Export image"
            disabled={!selectedImage}
          />
        </div>
      </div>
    );
  }
}

export default Rightbar;