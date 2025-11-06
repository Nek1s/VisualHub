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
      contextMenu: { visible: false, x: 0, y: 0, folderId: null }
    };

    this.handleAddFolder = this.handleAddFolder.bind(this);
    this.loadFolders = this.loadFolders.bind(this);
  }

  componentDidMount() {
    this.loadFolders();
    this.interval = setInterval(() => {
      if (window.electronAPI?.getFolders) this.loadFolders();
    }, 1000);
  }

  componentWillUnmount() {
    clearInterval(this.interval);
  }

  loadFolders = async () => {
    if (!window.electronAPI?.getFolders) return;
    try {
      const folders = await window.electronAPI.getFolders();
      this.setState({ folders });
    } catch (err) {
      console.log("Папки ещё не готовы");
    }
  };

  handleAddFolder = async () => {
    const name = "Новая папка " + Date.now(); // вместо prompt, чтобы проверить
    if (!name?.trim()) return;

    try {
      await window.electronAPI.addFolder(name.trim());
      this.loadFolders();
    } catch (err) {
      alert("Не удалось создать папку");
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
            <button onClick={() => {
              window.electronAPI.deleteFolder(this.state.contextMenu.folderId);
              this.loadFolders();
              this.setState({ contextMenu: { visible: false } });
            }}>
              Удалить папку
            </button>
          </div>
        )}
      </div>
    );
  }
}

export default Leftbar;