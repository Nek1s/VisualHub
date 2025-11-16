import React from 'react';
import './InputField.css';

const InputField = ({ 
  value = '',
  placeholder = '',
  onChange,
  onFocus,
  onBlur,
  onKeyPress,
  disabled = false,
  className = '',
  type = 'text',
  ...props 
}) => {
  const handleChange = (e) => {
    if (onChange) {
      onChange(e.target.value);
    }
  };

  return (
    <input
      type={type}
      className={`input-field ${disabled ? 'input-field--disabled' : ''} ${className}`}
      value={value}
      placeholder={placeholder}
      onChange={handleChange}
      onFocus={onFocus}
      onBlur={onBlur}
      onKeyPress={onKeyPress}
      disabled={disabled}
      {...props}
    />
  );
};

export default InputField;