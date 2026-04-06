const fs = require('fs');
const path = require('path');
const { app } = require('electron');

const userPluginsDir = path.join(app.getPath('userData'), 'plugins');

function ensurePluginsDir() {
  if (!fs.existsSync(userPluginsDir)) {
    fs.mkdirSync(userPluginsDir, { recursive: true });
  }
}

function loadPlugins(mainWindow) {
  ensurePluginsDir();

  console.log(`[iGaia Plugins] Loading from: ${userPluginsDir}`);

  const pluginFolders = fs.readdirSync(userPluginsDir, { withFileTypes: true })
    .filter(dirent => dirent.isDirectory());

  console.log(`[iGaia Plugins] Found ${pluginFolders.length} plugin(s)`);

  pluginFolders.forEach(folder => {
    const pluginPath = path.join(userPluginsDir, folder.name);
    const manifestPath = path.join(pluginPath, 'manifest.json');
    const indexPath = path.join(pluginPath, 'index.js');

    if (!fs.existsSync(manifestPath) || !fs.existsSync(indexPath)) {
      console.warn(`[iGaia Plugins] Skipping ${folder.name}`);
      return;
    }

    try {
      const manifest = require(manifestPath);
      const pluginModule = require(indexPath);

      console.log(`[iGaia Plugins] Loading "${manifest.name}" v${manifest.version || '1.0.0'}`);

      const api = {
        name: manifest.name,
        version: manifest.version || '1.0.0',

        // Toolbar
        addToolbarButton: (options) => {
          mainWindow.webContents.send('add-toolbar-button', options);
        },

        // Inject JavaScript into Gaia page
        injectScript: (code) => {
          mainWindow.webContents.executeJavaScript(code).catch(err => {
            console.error(`[${manifest.name}] Inject failed:`, err);
          });
        },

        // Navigation
        navigateTo: (url) => mainWindow.webContents.send('navigate-to', url),
        reload: () => mainWindow.webContents.send('reload-gaia'),

        // Panel / UI
        showPanel: (html, options = {}) => {
          mainWindow.webContents.send('show-panel', { html, ...options });
        },

        // Data persistence
        saveData: (key, value) => {
          mainWindow.webContents.send('plugin-save-data', { plugin: manifest.name, key, value });
        },
        loadData: (key, defaultValue = null) => {
          // This is async - for simplicity we just log for now
          console.log(`[${manifest.name}] loadData(${key}) requested`);
        },

        // Utilities
        log: (msg) => console.log(`[${manifest.name}] ${msg}`),
        alert: (msg) => mainWindow.webContents.send('plugin-alert', msg),
        confirm: (msg) => mainWindow.webContents.send('plugin-confirm', msg)
      };

      if (typeof pluginModule.init === 'function') {
        pluginModule.init(api, manifest);
      }
    } catch (err) {
      console.error(`[iGaia Plugins] Failed to load "${folder.name}":`, err.message);
    }
  });
}

module.exports = { loadPlugins };