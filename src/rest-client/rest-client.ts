import { add, map, mapKeys, mapValues, max, maxBy, mergeWith, reduce, sum, uniqueId } from 'lodash';
import moment from 'moment';
import * as rm from 'typed-rest-client/RestClient';
import { SampleStore } from '../index';
import ElectronStore = require('electron-store');

interface RankedPlaylistStats {
    TotalTimePlayed: string;
    TotalMatchesWon: number;
    TotalMatchesLost: number;
    LeaderStats: Map<string, { TotalMatchesStarted: number }>;
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
    timePlayed: number;
    avgGameTime: number;
    favLeader: string;
    error: boolean;
}

const store = new ElectronStore<SampleStore>();
const rest: rm.RestClient = new rm.RestClient('halo-wars-2-twitch-bot', 'https://www.haloapi.com');

export function formatStats(stats: PlayerStats) {
    if (stats.games > 0) {
        return `Matckmaking stats for ${stats.player}: ${stats.wins} wins, ${stats.losses} losses, ${stats.winrate}% winrate, ${moment.duration(stats.timePlayed).humanize()} played in total, ${moment.duration(stats.avgGameTime).humanize()} average game length, ${stats.favLeader} favorite leader`;
    } else {
        return `No stats available for ${stats.player}.`;
    }
}

export async function queryStats(player: string): Promise<PlayerStats> {
    const ocpKey = store.get('ocpKey') || '';
    const noStats = { player, games: 0, wins: 0, losses: 0, winrate: '0.0', timePlayed: 0, avgGameTime: 0, favLeader: '', key: uniqueId(), time: Date.now(), error: true, };
    if (ocpKey === '') {
        return noStats;
    }
    try {
        const data = await rest.get<PlayerStatsApi>(`/stats/hw2/players/${encodeURIComponent(player)}/stats`, { additionalHeaders: { "Ocp-Apim-Subscription-Key": store.get('ocpKey') } });
        if (data.statusCode === 200) {
            const wins = sum(data.result.MatchmakingSummary.RankedPlaylistStats.map(stats => stats.TotalMatchesWon));
            const losses = sum(data.result.MatchmakingSummary.RankedPlaylistStats.map(stats => stats.TotalMatchesLost));
            const timePlayed = sum(data.result.MatchmakingSummary.RankedPlaylistStats.map(stats => moment.duration(stats.TotalTimePlayed)));
            const leaderStats = data.result.MatchmakingSummary.RankedPlaylistStats.map(stats => mapValues(stats.LeaderStats, 'TotalMatchesStarted'));
            const favLeader = maxBy(map(mergeWith({}, ...leaderStats, add), (value, key) => ({ leader: key, matches: value })), 'matches').leader;
            const games = wins + losses;
            const winrate = games !== 0 ? ((wins / games) * 100.0).toFixed(1) : '0.0';
            const avgGameTime = games !== 0 ? timePlayed / games : 0;
            return { player, games, wins, losses, winrate, timePlayed, avgGameTime, favLeader, key: uniqueId(), time: Date.now(), error: false };
        }

        return noStats;
    } catch (e) {
        console.error(e);
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