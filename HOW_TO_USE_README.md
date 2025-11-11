С самого начала: 

npm install chokidar     (Chokidar - это утилита для отслеживания изменений файловой системы)
npm run rebuild     (Выполняет пересборку нативных модулей в Node.js проекте)   

Если системные папки продублировались выполните очистку бд и перезапуск


    1:
    В командной строке Windows:
    taskkill /F /IM electron.exe

    Или в PowerShell:
    Stop-Process -Name "electron" -Force


    2:
    Удалить файл базы данных:
    del "C:\Users\User\AppData\Roaming\visualhub\images.db"

    Или в проводнике:
    C:\Users\User\AppData\Roaming\visualhub\images.db - удалить

    (Эта процедура безопасна - все пользовательские данные (изображения) хранятся отдельно в папке images и не будут удалены.)


    3: Очистка физических папок (опционально)

    Удалить все папки в folders, кроме системных:
    rd /S /Q "C:\Users\User\AppData\Roaming\visualhub\folders"

    Пересоздать папку folders:
    mkdir "C:\Users\User\AppData\Roaming\visualhub\folders"


    Шаг 4: Перезапуск приложения

    Из папки проекта:
    npm start

    Или:
    npm run start



