import { app, BrowserWindow } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';
import { startServer, stopServer, logger } from './server.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let mainWindow;
let expressServer;

async function createWindow() {
  // Avvia il server Express prima di creare la finestra
  try {
    logger.info('Avvio server Express...');
    expressServer = await startServer();
    logger.info('Server Express avviato con successo');
  } catch (error) {
    logger.error('Errore avvio server Express:', error);
    app.quit();
    return;
  }

  // Check if in development mode
  // In dev usa Vite, in prod usa i file compilati
  const isDev = process.env.VITE_DEV_SERVER_URL !== undefined;

  mainWindow = new BrowserWindow({
    width: 1920,
    height: 1080,
    fullscreen: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      webSecurity: true
    }
  });

  // Set Content Security Policy based on environment
  mainWindow.webContents.session.webRequest.onHeadersReceived((details, callback) => {
    const csp = isDev ? [
      // Development CSP
      "default-src 'self'; " +
      "script-src 'self' 'unsafe-inline' http://localhost:5173; " +
      "style-src 'self' 'unsafe-inline' http://localhost:5173 https://fonts.googleapis.com; " +
      "connect-src 'self' http://localhost:5173 http://127.0.0.1:2303 ws://localhost:5173; " +
      "img-src 'self' data: http://localhost:5173 http://127.0.0.1:2303 file:; " +
      "font-src 'self' data: https://fonts.gstatic.com;"
    ] : [
      // Production CSP
      "default-src 'self'; " +
      "script-src 'self' 'unsafe-inline'; " +
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; " +
      "connect-src 'self' http://127.0.0.1:2303; " +
      "img-src 'self' data: http://127.0.0.1:2303 file:; " +
      "font-src 'self' data: https://fonts.gstatic.com;"
    ];

    callback({
      responseHeaders: {
        ...details.responseHeaders,
        'Content-Security-Policy': csp
      }
    });
  });
  
  if (isDev) {
    logger.info('Modalità development: caricamento da Vite dev server');
    mainWindow.loadURL('http://localhost:5173');
  } else {
    const distPath = path.join(__dirname, '../../dist/index.html');
    logger.info(`Modalità production: caricamento da ${distPath}`);
    mainWindow.loadFile(distPath);
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // Enable navigation shortcuts (Alt+Left/Right for back/forward)
  mainWindow.webContents.on('before-input-event', (event, input) => {
    if (input.alt) {
      if (input.key === 'ArrowLeft' && mainWindow.webContents.canGoBack()) {
        mainWindow.webContents.goBack();
        event.preventDefault();
      } else if (input.key === 'ArrowRight' && mainWindow.webContents.canGoForward()) {
        mainWindow.webContents.goForward();
        event.preventDefault();
      }
    }
  });
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', async () => {
  // Chiudi il server Express prima di uscire
  await stopServer();
  
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// Gestione graceful shutdown
app.on('before-quit', async (event) => {
  if (expressServer) {
    event.preventDefault();
    logger.info('Chiusura applicazione...');
    await stopServer();
    expressServer = null;
    app.quit();
  }
});
