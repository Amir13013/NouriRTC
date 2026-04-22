const { app, BrowserWindow, shell } = require('electron');
const path = require('path');

function createWindow() {
  // 👉 je crée une fenêtre native avec les dimensions de départ
  const win = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 940,   // 👉 taille minimale pour que l'interface reste lisible
    minHeight: 600,
    backgroundColor: '#111214',  // 👉 couleur de fond pendant le chargement (évite le flash blanc)
    title: 'ChatFlow',
    webPreferences: {
      // 👉 sécurité : le code JavaScript de l'app web ne peut pas accéder aux APIs Node.js
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  // 👉 je vire la barre de menus (File, Edit...) pour que ça ressemble à une vraie app
  win.setMenuBarVisibility(false);
  // 👉 je charge l'app Next.js qui tourne dans Docker sur le port 3000
  win.loadURL('http://localhost:3000');

  // 👉 si quelqu'un clique sur un lien externe → je l'ouvre dans le vrai navigateur
  // 👉 sinon Electron ouvrirait une nouvelle fenêtre Electron
  win.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });
}

// 👉 quand Electron est prêt → je crée la fenêtre
app.whenReady().then(() => {
  createWindow();

  // 👉 sur Mac : si on reclique sur l'icône du dock alors que toutes les fenêtres sont fermées
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

// 👉 quand toutes les fenêtres sont fermées → on quitte l'app (sauf sur Mac c'est le comportement normal)
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
