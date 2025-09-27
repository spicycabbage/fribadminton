import { NextResponse } from 'next/server';
import { ensureSchema, sql } from '@/lib/db';
import { analyticsCache, CACHE_KEYS, CACHE_TTL } from '@/lib/cache';

interface PlayerStats {
  name: string;
  wins: number;
  losses: number;
  totalMatches: number;
  winPercentage: number;
}

export async function GET() {
  try {
    await ensureSchema();
    
    // Check cache first
    const cachedStats = analyticsCache.get<PlayerStats[]>(CACHE_KEYS.PLAYER_STATS);
    if (cachedStats) {
      return NextResponse.json(cachedStats);
    }
    
    // Single optimized query to get all player stats at once
    const playerStats = await sql<{
      name: string;
      wins: number;
      losses: number;
      total_matches: number;
      win_percentage: number;
    }[]>`
      WITH player_matches AS (
        SELECT 
          p.name,
          CASE 
            WHEN (m.team_a_p1 = p.id OR m.team_a_p2 = p.id) AND m.winner_team = 'A' THEN 1
            WHEN (m.team_b_p1 = p.id OR m.team_b_p2 = p.id) AND m.winner_team = 'B' THEN 1
            ELSE 0
          END as is_win
        FROM players p
        JOIN tournaments t ON p.tournament_id = t.id
        JOIN matches m ON p.tournament_id = m.tournament_id
        WHERE t.is_finalized = true 
          AND m.completed = true 
          AND m.winner_team IS NOT NULL
          AND (m.team_a_p1 = p.id OR m.team_a_p2 = p.id OR m.team_b_p1 = p.id OR m.team_b_p2 = p.id)
      )
      SELECT 
        name,
        SUM(is_win)::integer as wins,
        (COUNT(*) - SUM(is_win))::integer as losses,
        COUNT(*)::integer as total_matches,
        CASE 
          WHEN COUNT(*) > 0 THEN ROUND((SUM(is_win)::float / COUNT(*)) * 100)::integer
          ELSE 0
        END as win_percentage
      FROM player_matches
      GROUP BY name
      ORDER BY win_percentage DESC, total_matches DESC
    `;

    // Convert to the expected format
    const formattedStats: PlayerStats[] = playerStats.map((stat: {
      name: string;
      wins: number;
      losses: number;
      total_matches: number;
      win_percentage: number;
    }) => ({
      name: stat.name,
      wins: stat.wins,
      losses: stat.losses,
      totalMatches: stat.total_matches,
      winPercentage: stat.win_percentage
    }));

    // Cache the results
    analyticsCache.set(CACHE_KEYS.PLAYER_STATS, formattedStats, CACHE_TTL);

    return NextResponse.json(formattedStats);
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Server error' }, { status: 500 });
  }
}
