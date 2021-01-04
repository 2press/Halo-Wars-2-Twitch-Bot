import { sum, uniqueId } from 'lodash';
import * as rm from 'typed-rest-client/RestClient';
import ElectronStore = require('electron-store');
import { SampleStore } from '../index';
import moment from 'moment';

interface RankedPlaylistStats {
    TotalMatchesWon: number;
    TotalMatchesLost: number;
}

interface PlayerStatsApi {
    MatchmakingSummary: {
        RankedPlaylistStats: RankedPlaylistStats[],
    }
}

export interface PlayerStats {
    player: string;
    games: number;
    wins: number;
    losses: number;
    winrate: string;
    key: string;
    time: number;
    error: boolean;
}

const store = new ElectronStore<SampleStore>();
const rest: rm.RestClient = new rm.RestClient('halo-wars-2-twitch-bot', 'https://www.haloapi.com');

export async function queryStats(player: string): Promise<PlayerStats> {
    const ocpKey = store.get('ocpKey') || '';
    const noStats = { player, games: 0, wins: 0, losses: 0, winrate: '0.0', key: uniqueId(), time: Date.now(), error: true };
    if (ocpKey === '') {
        return noStats;
    }
    try {
        const data = await rest.get<PlayerStatsApi>(`/stats/hw2/players/${encodeURIComponent(player)}/stats`, { additionalHeaders: { "Ocp-Apim-Subscription-Key": store.get('ocpKey') } });
        if (data.statusCode === 200) {
            const wins = sum(data.result.MatchmakingSummary.RankedPlaylistStats.map(stats => stats.TotalMatchesWon));
            const losses = sum(data.result.MatchmakingSummary.RankedPlaylistStats.map(stats => stats.TotalMatchesLost));
            const games = wins + losses;
            const winrate = games !== 0 ? ((wins / games) * 100.0).toFixed(1) : '0.0';
            return { player, games, wins, losses, winrate, key: uniqueId(), time: Date.now(), error: false };
        }

        return noStats;
    } catch (e) {
        return noStats;
    }
}

export async function validateOcpKey(key: string) {
    try {
        const data = await rest.get<PlayerStatsApi>(`/stats/hw2/players/yodesla/stats`, { additionalHeaders: { "Ocp-Apim-Subscription-Key": key } });
        return true;
    } catch (e) {
        return false;
    }
}