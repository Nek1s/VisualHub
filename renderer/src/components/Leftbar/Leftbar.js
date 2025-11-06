import React from 'react';
import './Leftbar.css';
import Folder from '../Folder/Folder';
import AddFolderButton from '../AddFolderButton/AddFolderButton';

class Leftbar extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      folders: [],
      editingFolderId: null,
      contextMenu: {
        visible: false,
        x: 0,
        y: 0,
        folderId: null
      }
    }
    
    this.handleAddFolder = this.handleAddFolder.bind(this);
    this.handleRenameFolder = this.handleRenameFolder.bind(this);
    this.handleStartEditing = this.handleStartEditing.bind(this);
    this.handleStopEditing = this.handleStopEditing.bind(this);
    this.handleContextMenu = this.handleContextMenu.bind(this);
    this.handleDeleteFolder = this.handleDeleteFolder.bind(this);
    this.handleClickOutside = this.handleClickOutside.bind(this);
    this.loadFolders = this.loadFolders.bind(this);
    this.handleDropOnFolder = this.handleDropOnFolder.bind(this);
    this.onFolderClick = this.onFolderClick.bind(this);
  }

  componentDidMount() {
    this.loadFolders();
    document.addEventListener('click', this.handleClickOutside);
    
    // Пытаемся загрузить каждые 500 мс, пока не появится API
    this.interval = setInterval(() => {
      if (window.electronAPI?.getFolders && this.state.folders.length === 0) {
        this.loadFolders();
      }
    }, 500);
  }

  componentWillUnmount() {
    document.removeEventListener('click', this.handleClickOutside);
    clearInterval(this.interval);
  }

  loadFolders = async () => {
  if (!window.electronAPI?.getFolders) {
    console.log("Electron API ещё не готов, ждём...");
    return;
  }
  try {
    const folders = await window.electronAPI.getFolders();
    this.setState({ folders });
  } catch (err) {
    console.error("Не удалось загрузить папки:", err);
  }
};

  handleAddFolder = async () => {
    const name = window.prompt("Название папки:", "Моя папка");
    if (!name?.trim()) return;

    try {
      const folder = await window.electronAPI.addFolder(name.trim());
      console.log('Папка создана:', folder);
      await this.loadFolders();
    } catch (err) {
      alert("Ошибка создания папки");
      console.error(err);
    }
  };

  handleRenameFolder = async (folderId, newName) => {
    const folder = this.state.folders.find(f => f.id === folderId);
    if (folder && folder.id <= 3) return; // Системные не редактируем

    await window.electronAPI.renameFolder(folderId, newName);
    this.loadFolders();
  };

  handleDeleteFolder = async () => {
    const { folderId } = this.state.contextMenu;
    const folder = this.state.folders.find(f => f.id === folderId);
    if (folder && folder.id <= 3) return;

    await window.electronAPI.deleteFolder(folderId);
    this.loadFolders();
    this.setState({
      contextMenu: { visible: false, x: 0, y: 0, folderId: null }
    });
  };

  handleDropOnFolder = async (e, folderId) => {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files);
   
    for (const file of files) {
      if (!file.type.startsWith('image/')) continue;
     
      const buffer = await file.arrayBuffer();
      const array = new Uint8Array(buffer);
      const result = await window.electronAPI.uploadImage(array, file.name, folderId);
     
      if (result.success) {
        console.log(`Загружено в папку ${folderId}: ${file.name}`);
      }
    }
   
    this.loadFolders();
  };

  onFolderClick = (folderId) => {
    this.setState({ selectedFolderId: folderId });
  };

  handleClickOutside = (e) => {
    if (this.state.contextMenu.visible) {
      this.setState({
        contextMenu: {
          visible: false,
          x: 0,
          y: 0,
          folderId: null
        }
      });
    }
  }

  handleContextMenu = (e, folderId) => {
    e.preventDefault();
    
    // Проверяем, можно ли редактировать папку
    const folder = this.state.folders.find(f => f.id === folderId);
    if (folder && folder.id <= 3) return;
    
    this.setState({
      contextMenu: {
        visible: true,
        x: e.clientX,
        y: e.clientY,
        folderId: folderId
      }
    });
  }

  handleStartEditing = (folderId) => {
    const folder = this.state.folders.find(f => f.id === folderId);
    if (folder && folder.id <= 3) return;
    
    this.setState({ editingFolderId: folderId });
  }

  handleStopEditing = () => {
    this.setState({ editingFolderId: null });
  }

  getFolderGroups = () => {
    const systemFolders = this.state.folders.filter(folder => folder.id <= 3);
    const userFolders = this.state.folders.filter(folder => folder.id > 3);
    
    return { systemFolders, userFolders };
  }

  render() {
    const { contextMenu } = this.state;
    const { systemFolders, userFolders } = this.getFolderGroups();

    return (
      <div className='Leftbar'>
        <AddFolderButton
          className="leftbar__add-button"
          onClick={this.handleAddFolder}
          label="New folder"
        />

        <div className="leftbar__folders">
          {systemFolders.map(folder => (
            <Folder
              key={folder.id}
              initialName={folder.name}
              itemCount={folder.count}
              icon={folder.icon}
              isEditing={folder.id === this.state.editingFolderId}
              onRename={(newName) => this.handleRenameFolder(folder.id, newName)}
              onStartEditing={() => this.handleStartEditing(folder.id)}
              onStopEditing={this.handleStopEditing}
              onContextMenu={(e) => this.handleContextMenu(e, folder.id)}
              onDrop={(e) => this.handleDropOnFolder(e, folder.id)}
              onDragOver={(e) => e.preventDefault()}
              onClick={() => {
                this.onFolderClick(folder.id);
                if (this.props.onFolderSelect) {
                  this.props.onFolderSelect(folder.id);
                }
              }}
            />
          ))}

          {userFolders.length > 0 && (
            <div className="leftbar__divider"></div>
          )}

          {userFolders.map(folder => (
            <Folder
              key={folder.id}
              initialName={folder.name}
              itemCount={folder.count}
              icon={folder.icon}
              isEditing={folder.id === this.state.editingFolderId}
              onRename={(newName) => this.handleRenameFolder(folder.id, newName)}
              onStartEditing={() => this.handleStartEditing(folder.id)}
              onStopEditing={this.handleStopEditing}
              onContextMenu={(e) => this.handleContextMenu(e, folder.id)}
              onDrop={(e) => this.handleDropOnFolder(e, folder.id)}
              onDragOver={(e) => e.preventDefault()}
              onClick={() => {
                this.onFolderClick(folder.id);
                if (this.props.onFolderSelect) {
                  this.props.onFolderSelect(folder.id);
                }
              }}
            />
          ))}
        </div>

        {contextMenu.visible && (
          <div 
            className="context-menu"
            style={{
              position: 'fixed',
              left: contextMenu.x,
              top: contextMenu.y,
              zIndex: 1000
            }}
          >
            <button 
              className="context-menu__item context-menu__item--delete"
              onClick={this.handleDeleteFolder}
            >
              <span className="context-menu__item-icon">🗑️</span>
              Удалить папку
            </button>
          </div>
        )}
      </div>
    )
  }
}

export default Leftbar;