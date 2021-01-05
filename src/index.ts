import { app, BrowserWindow, ipcMain } from 'electron';
import { split, words } from 'lodash';
import { ChatClient } from 'twitch-chat-client';
import { ElectronAuthProvider } from 'twitch-electron-auth-provider';
import { queryStats, validateOcpKey } from './rest-client/rest-client';
import ElectronStore = require('electron-store');

declare const MAIN_WINDOW_WEBPACK_ENTRY: any;

export interface SampleStore {
  channel: string;
  ocpKey: string;
  command: string;
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
    const parts = split(message.trim(), /\s/);
    const command = store.get('command') || '!stats';
    if (parts.length < 2 || parts[0] !== command) return;
    parts.slice(1).forEach(async (player) => {
      const stats = await queryStats(player);
      mainWindow.webContents.send('stats', stats);
      if (stats.games > 0) {
        chatClient.say(channel, `@${user} Stats for ${stats.player}: ${stats.wins} Wins, ${stats.losses} Losses, ${stats.winrate}% Winrate`);
      } else {
        chatClient.say(channel, `@${user} No stats found for "${stats.player}"`);
      }
    });
  });
}

const createWindow = async (): Promise<void> => {
  // Create the browser window.
  mainWindow = new BrowserWindow({
    height: 650,
    width: 650,
    webPreferences: {
      nodeIntegration: true,
      enableRemoteModule: true,
      contextIsolation: false,
    }
  });

  // and load the index.html of the app.
  mainWindow.loadURL(MAIN_WINDOW_WEBPACK_ENTRY);
  mainWindow.removeMenu();

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
          chatClient.part(oldChannel);
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
      console.error(error);
      mainWindow.webContents.send('bot-connection', false);
    }
  });

  ipcMain.on('bot-disconnect', async () => {
    await chatClient.quit();
  });

};

app.on('ready', createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});