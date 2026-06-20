const path = require('path');
const {pathToFileURL} = require('url');
const {app, BrowserWindow, shell, nativeImage, protocol, net} = require('electron');

const isDev = !app.isPackaged;
let controllerWindow;

// In a packaged build the renderer is a static Next export under `out/`, whose
// HTML references assets with absolute paths (e.g. `/_next/...`). Those 404 over
// `file://` (root resolves to the disk root), so serve `out/` through a custom
// `app://` scheme where absolute paths resolve against the export root.
if (!isDev) {
  protocol.registerSchemesAsPrivileged([
    {scheme: 'app', privileges: {standard: true, secure: true, supportFetchAPI: true, stream: true}},
  ]);
}

function registerAppProtocol() {
  const root = path.join(__dirname, 'out');
  protocol.handle('app', (request) => {
    let pathname = decodeURIComponent(new URL(request.url).pathname);
    if (pathname.endsWith('/')) {
      pathname += 'index.html';
    } else if (!path.extname(pathname)) {
      pathname += '/index.html';
    }
    const filePath = path.join(root, pathname);
    // Guard against path traversal outside the export root.
    if (!filePath.startsWith(root + path.sep) && filePath !== root) {
      return new Response('Not found', {status: 404});
    }
    return net.fetch(pathToFileURL(filePath).toString());
  });
}

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

  controllerWindow.loadURL('app://local/controller/');
}

app.whenReady().then(() => {
  if (!isDev) {
    registerAppProtocol();
  }

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
