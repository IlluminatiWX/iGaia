const { app, BrowserWindow, ipcMain, shell } = require('electron');
const path = require('path');
const fs = require('fs');
const { loadPlugins } = require('./plugin-loader');

// ======================
// NATIVE FLASH SETUP
// ======================
let pluginPath;

if (app.isPackaged) {
  pluginPath = path.join(process.resourcesPath, 'plugins', 'pepflashplayer64.dll');
  if (!fs.existsSync(pluginPath)) {
    pluginPath = path.join(process.resourcesPath, 'app.asar.unpacked', 'plugins', 'pepflashplayer64.dll');
  }
} else {
  pluginPath = path.join(__dirname, 'plugins', 'pepflashplayer64.dll');
}

console.log('[iGaia] Flash plugin path:', pluginPath);
console.log('[iGaia] Flash file exists:', fs.existsSync(pluginPath));

if (fs.existsSync(pluginPath)) {
  app.commandLine.appendSwitch('ppapi-flash-path', pluginPath);
  app.commandLine.appendSwitch('ppapi-flash-version', '32.0.0.465');
  app.commandLine.appendSwitch('enable-system-flash');
  app.commandLine.appendSwitch('plugin-policy', 'allow');
  console.log('[iGaia] ✅ Native Flash plugin loaded');
} else {
  console.error('[iGaia] ❌ pepflashplayer64.dll not found!');
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

const userPluginsDir = path.join(app.getPath('userData'), 'plugins');

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

  // Safety: Block non-Gaia navigation
  win.webContents.on('will-navigate', (event, url) => {
    try {
      const origin = new URL(url).origin;
      if (!ALLOWED_ORIGINS.includes(origin)) {
        console.warn(`[iGaia] Blocked unsafe navigation: ${url}`);
        event.preventDefault();
      }
    } catch (e) {
      event.preventDefault();
    }
  });

  // Load plugins on startup
  win.webContents.on('did-finish-load', () => {
    loadPlugins(win);
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

// Open plugins folder
ipcMain.on('open-plugins-folder', () => {
  shell.openPath(userPluginsDir);
});

// Open Settings Panel (Theme Editor)
ipcMain.on('open-settings-panel', (event) => {
  const win = BrowserWindow.fromWebContents(event.sender);
  if (win) win.webContents.send('open-settings-panel');
});

// Get list of plugins for Plugin Manager
ipcMain.on('get-plugin-list', (event) => {
  const win = BrowserWindow.fromWebContents(event.sender);
  if (!fs.existsSync(userPluginsDir)) {
    win.webContents.send('plugin-list', []);
    return;
  }

  const folders = fs.readdirSync(userPluginsDir, { withFileTypes: true })
    .filter(dirent => dirent.isDirectory())
    .map(dirent => {
      const manifestPath = path.join(userPluginsDir, dirent.name, 'manifest.json');
      let name = dirent.name;
      let version = '1.0.0';
      let enabled = true;

      if (fs.existsSync(manifestPath)) {
        try {
          const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
          name = manifest.name || dirent.name;
          version = manifest.version || '1.0.0';
        } catch (e) {}
      }

      return {
        folder: dirent.name,
        name: name,
        version: version,
        enabled: enabled
      };
    });

  win.webContents.send('plugin-list', folders);
});

// Toggle plugin (placeholder - actual reload requires restart for now)
ipcMain.on('toggle-plugin', (event, folderName) => {
  console.log(`[iGaia] Toggle requested for plugin: ${folderName}`);
  // Note: Full hot-reload of plugins is complex in Electron.
  // For now we notify the user that a restart is needed.
  const win = BrowserWindow.fromWebContents(event.sender);
  if (win) {
    win.webContents.send('plugin-alert', `Plugin "${folderName}" toggled.\n\nPlease restart iGaia for changes to take effect.`);
  }
});

console.log('[iGaia] Main process initialized with built-in Theme Editor + Plugin Manager');