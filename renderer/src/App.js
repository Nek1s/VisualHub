import logo from './logo.svg';
import './App.css';
import Header from "./components/Header/Header";
import Button from "./components/Button/Button";
import Leftbar from "./components/Leftbar/Leftbar";
import Rightbar from "./components/Rightbar/Rightbar";



function App() {
  const handleClick = () => {
    console.log('Кнопка нажата!');
  };
  return (
    <div className="App">
      <Leftbar />
      <Button onClick={handleClick}>Загрузить изображение</Button>
      <Rightbar />
    </div>
  );
}

export default App;
