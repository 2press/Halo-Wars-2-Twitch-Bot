import { sum } from 'lodash';
import * as rm from 'typed-rest-client/RestClient';

interface RankedPlaylistStats {
    TotalMatchesWon: number;
    TotalMatchesLost: number;
}

interface PlayerStats {
    MatchmakingSummary: {
        RankedPlaylistStats: RankedPlaylistStats[],
    }
}

export async function queryStats(player: string) {
    const rest: rm.RestClient = new rm.RestClient('halo-wars-2-twitch-bot', 'https://www.haloapi.com');
    const data = await rest.get<PlayerStats>(`/stats/hw2/players/${encodeURIComponent(player)}/stats`, { additionalHeaders: { "Ocp-Apim-Subscription-Key": 'c0e9c0d5f42f44bcadb067313134f3f3' } });
    if (data.statusCode === 200) {
        const wins = sum(data.result.MatchmakingSummary.RankedPlaylistStats.map(stats => stats.TotalMatchesWon));
        const losses = sum(data.result.MatchmakingSummary.RankedPlaylistStats.map(stats => stats.TotalMatchesLost));
        const games = wins + losses;
        const winrate = games !== 0 ? ((wins / games) * 100.0).toFixed(1) : 0.0;
        return { player, games, wins, losses, winrate };
    }

    return null;
}