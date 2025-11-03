import React from 'react';
import './Leftbar.css';
import Folder from '../Folder/Folder';
import AddFolderButton from '../AddFolderButton/AddFolderButton';

class Leftbar extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      folders: [
        { id: 1, name: "All", count: 15, icon: "📁", editable: false },
        { id: 2, name: "Uncategorized", count: 128, icon: "🧷", editable: false },
        { id: 3, name: "Trash", count: 42, icon: "🗑️", editable: false },
      ],
      nextId: 4,
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
  }

  componentDidMount() {
    document.addEventListener('click', this.handleClickOutside);
  }

  componentWillUnmount() {
    document.removeEventListener('click', this.handleClickOutside);
  }

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
    if (folder && folder.editable === false) return;
    
    this.setState({
      contextMenu: {
        visible: true,
        x: e.clientX,
        y: e.clientY,
        folderId: folderId
      }
    });
  }

  handleDeleteFolder = () => {
    const { folderId } = this.state.contextMenu;
    if (folderId) {
      // Дополнительная проверка на возможность удаления
      const folder = this.state.folders.find(f => f.id === folderId);
      if (folder && folder.editable === false) return;
      
      this.setState(prevState => ({
        folders: prevState.folders.filter(folder => folder.id !== folderId),
        contextMenu: {
          visible: false,
          x: 0,
          y: 0,
          folderId: null
        }
      }));
    }
  }

  handleAddFolder = () => {
    const newFolder = {
      id: this.state.nextId,
      name: "Новая папка",
      count: 0,
      icon: "📁",
      editable: true // Новые папки всегда редактируемые
    };
    
    this.setState(prevState => ({
      folders: [...prevState.folders, newFolder],
      nextId: prevState.nextId + 1,
      editingFolderId: newFolder.id
    }));
  }

  handleRenameFolder = (folderId, newName) => {
    // Проверяем, можно ли редактировать папку
    const folder = this.state.folders.find(f => f.id === folderId);
    if (folder && folder.editable === false) return;
    
    this.setState(prevState => ({
      folders: prevState.folders.map(folder =>
        folder.id === folderId ? { ...folder, name: newName } : folder
      )
    }));
  }

  handleStartEditing = (folderId) => {
    // Проверяем, можно ли редактировать папку
    const folder = this.state.folders.find(f => f.id === folderId);
    if (folder && folder.editable === false) return;
    
    this.setState({ editingFolderId: folderId });
  }

  handleStopEditing = () => {
    this.setState({ editingFolderId: null });
  }

  // Разделяем папки на системные и пользовательские
  getFolderGroups = () => {
    const systemFolders = this.state.folders.filter(folder => folder.editable === false);
    const userFolders = this.state.folders.filter(folder => folder.editable === true);
    
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
          {/* Системные папки */}
          {systemFolders.map(folder => (
            <Folder
              key={folder.id}
              initialName={folder.name}
              itemCount={folder.count}
              icon={folder.icon}
              editable={folder.editable}
              isEditing={folder.id === this.state.editingFolderId}
              onRename={(newName) => this.handleRenameFolder(folder.id, newName)}
              onStartEditing={() => this.handleStartEditing(folder.id)}
              onStopEditing={this.handleStopEditing}
              onContextMenu={(e) => this.handleContextMenu(e, folder.id)}
            />
          ))}

          {/* Разделитель 50px между системными и пользовательскими папками */}
          {userFolders.length > 0 && (
            <div className="leftbar__divider"></div>
          )}

          {/* Пользовательские папки */}
          {userFolders.map(folder => (
            <Folder
              key={folder.id}
              initialName={folder.name}
              itemCount={folder.count}
              icon={folder.icon}
              editable={folder.editable}
              isEditing={folder.id === this.state.editingFolderId}
              onRename={(newName) => this.handleRenameFolder(folder.id, newName)}
              onStartEditing={() => this.handleStartEditing(folder.id)}
              onStopEditing={this.handleStopEditing}
              onContextMenu={(e) => this.handleContextMenu(e, folder.id)}
            />
          ))}
        </div>

        {/* Контекстное меню */}
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