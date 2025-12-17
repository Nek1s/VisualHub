// src/App.js
import React, { useState } from 'react';
import './App.css';
import Leftbar from "./components/Leftbar/Leftbar";
import Rightbar from "./components/Rightbar/Rightbar";
import FileUpload from './components/FileUpload/FileUpload';
import Gallery from './components/Gallery/Gallery';
import TitleBar from './components/TitleBar/TitleBar';

function App() {
  const [selectedFolderId, setSelectedFolderId] = useState(1);
  const [selectedImage, setSelectedImage] = useState(null);
  const [showAddFolderModal, setShowAddFolderModal] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [galleryKey, setGalleryKey] = useState(0);
  const [hasImages, setHasImages] = useState(false);

  const handleAddFolder = () => {
    setShowAddFolderModal(true);
    setNewFolderName('');
  };

  const handleCloseModal = () => {
    setShowAddFolderModal(false);
    setNewFolderName('');
  };

  const handleUploadComplete = (images) => {
    setHasImages(images && images.length > 0);
    setGalleryKey(prev => prev + 1);
  };

  const handleGalleryUpdate = (images) => {
    setHasImages(images && images.length > 0);
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
          {/* FileUpload теперь фиксированный поверх всего */}
          <FileUpload
            folderId={selectedFolderId}
            onAddFolder={handleAddFolder}
            onUploadComplete={handleUploadComplete}
            hasImages={hasImages}
          />
          
          {/* Gallery отображается под FileUpload */}
          <div className="app-gallery-section">
            <Gallery
              key={galleryKey}
              folderId={selectedFolderId}
              onImageSelect={setSelectedImage}
              onImagesLoaded={handleGalleryUpdate}
            />
          </div>
        </div>
        <Rightbar selectedImage={selectedImage} />
      </div>
    </div>
  );
}

export default App;