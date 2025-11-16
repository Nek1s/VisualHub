import React from 'react';
import './Leftbar.css';
import Folder from '../Folder/Folder';
import AddFolderButton from '../AddFolderButton/AddFolderButton';
import { ReactComponent as FolderIcon } from '../../icons/system_folders/ic_folder.svg';
import { ReactComponent as TrashIcon } from '../../icons/system_folders/ic_trash.svg';
import { ReactComponent as UncategorizedIcon } from '../../icons/system_folders/ic_uncategorized.svg';

class Leftbar extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      systemFolders: [
        { 
          id: 1, 
          name: "All", 
          count: 0, 
          icon: <FolderIcon className="folder-icon" />, 
          editable: false 
        },
        { 
          id: 2, 
          name: "Uncategorized", 
          count: 0, 
          icon: <UncategorizedIcon className="folder-icon" />, 
          editable: false 
        },
        { 
          id: 3, 
          name: "Trash", 
          count: 0, 
          icon: <TrashIcon className="folder-icon" />, 
          editable: false 
        },
      ],
      customFolders: [],
      editingFolderId: null,
      contextMenu: { visible: false, x: 0, y: 0, folderId: null },
      sortBy: 'id'
    };

    this.loadFolders = this.loadFolders.bind(this);
    this.folderNameInputRef = React.createRef();
  }

  componentDidMount() {
    this.loadFolders();
    this.interval = setInterval(() => {
      if (window.electronAPI?.getFolders) this.loadFolders();
    }, 1000);
    
    document.addEventListener('click', this.handleClickOutside);
  }

  componentWillUnmount() {
    clearInterval(this.interval);
    document.removeEventListener('click', this.handleClickOutside);
  }

  handleClickOutside = () => {
    if (this.state.contextMenu.visible) {
      this.setState({ contextMenu: { visible: false, x: 0, y: 0, folderId: null } });
    }
  };

  componentDidUpdate(prevProps) {
    // Фокусируемся на input при открытии модального окна
    if (this.props.showAddFolderModal && !prevProps.showAddFolderModal) {
      setTimeout(() => {
        if (this.folderNameInputRef.current) {
          this.folderNameInputRef.current.focus();
        }
      }, 100);
    }
  }

  loadFolders = async () => {
    if (!window.electronAPI?.getFolders) return;
    try {
      const allFolders = await window.electronAPI.getFolders(this.state.sortBy);
      
      const systemFoldersMap = {
        1: { 
          id: 1, 
          name: "All", 
          count: 0, 
          icon: <FolderIcon className="folder-icon" />, 
          editable: false 
        },
        2: { 
          id: 2, 
          name: "Uncategorized", 
          count: 0, 
          icon: <UncategorizedIcon className="folder-icon" />, 
          editable: false 
        },
        3: { 
          id: 3, 
          name: "Trash", 
          count: 0, 
          icon: <TrashIcon className="folder-icon" />, 
          editable: false 
        },
      };
      
      const systemFolders = allFolders
        .filter(folder => folder.id <= 3)
        .map(folder => ({
          ...folder,
          icon: systemFoldersMap[folder.id].icon,
          editable: systemFoldersMap[folder.id].editable,
          name: systemFoldersMap[folder.id].name
        }));
      
      const customFolders = allFolders.filter(folder => folder.id > 3);
      
      this.setState({ 
        systemFolders,
        customFolders 
      });
    } catch (err) {
      console.log("Папки ещё не готовы");
    }
  };

  handleCreateFolder = async () => {
    const name = this.props.newFolderName.trim();
    if (!name) {
      alert("Введите название папки");
      return;
    }

    try {
      const result = await window.electronAPI.addFolder(name);
      if (result.success) {
        console.log('Папка создана:', result.path);
        this.loadFolders();
        this.props.onCloseModal();
      } else {
        alert("Ошибка: " + (result.error || "Не удалось создать папку"));
      }
    } catch (err) {
      alert("Не удалось создать папку: " + err.message);
    }
  };

  handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      this.handleCreateFolder();
    } else if (e.key === 'Escape') {
      this.props.onCloseModal();
    }
  };

  handleSortToggle = () => {
    const nextSort = this.state.sortBy === 'name' ? 'date' : 'name';
    this.setState({ sortBy: nextSort }, () => {
      this.loadFolders();
    });
  };

  handleRenameFolder = () => {
    const folderId = this.state.contextMenu.folderId;
    this.setState({
      editingFolderId: folderId,
      contextMenu: { visible: false, x: 0, y: 0, folderId: null }
    });
  };

  renderFolder = (folder) => (
    <Folder
      key={folder.id}
      initialName={folder.name}
      itemCount={folder.count || 0}
      icon={folder.icon}
      editable={folder.editable !== false}
      isEditing={folder.id === this.state.editingFolderId}
      onRename={async (newName) => {
        if (folder.id > 3) {
          try {
            const result = await window.electronAPI.renameFolder(folder.id, newName);
            if (result.success) {
              this.loadFolders();
            } else {
              alert("Ошибка: " + (result.error || "Не удалось переименовать папку"));
            }
          } catch (err) {
            alert("Не удалось переименовать папку: " + err.message);
          }
        }
        this.setState({ editingFolderId: null });
      }}
      onStopEditing={() => {
        this.setState({ editingFolderId: null });
      }}
      onContextMenu={(e) => {
        if (folder.id > 3) {
          e.preventDefault();
          this.setState({
            contextMenu: { visible: true, x: e.clientX, y: e.clientY, folderId: folder.id }
          });
        }
      }}
      onClick={() => this.props.onFolderSelect?.(folder.id)}
      onDrop={(e) => {
        e.preventDefault();
        // drag & drop логика
      }}
      onDragOver={(e) => e.preventDefault()}
    />
  );

  render() {
    const { systemFolders, customFolders, sortBy } = this.state;
    const { 
      onAddFolder, 
      showAddFolderModal, 
      onCloseModal, 
      newFolderName, 
      onFolderNameChange 
    } = this.props;

    return (
      <div className='Leftbar'>
        {/* Системные папки */}
        <div className="leftbar__folders leftbar__system-folders">
          {systemFolders.map(folder => this.renderFolder(folder))}
        </div>
        
        <AddFolderButton
          className="leftbar__add-button"
          onClick={onAddFolder}
          label="New folder"
        />
        
        {/* Пользовательские папки */}
        {customFolders.length > 0 && (
          <div className="leftbar__folders leftbar__custom-folders">
            {customFolders.map(folder => this.renderFolder(folder))}
          </div>
        )}

        {this.state.contextMenu.visible && (
          <div className="context-menu" style={{ position: 'fixed', left: this.state.contextMenu.x, top: this.state.contextMenu.y, zIndex: 1000 }}>
            <button
              className="context-menu__item"
              onClick={this.handleRenameFolder}
            >
              <span className="context-menu__item-icon">✏️</span>
              Переименовать
            </button>
            <button
              className="context-menu__item"
              onClick={async () => {
                const folderId = this.state.contextMenu.folderId;
                if (window.confirm('Вы уверены, что хотите удалить эту папку? Все изображения в ней будут удалены.')) {
                  try {
                    const result = await window.electronAPI.deleteFolder(folderId);
                    if (result.success) {
                      console.log('Папка удалена');
                      this.loadFolders();
                    } else {
                      alert("Ошибка: " + (result.error || "Не удалось удалить папку"));
                    }
                  } catch (err) {
                    alert("Не удалось удалить папку: " + err.message);
                  }
                }
                this.setState({ contextMenu: { visible: false } });
              }}
            >
              <span className="context-menu__item-icon">🗑️</span>
              Удалить папку
            </button>
          </div>
        )}

        {showAddFolderModal && (
          <div className="modal-overlay" onClick={onCloseModal}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <h3>Создать новую папку</h3>
              <input
                ref={this.folderNameInputRef}
                type="text"
                value={newFolderName}
                onChange={(e) => onFolderNameChange(e.target.value)}
                onKeyDown={this.handleKeyPress}
                placeholder="Название папки"
                className="folder-name-input"
              />
              <div className="modal-buttons">
                <button onClick={this.handleCreateFolder} className="btn-create">Создать</button>
                <button onClick={onCloseModal} className="btn-cancel">Отмена</button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }
}

export default Leftbar;