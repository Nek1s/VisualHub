import './App.css';
import Leftbar from "./components/Leftbar/Leftbar";
import Rightbar from "./components/Rightbar/Rightbar";
import FileUpload from './components/FileUpload/FileUpload';


function App() {
  return (
    <div className="App">
      <Leftbar />
      <div className="app-content">
        <FileUpload />
      </div>
      <Rightbar />
    </div>
  );
}

export default App;
