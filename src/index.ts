import { app, BrowserWindow } from 'electron';
import { words } from 'lodash';
import { ChatClient } from 'twitch-chat-client';
import { ElectronAuthProvider } from 'twitch-electron-auth-provider';
import { queryStats } from './rest-client/rest-client';

declare const MAIN_WINDOW_WEBPACK_ENTRY: any;

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require('electron-squirrel-startup')) { // eslint-disable-line global-require
  app.quit();
}

const createWindow = async (): Promise<void> => {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    height: 600,
    width: 800,
    webPreferences: {
      nodeIntegration: true,
      enableRemoteModule: true,
      contextIsolation: false,
    }
  });

  // and load the index.html of the app.
  mainWindow.loadURL(MAIN_WINDOW_WEBPACK_ENTRY);
  mainWindow.removeMenu();

  // Open the DevTools.
  mainWindow.webContents.openDevTools();

  const clientId = 'k08ad43597pz02vuwvga6w6948vxs9';
  const redirectUri = 'https://github.com/2press';

  const authProvider = new ElectronAuthProvider({
    clientId,
    redirectUri
  });

  const chatClient = new ChatClient(authProvider, { channels: ['teampheenix'] });
  await chatClient.connect();

  chatClient.onMessage(async (channel, user, message) => {
    message = message.trim();
    if (!message.startsWith("!")) return;

    const [command, ...args] = words(message);
    if (command === 'stats') {
      args.forEach(async (player) => {
        const stats = await queryStats(player);
        mainWindow.webContents.send('stats', stats);
        if (stats.games > 0) {
          chatClient.say(channel, `@${user} Stats for ${stats.player}: ${stats.wins} Wins, ${stats.losses} Losses, ${stats.winrate}% Winrate`);
        } else {
          chatClient.say(channel, `@${user} No stats found for "${stats.player}"`);
        }
      });
    }
  });
};

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', createWindow);

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and import them here.
