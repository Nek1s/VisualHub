import React from 'react';
import './Folder.css';
import { ReactComponent as FolderIcon } from '../../icons/system_folders/ic_folder.svg';

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

  renderIcon = () => {
    const { icon, editable = true } = this.props;
    
    // Если передана кастомная иконка (JSX элемент), используем её
    if (React.isValidElement(icon)) {
      return React.cloneElement(icon, {
        className: `folder__svg ${icon.props.className || ''}`
      });
    }
    
    // Иначе используем дефолтную иконку FolderIcon
    return <FolderIcon className="folder__svg" />;
  }

  render() {
    const { folderName } = this.state;
    const { 
      itemCount = 0, 
      isEditing = false,
      editable = true  // По умолчанию папка редактируемая
    } = this.props;
    
    return (
      <div 
        className={`folder ${isEditing ? 'folder--editing' : ''} ${!editable ? 'folder--non-editable' : ''}`}
        onContextMenu={this.handleContextMenu}
        onClick={this.props.onClick}
        onDrop={this.props.onDrop}
        onDragOver={this.props.onDragOver}
      >
        {isEditing ? (
          <div className="folder__edit-container">
            <span className="folder__icon">
              {this.renderIcon()}
            </span>
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
            <span className="folder__icon">
              {this.renderIcon()}
            </span>
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