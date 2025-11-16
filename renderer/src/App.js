// src/App.js
import React, { useState } from 'react';
import './App.css';
import Leftbar from "./components/Leftbar/Leftbar";
import Rightbar from "./components/Rightbar/Rightbar";
import FileUpload from './components/FileUpload/FileUpload';
import TitleBar from './components/TitleBar/TitleBar';

function App() {
  const [selectedFolderId, setSelectedFolderId] = useState(1);
  const [showAddFolderModal, setShowAddFolderModal] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');

  const handleAddFolder = () => {
    setShowAddFolderModal(true);
    setNewFolderName('');
  };

  const handleCloseModal = () => {
    setShowAddFolderModal(false);
    setNewFolderName('');
  };

  return (
    <div className="App">
      <TitleBar />
      <div className="app-items">
        <Leftbar 
          onFolderSelect={setSelectedFolderId}
          onAddFolder={handleAddFolder}
          showAddFolderModal={showAddFolderModal}
          onCloseModal={handleCloseModal}
          newFolderName={newFolderName}
          onFolderNameChange={setNewFolderName}
        />
        <div className="app-content">
          <FileUpload 
            folderId={selectedFolderId} 
            onAddFolder={handleAddFolder}
          />
        </div>
        <Rightbar />
      </div>
    </div>
  );
}

export default App;