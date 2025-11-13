// const { ipcRenderer } = window.require('electron');

// export const imageService = {
//   // Получить все изображения
//   async getAllImages() {
//     try {
//       return await ipcRenderer.invoke('images:getAll');
//     } catch (error) {
//       console.error('Error getting images:', error);
//       return [];
//     }
//   },

//   // Получить изображения по папке
//   async getImagesByFolder(folderId) {
//     try {
//       return await ipcRenderer.invoke('images:getByFolder', folderId);
//     } catch (error) {
//       console.error('Error getting images by folder:', error);
//       return [];
//     }
//   },

//   // Загрузить новое изображение
//   async uploadImage(filePath) {
//     try {
//       return await ipcRenderer.invoke('images:upload', filePath);
//     } catch (error) {
//       console.error('Error uploading image:', error);
//       return { success: false, error: error.message };
//     }
//   },

//   // Переместить изображение в папку
//   async moveImage(imageId, folderId) {
//     try {
//       return await ipcRenderer.invoke('images:move', imageId, folderId);
//     } catch (error) {
//       console.error('Error moving image:', error);
//       return { success: false, error: error.message };
//     }
//   }
// };