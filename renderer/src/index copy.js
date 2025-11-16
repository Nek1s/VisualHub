import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';

function initApp() {
  const rootElement = document.getElementById('root');
  
  if (!rootElement) {
    console.error('❌ Элемент с id="root" не найден!');
    console.log('Доступные элементы:', document.body.innerHTML);
    return;
  }

  try {
    const root = ReactDOM.createRoot(rootElement);
    root.render(
      <React.StrictMode>
        <App />
      </React.StrictMode>
    );
    console.log('✅ React приложение успешно запущено');
  } catch (error) {
    console.error('❌ Ошибка при запуске React:', error);
  }
}

// Запускаем после полной загрузки DOM
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initApp);
} else {
  initApp();
}

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
