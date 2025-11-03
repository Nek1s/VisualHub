import React from 'react';
import './Folder.css';

class Folder extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      folderName: props.initialName || "Folder-name"
    }
  }

  handleContextMenu = (e) => {
    e.preventDefault();
    // Если папка не редактируемая, блокируем контекстное меню
    if (this.props.editable === false) return;
    
    if (this.props.onContextMenu) {
      this.props.onContextMenu(e);
    }
  }

  componentDidUpdate(prevProps) {
    if (this.props.isEditing && !prevProps.isEditing) {
      this.setState({ folderName: this.props.initialName });
    }
  }

  handleTitleClick = () => {
    // Если папка не редактируемая, блокируем клик
    if (this.props.editable === false) return;
    
    if (this.props.onStartEditing) {
      this.props.onStartEditing();
    }
  }

  handleInputBlur = () => {
    if (this.props.onStopEditing) {
      this.props.onStopEditing();
    }
    if (this.props.onRename) {
      this.props.onRename(this.state.folderName);
    }
  }

  handleInputKeyPress = (e) => {
    if (e.key === 'Enter') {
      if (this.props.onStopEditing) {
        this.props.onStopEditing();
      }
      if (this.props.onRename) {
        this.props.onRename(this.state.folderName);
      }
    }
  }

  handleInputChange = (event) => {
    this.setState({ folderName: event.target.value });
  }

  render() {
    const { folderName } = this.state;
    const { 
      itemCount = 0, 
      icon = "📁", 
      isEditing = false,
      editable = true  // По умолчанию папка редактируемая
    } = this.props;
    
    return (
      <div 
        className={`folder ${isEditing ? 'folder--editing' : ''} ${!editable ? 'folder--non-editable' : ''}`}
        onContextMenu={this.handleContextMenu}
      >
        {isEditing ? (
          <div className="folder__edit-container">
            <span className="folder__icon">{icon}</span>
            <input
              className="folder__input"
              value={folderName}
              onChange={this.handleInputChange}
              onBlur={this.handleInputBlur}
              onKeyPress={this.handleInputKeyPress}
              onContextMenu={this.handleContextMenu}
              autoFocus
            />
            <span className="folder__count">{itemCount}</span>
          </div>
        ) : (
          <div 
            className="folder__content" 
            onClick={this.handleTitleClick}
            onContextMenu={this.handleContextMenu}
          >
            <span className="folder__icon">{icon}</span>
            <h1 className="folder__title">
              {folderName}
            </h1>
            <span className="folder__count">{itemCount}</span>
          </div>
        )}
      </div>
    )
  }
}

export default Folder;