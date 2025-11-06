// src/App.js
import React, { useState } from 'react';
import './App.css';
import Leftbar from "./components/Leftbar/Leftbar";
import Rightbar from "./components/Rightbar/Rightbar";
import FileUpload from './components/FileUpload/FileUpload';

function App() {
  const [selectedFolderId, setSelectedFolderId] = useState(1);

  return (
    <div className="App">
      <Leftbar onFolderSelect={setSelectedFolderId} />
      <div className="app-content">
        <FileUpload folderId={selectedFolderId} />
      </div>
      <Rightbar />
    </div>
  );
}

export default App;