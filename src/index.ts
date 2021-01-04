import { app, BrowserWindow, ipcMain } from 'electron';
import { uniqueId, words } from 'lodash';
import { ChatClient } from 'twitch-chat-client';
import { ElectronAuthProvider } from 'twitch-electron-auth-provider';
import { queryStats, validateOcpKey } from './rest-client/rest-client';
import ElectronStore = require('electron-store');

declare const MAIN_WINDOW_WEBPACK_ENTRY: any;

export interface SampleStore {
  channel: string;
  ocpKey: string;
}

const store = new ElectronStore<SampleStore>();

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require('electron-squirrel-startup')) { // eslint-disable-line global-require
  app.quit();
}

const clientId = 'k08ad43597pz02vuwvga6w6948vxs9';
const redirectUri = 'https://github.com/2press';

const authProvider = new ElectronAuthProvider({
  clientId,
  redirectUri
});

let mainWindow: BrowserWindow;

let chatClient: ChatClient;

const registerChatClient = () => {
  chatClient = new ChatClient(authProvider, { channels: [store.get('channel')] });

  chatClient.onConnect(() => {
    mainWindow.webContents.send('bot-connection', true);
  });

  chatClient.onAuthenticationFailure(() => {
    mainWindow.webContents.send('bot-connection', false);
  });

  chatClient.onDisconnect(() => {
    mainWindow.webContents.send('bot-connection', false);
  });

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
}

const createWindow = async (): Promise<void> => {
  // Create the browser window.
  mainWindow = new BrowserWindow({
    height: 600,
    width: 800,
    minWidth: 400,
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

  registerChatClient();

  ipcMain.on('validate-ocp-key', async (event, key) => {
    event.returnValue = await validateOcpKey(key);
  })

  ipcMain.on('twitch-logout', async () => {
    if (chatClient.isConnected) {
      await chatClient.quit();
    }
    authProvider.setAccessToken(null);
    authProvider.allowUserChange();
    try {
      const token = await authProvider.getAccessToken(['chat:edit', 'chat:read']);
    } catch (e) {
      console.error(e);
    }
  });

  ipcMain.on('change-channel', async (_event, channel) => {
    const oldChannel = store.get('channel');
    if (channel !== oldChannel) {
      store.set('channel', channel);
      if (chatClient.isConnected) {
        try {
          await chatClient.part(oldChannel);
          await chatClient.join(channel);
        } catch (error) {
          registerChatClient()
        }
      } else {
        registerChatClient();
      }
    }
  });

  ipcMain.on('bot-connect', async () => {
    try {
      await chatClient.connect();
    } catch (error) {
      console.error("Error");
      mainWindow.webContents.send('bot-connection', false);
    }
  });

  ipcMain.on('bot-disconnect', async () => {
    await chatClient.quit();
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
