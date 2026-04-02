const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');

// ======================
// NATIVE FLASH SETUP - IMPROVED FOR PACKAGED BUILD
// ======================
let pluginPath;

if (app.isPackaged) {
  // Packaged app (Portable or Installer)
  pluginPath = path.join(process.resourcesPath, 'app.asar.unpacked', 'plugins', 'pepflashplayer64.dll');
  
  // Fallback paths in case asarUnpack doesn't work perfectly
  if (!fs.existsSync(pluginPath)) {
    pluginPath = path.join(process.resourcesPath, 'plugins', 'pepflashplayer64.dll');
  }
  if (!fs.existsSync(pluginPath)) {
    pluginPath = path.join(process.execPath, '..', 'plugins', 'pepflashplayer64.dll');
  }
} else {
  // Development mode (npm start)
  pluginPath = path.join(__dirname, 'plugins', 'pepflashplayer64.dll');
}

console.log('[iGaia] Running in packaged mode:', app.isPackaged);
console.log('[iGaia] Final Flash plugin path:', pluginPath);
console.log('[iGaia] File exists:', fs.existsSync(pluginPath));

if (fs.existsSync(pluginPath)) {
  app.commandLine.appendSwitch('ppapi-flash-path', pluginPath);
  app.commandLine.appendSwitch('ppapi-flash-version', '32.0.0.465');
  app.commandLine.appendSwitch('enable-system-flash');
  app.commandLine.appendSwitch('plugin-policy', 'allow');
  console.log('[iGaia] ✅ Native Flash plugin switches applied');
} else {
  console.error('[iGaia] ❌ Flash DLL not found! Check the path above.');
}

// Compatibility flags
app.commandLine.appendSwitch('no-sandbox');
app.commandLine.appendSwitch('disable-web-security');
app.commandLine.appendSwitch('allow-running-insecure-content');
app.commandLine.appendSwitch('disable-blink-features', 'AutomationControlled');

const ALLOWED_ORIGINS = [
  'https://www.gaiaonline.com',
  'https://gaiaonline.com',
  'https://s.cdn.gaiaonline.com',
  'https://cdn.gaiaonline.com'
];

function createWindow() {
  const win = new BrowserWindow({
    width: 1280,
    height: 800,
    title: "iGaia",
    frame: false,
    backgroundColor: '#1a1a1a',

    webPreferences: {
      plugins: true,
      nodeIntegration: true,
      contextIsolation: false,
      webviewTag: true,
      preload: path.join(__dirname, 'preload.js')
    }
  });

  win.loadFile('index.html');

  win.webContents.on('will-navigate', (event, url) => {
    try {
      const origin = new URL(url).origin;
      if (!ALLOWED_ORIGINS.includes(origin)) {
        console.warn(`[iGaia] Blocked: ${url}`);
        event.preventDefault();
      }
    } catch (e) {
      event.preventDefault();
    }
  });
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

// Window controls
ipcMain.on('window-minimize', () => BrowserWindow.getFocusedWindow()?.minimize());
ipcMain.on('window-maximize', () => {
  const win = BrowserWindow.getFocusedWindow();
  win.isMaximized() ? win.unmaximize() : win.maximize();
});
ipcMain.on('window-close', () => BrowserWindow.getFocusedWindow()?.close());