import { ipcMain } from 'electron';
import { sum } from 'lodash';
import * as rm from 'typed-rest-client/RestClient';
import { Bot, createBotCommand } from 'easy-twitch-bot';

export function register() {
    ipcMain.on('player-stats', async (_event, _data) => {
        await runSample();
    });

    Bot.create({
        auth: 'YOURTOKENHERE',
        channel: 'satisfiedpear',
        commands: [
            createBotCommand('dice', (params, { user, say }) => {
                const diceRoll = Math.floor(Math.random() * 6) + 1;
                say(`@${user} rolled a ${diceRoll}`);
            })
        ]
    });
}

interface RankedPlaylistStats {
    TotalMatchesWon: number;
    TotalMatchesLost: number;
}

interface PlayerStats {
    MatchmakingSummary: {
        RankedPlaylistStats: RankedPlaylistStats[],
    }
}

export async function runSample() {
    const rest: rm.RestClient = new rm.RestClient('halo-wars-2-twitch-bot', 'https://www.haloapi.com');
    const data = await rest.get<PlayerStats>('/stats/hw2/players/yodesla/stats', { additionalHeaders: { "Ocp-Apim-Subscription-Key": 'c0e9c0d5f42f44bcadb067313134f3f3' } });
    if (data.statusCode === 200) {
        const matchesWon = sum(data.result.MatchmakingSummary.RankedPlaylistStats.map(stats => stats.TotalMatchesWon));
        const matchesLost = sum(data.result.MatchmakingSummary.RankedPlaylistStats.map(stats => stats.TotalMatchesLost));
        console.log(matchesWon, matchesLost);
    }
}