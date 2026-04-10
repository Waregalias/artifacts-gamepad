const path = require('path');
const {app, BrowserWindow, shell} = require('electron');

const isDev = !app.isPackaged;
let controllerWindow;

function createControllerWindow() {
  controllerWindow = new BrowserWindow({
    width: 1480,
    height: 980,
    minWidth: 1120,
    minHeight: 760,
    title: 'Artifacts Gamepad Controller',
    backgroundColor: '#052b38',
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
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
