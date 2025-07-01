const { app, BrowserWindow } = require('electron');
const path = require('path');
const isDev = process.env.NODE_ENV === 'development';

function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
    show: false,
    backgroundColor: '#ffffff',
  });

  // Pencere hazır olduğunda göster
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    mainWindow.focus();
  });

  // Geliştirme modunda doğrudan Vite sunucusuna bağlan
  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools();
  } else {
    // Üretim modunda build edilmiş dosyaları yükle
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }
}

// Electron hazır olduğunda pencereyi oluştur
app.whenReady().then(() => {
  createWindow();

  // macOS için pencere yönetimi
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

// Tüm pencereler kapatıldığında uygulamayı sonlandır
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// Hata yakalama
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
});

process.on('unhandledRejection', (error) => {
  console.error('Unhandled Rejection:', error);
}); 