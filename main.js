const path = require('path');
const {app, BrowserWindow, shell, nativeImage} = require('electron');

const isDev = !app.isPackaged;
let controllerWindow;

function getIconPath() {
  const base = path.join(__dirname, 'electron', 'assets');
  if (process.platform === 'win32') return path.join(base, 'windows', 'icon.ico');
  if (process.platform === 'linux') return path.join(base, 'linux', 'icons', '512x512.png');
  return path.join(base, 'icon.png');
}

function createControllerWindow() {
  controllerWindow = new BrowserWindow({
    width: 1480,
    height: 980,
    minWidth: 1120,
    minHeight: 760,
    title: 'Artifacts Gamepad Controller',
    icon: getIconPath(),
    backgroundColor: '#052b38',
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
      webviewTag: true,
      preload: path.join(__dirname, 'electron', 'preload.js'),
    },
  });

  controllerWindow.webContents.setWindowOpenHandler(({url}) => {
    shell.openExternal(url);
    return {action: 'deny'};
  });

  if (isDev) {
    controllerWindow.loadURL('http://localhost:3000/controller');
    return;
  }

  controllerWindow.loadFile(path.join(__dirname, 'out', 'controller', 'index.html'));
}

app.whenReady().then(() => {
  if (process.platform === 'darwin') {
    const iconPath = path.join(__dirname, 'electron', 'assets', 'icon.png');
    const icon = nativeImage.createFromPath(iconPath);
    if (icon.isEmpty()) {
      console.error('[icon] nativeImage vide — chemin introuvable:', iconPath);
    } else {
      app.dock.setIcon(icon);
    }
  }
  createControllerWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createControllerWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
