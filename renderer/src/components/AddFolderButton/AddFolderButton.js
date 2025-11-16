import React from 'react';
import './AddFolderButton.css';
import { ReactComponent as PlusIcon } from '../../icons/ic_plus.svg'; // Добавлено расширение .svg

class AddFolderButton extends React.Component {
  constructor(props) {
    super(props)
    this.handleClick = this.handleClick.bind(this)
  }

  handleClick() {
    if (this.props.onClick) {
      this.props.onClick();
    }
  }

  render() {
    const { label = "Новая папка", disabled = false } = this.props;
    
    return (
      <button 
        className="AddFolderButton"
        onClick={this.handleClick}
        disabled={disabled}
        type="button"
      >
        <span className="AddFolderButton__icon">
          <PlusIcon className="AddFolderButton__svg" />
        </span>
        <span className="AddFolderButton__label">{label}</span>
      </button>
    )
  }
}

export default AddFolderButton;