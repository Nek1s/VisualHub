const { contextBridge } = require('electron');

// Через этот API фронтенд (Денис) будет взаимодействовать с бэкендом
contextBridge.exposeInMainWorld('electronAPI', {
  // Здесь позже появятся методы для работы с файлами, тегами и т.д.
  // Пример: 
  // openFile: () => ipcRenderer.invoke('dialog:openFile')
});