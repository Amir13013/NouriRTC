const { app, BrowserWindow, shell } = require('electron');
const http = require('http');
const path = require('path');

const PORT = 3000;
const URL  = `http://localhost:${PORT}`;

// ─── Poll until Next.js is ready ────────────────────────────────────────────
function waitForNextJs(timeoutMs = 60000) {
  return new Promise((resolve, reject) => {
    const start = Date.now();
    const check = () => {
      const req = http.request({ host: 'localhost', port: PORT, method: 'HEAD' }, () => {
        resolve();
      });
      req.on('error', () => {
        if (Date.now() - start > timeoutMs) {
          return reject(new Error(`ChatFlow n'a pas démarré après ${timeoutMs / 1000}s.\nVérifie que Docker est lancé.`));
        }
        setTimeout(check, 500);
      });
      req.end();
    };
    check();
  });
}

// ─── Splash / loading window ─────────────────────────────────────────────────
function createSplash() {
  const splash = new BrowserWindow({
    width: 420,
    height: 280,
    frame: false,
    alwaysOnTop: true,
    transparent: true,
    resizable: false,
    webPreferences: { nodeIntegration: true, contextIsolation: false },
  });

  splash.loadURL(`data:text/html,
    <html>
    <body style="margin:0;background:#111214;display:flex;flex-direction:column;
                 align-items:center;justify-content:center;height:100vh;
                 font-family:sans-serif;color:white;border-radius:12px;">
      <img src="file://${path.join(__dirname, '../public/logo-icon.png').replace(/\\/g, '/')}"
           width="80" style="margin-bottom:20px" onerror="this.style.display='none'"/>
      <h2 style="margin:0 0 8px;font-size:24px">ChatFlow</h2>
      <p style="margin:0;color:#b9bbbe;font-size:14px">Connexion au serveur...</p>
    </body>
    </html>
  `);

  return splash;
}

// ─── Main window ─────────────────────────────────────────────────────────────
function createMainWindow() {
  const win = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 940,
    minHeight: 600,
    show: false,
    backgroundColor: '#111214',
    icon: path.join(__dirname, '../public/logo-icon.png'),
    title: 'ChatFlow',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  win.setMenuBarVisibility(false);
  win.loadURL(URL);

  // Open external links in the real browser, not in Electron
  win.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  return win;
}

// ─── App lifecycle ────────────────────────────────────────────────────────────
app.whenReady().then(async () => {
  const splash = createSplash();

  try {
    await waitForNextJs();
  } catch (err) {
    const { dialog } = require('electron');
    splash.close();
    dialog.showErrorBox('ChatFlow — Erreur de démarrage', err.message);
    app.quit();
    return;
  }

  const win = createMainWindow();

  win.once('ready-to-show', () => {
    splash.close();
    win.show();
    win.focus();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createMainWindow().show();
  }
});
