const { app, BrowserWindow, Menu } = require('electron');
const path = require('path');
const isDev = require('electron-is-dev');
const { spawn } = require('child_process');
const url = require('url');
const fs = require('fs');

let mainWindow;
let serverProcess;

process.env.REACT_APP_ELECTRON = 'true';
process.env.ELECTRON_IS_DEV = isDev ? 'true' : 'false';

const setupLogging = () => {
  if (isDev) {
    return {
      log: console.log,
      error: console.error
    };
  }
  
  const userDataPath = app.getPath('userData');
  const logsDir = path.join(userDataPath, 'logs');
  
  if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
  }
  
  const logFile = path.join(logsDir, 'main.log');
  const errorFile = path.join(logsDir, 'error.log');
  
  const writeLog = (file, message) => {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] ${message}\n`;
    fs.appendFileSync(file, logMessage);
  };
  
  return {
    log: (message) => {
      console.log(message);
      writeLog(logFile, message);
    },
    error: (message) => {
      console.error(message);
      writeLog(errorFile, message);
    },
    getLogPath: () => logsDir
  };
};

let logger;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 800,
    minHeight: 600,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      webSecurity: false,
      enableRemoteModule: false,
      preload: path.join(__dirname, '../preload.js')
    },
    icon: path.join(__dirname, 'icon.png'),
    show: false,
    titleBarStyle: 'default'
  });

  mainWindow.setAutoHideMenuBar(true);

  const template = [
    {
      label: 'File',
      submenu: [
        {
          label: 'New Board',
          accelerator: 'CmdOrCtrl+N',
          click: () => {
            mainWindow.webContents.send('new-board');
          }
        },
        { type: 'separator' },
        {
          label: 'Open Logs Folder',
          click: () => {
            if (logger && logger.getLogPath) {
              require('electron').shell.openPath(logger.getLogPath());
            }
          }
        },
        { type: 'separator' },
        {
          label: 'Quit',
          accelerator: process.platform === 'darwin' ? 'Cmd+Q' : 'Ctrl+Q',
          click: () => {
            app.quit();
          }
        }
      ]
    },
    {
      label: 'Edit',
      submenu: [
        { role: 'undo' },
        { role: 'redo' },
        { type: 'separator' },
        { role: 'cut' },
        { role: 'copy' },
        { role: 'paste' }
      ]
    },
    {
      label: 'View',
      submenu: [
        { role: 'reload' },
        { role: 'forceReload' },
        { role: 'toggleDevTools' },
        { type: 'separator' },
        { role: 'resetZoom' },
        { role: 'zoomIn' },
        { role: 'zoomOut' },
        { type: 'separator' },
        { role: 'togglefullscreen' }
      ]
    },
    {
      label: 'Window',
      submenu: [
        { role: 'minimize' },
        { role: 'close' }
      ]
    }
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);

  mainWindow.webContents.on('dom-ready', () => {
    logger.log('DOM ready, injecting API base URL...');
    mainWindow.webContents.executeJavaScript(`
      console.log('Setting window.API_BASE_URL to http://localhost:5000/api');
      window.API_BASE_URL = "http://localhost:5000/api";
      console.log('API_BASE_URL set to:', window.API_BASE_URL);
    `);
  });

  if (isDev) {
    mainWindow.loadURL('http://localhost:3000');
  } else {
    const indexPath = path.join(process.resourcesPath, 'app', 'client', 'build', 'index.html');
    logger.log('Loading index.html from: ' + indexPath);
    mainWindow.loadURL(
      url.format({
        pathname: indexPath,
        protocol: 'file:',
        slashes: true,
      })
    );
  }

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  mainWindow.webContents.on('did-finish-load', () => {
    logger.log('Page finished loading, ensuring API base URL is set...');
    mainWindow.webContents.executeJavaScript(`
      if (!window.API_BASE_URL) {
        console.log('API_BASE_URL not found, setting it now...');
        window.API_BASE_URL = "http://localhost:5000/api";
      }
      console.log('Final API_BASE_URL:', window.API_BASE_URL);
    `);
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

function startServer() {
  return new Promise((resolve, reject) => {
    if (isDev) {
      logger.log('Development mode: assuming server is running separately');
      resolve();
      return;
    }

    const serverPath = path.join(__dirname, '../server/index.js');
    logger.log('Starting server from: ' + serverPath);
    
    if (!fs.existsSync(serverPath)) {
      const error = `Server file not found at: ${serverPath}`;
      logger.error(error);
      reject(new Error(error));
      return;
    }
    
    const nodeModulesPath = path.join(__dirname, '../server/node_modules');
    if (!fs.existsSync(nodeModulesPath)) {
      const error = `Server node_modules not found at: ${nodeModulesPath}`;
      logger.error(error);
      reject(new Error(error));
      return;
    }
    
    logger.log('Server file and dependencies found, starting server...');
    
    serverProcess = spawn('node', [serverPath], {
      cwd: path.join(__dirname, '../server'),
      stdio: ['pipe', 'pipe', 'pipe'],
      env: { 
        ...process.env,
        NODE_ENV: 'production',
        ELECTRON_IS_DEV: 'false'
      }
    });

    serverProcess.stdout.on('data', (data) => {
      logger.log(`Server: ${data.toString().trim()}`);
    });
    
    serverProcess.stderr.on('data', (data) => {
      logger.error(`Server Error: ${data.toString().trim()}`);
    });

    serverProcess.on('error', (err) => {
      logger.error('Failed to start server: ' + err.message);
      reject(err);
    });

    serverProcess.on('exit', (code) => {
      logger.log('Server process exited with code: ' + code);
      if (code !== 0) {
        reject(new Error(`Server exited with code ${code}`));
      }
    });

    setTimeout(() => {
      logger.log('Server should be running now');
      resolve();
    }, 3000);
  });
}

app.whenReady().then(async () => {
  logger = setupLogging();
  
  try {
    logger.log('Electron app ready, starting server...');
    logger.log('App version: ' + app.getVersion());
    logger.log('User data path: ' + app.getPath('userData'));
    logger.log('Resources path: ' + process.resourcesPath);
    
    await startServer();
    logger.log('Server started, creating window...');
    createWindow();
  } catch (error) {
    logger.error('Failed to start application: ' + error.message);
    logger.error('Stack trace: ' + error.stack);
    
    const { dialog } = require('electron');
    const logsPath = logger.getLogPath ? logger.getLogPath() : app.getPath('userData') + '\\logs';
    dialog.showErrorBox(
      'Startup Error', 
      `Failed to start the application server.\n\nError: ${error.message}\n\nLogs are saved to:\n${logsPath}`
    );
  }

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (serverProcess) {
    logger.log('Terminating server process...');
    serverProcess.kill('SIGTERM');
    
    
    setTimeout(() => {
      if (serverProcess && !serverProcess.killed) {
        logger.log('Force killing server process...');
        serverProcess.kill('SIGKILL');
      }
    }, 5000);
  }
  
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('before-quit', () => {
  if (serverProcess) {
    logger.log('App quitting, terminating server...');
    serverProcess.kill('SIGTERM');
  }
});


app.on('web-contents-created', (event, contents) => {
  contents.on('new-window', (event, url) => {
    event.preventDefault();
  });
}); 