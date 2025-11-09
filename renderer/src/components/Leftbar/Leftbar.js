import React from 'react';
import './Leftbar.css';
import Folder from '../Folder/Folder';
import AddFolderButton from '../AddFolderButton/AddFolderButton';

class Leftbar extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      folders: [
        { id: 1, name: "All", count: 0, icon: "📁", editable: false },
        { id: 2, name: "Uncategorized", count: 0, icon: "🧷", editable: false },
        { id: 3, name: "Trash", count: 0, icon: "🗑️", editable: false },
      ],
      editingFolderId: null,
      contextMenu: { visible: false, x: 0, y: 0, folderId: null },
      showAddFolderModal: false,
      newFolderName: ''
    };

    this.handleAddFolder = this.handleAddFolder.bind(this);
    this.loadFolders = this.loadFolders.bind(this);
    this.folderNameInputRef = React.createRef();
  }

  componentDidMount() {
    this.loadFolders();
    this.interval = setInterval(() => {
      if (window.electronAPI?.getFolders) this.loadFolders();
    }, 1000);
    
    // Закрываем контекстное меню при клике вне его
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

  loadFolders = async () => {
    if (!window.electronAPI?.getFolders) return;
    try {
      const folders = await window.electronAPI.getFolders();
      this.setState({ folders });
    } catch (err) {
      console.log("Папки ещё не готовы");
    }
  };

  handleAddFolder = () => {
    this.setState({ showAddFolderModal: true, newFolderName: '' }, () => {
      // Фокусируемся на input после открытия модального окна
      setTimeout(() => {
        if (this.folderNameInputRef.current) {
          this.folderNameInputRef.current.focus();
        }
      }, 100);
    });
  };

  handleCreateFolder = async () => {
    const name = this.state.newFolderName.trim();
    if (!name) {
      alert("Введите название папки");
      return;
    }

    try {
      const result = await window.electronAPI.addFolder(name);
      if (result.success) {
        console.log('Папка создана:', result.path);
        this.loadFolders();
        this.setState({ showAddFolderModal: false, newFolderName: '' });
      } else {
        alert("Ошибка: " + (result.error || "Не удалось создать папку"));
      }
    } catch (err) {
      alert("Не удалось создать папку: " + err.message);
    }
  };

  handleCancelAddFolder = () => {
    this.setState({ showAddFolderModal: false, newFolderName: '' });
  };

  handleFolderNameChange = (e) => {
    this.setState({ newFolderName: e.target.value });
  };

  handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      this.handleCreateFolder();
    } else if (e.key === 'Escape') {
      this.handleCancelAddFolder();
    }
  };

  render() {
    const { folders } = this.state;

    return (
      <div className='Leftbar'>
        <AddFolderButton
          className="leftbar__add-button"
          onClick={this.handleAddFolder}
          label="New folder"
          icon="+"
        />

        <div className="leftbar__folders">
          {folders.map(folder => (
            <Folder
              key={folder.id}
              initialName={folder.name}
              itemCount={folder.count || 0}
              editable={folder.editable !== false}
              isEditing={folder.id === this.state.editingFolderId}
              onRename={(newName) => {
                if (folder.id > 3) window.electronAPI.renameFolder(folder.id, newName);
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
                // drag & drop логика — потом добавишь
              }}
              onDragOver={(e) => e.preventDefault()}
            />
          ))}
        </div>

        {this.state.contextMenu.visible && (
          <div className="context-menu" style={{ position: 'fixed', left: this.state.contextMenu.x, top: this.state.contextMenu.y, zIndex: 1000 }}>
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

        {this.state.showAddFolderModal && (
          <div className="modal-overlay" onClick={this.handleCancelAddFolder}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <h3>Создать новую папку</h3>
              <input
                ref={this.folderNameInputRef}
                type="text"
                value={this.state.newFolderName}
                onChange={this.handleFolderNameChange}
                onKeyDown={this.handleKeyPress}
                placeholder="Название папки"
                className="folder-name-input"
              />
              <div className="modal-buttons">
                <button onClick={this.handleCreateFolder} className="btn-create">Создать</button>
                <button onClick={this.handleCancelAddFolder} className="btn-cancel">Отмена</button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }
}

export default Leftbar;
