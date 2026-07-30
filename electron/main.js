const { app, BrowserWindow, dialog } = require('electron');
const path = require('node:path');
const http = require('node:http');
const { spawn } = require('node:child_process');

const PORT = process.env.PORT || 4177;
const SERVER_PATH = path.join(__dirname, '..', 'server', 'index.js');

let serverProcess = null;
let mainWindow = null;

function startServer() {
  serverProcess = spawn('node', [SERVER_PATH], {
    cwd: path.join(__dirname, '..'),
    env: { ...process.env, PORT },
  });

  serverProcess.stdout.on('data', (data) => console.log(`[servidor] ${data}`.trim()));
  serverProcess.stderr.on('data', (data) => console.error(`[servidor] ${data}`.trim()));

  serverProcess.on('error', (err) => {
    dialog.showErrorBox(
      'Não foi possível iniciar o servidor',
      `Verifique se o Node.js está instalado.\n\n${err.message}`
    );
    app.quit();
  });
}

function waitForServer(callback, tentativas = 40) {
  http
    .get(`http://127.0.0.1:${PORT}/`, (res) => {
      res.resume();
      callback();
    })
    .on('error', () => {
      if (tentativas <= 0) {
        dialog.showErrorBox('Erro', 'O servidor demorou demais para responder.');
        app.quit();
        return;
      }
      setTimeout(() => waitForServer(callback, tentativas - 1), 250);
    });
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1300,
    height: 840,
    minWidth: 960,
    minHeight: 600,
    title: 'Estoque Fácil',
    backgroundColor: '#f4f6f7',
    autoHideMenuBar: true,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  mainWindow.loadURL(`http://127.0.0.1:${PORT}`);
}

app.whenReady().then(() => {
  startServer();
  waitForServer(createWindow);

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      waitForServer(createWindow);
    }
  });
});

app.on('window-all-closed', () => {
  app.quit();
});

app.on('before-quit', () => {
  if (serverProcess) {
    serverProcess.kill();
  }
});
