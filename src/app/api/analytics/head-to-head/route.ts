import { NextResponse } from 'next/server';
import { ensureSchema, sql } from '@/lib/db';
import { analyticsCache, CACHE_KEYS, CACHE_TTL } from '@/lib/cache';

interface HeadToHeadRecord {
  opponent: string;
  wins: number;
  losses: number;
  totalMatches: number;
  winPercentage: number;
  avgMargin: number; // Average margin (positive = winning by this much, negative = losing by this much)
}

export async function POST(req: Request) {
  try {
    await ensureSchema();
    const { playerName, year } = await req.json();
    
    if (!playerName) {
      return NextResponse.json({ error: 'Player name is required' }, { status: 400 });
    }
    
    const yearFilter = year || 'all';
    
    // Check cache
    const cacheKey = `${CACHE_KEYS.HEAD_TO_HEAD(playerName)}:${yearFilter}`;
    const cachedRecords = analyticsCache.get<HeadToHeadRecord[]>(cacheKey);
    if (cachedRecords) {
      return NextResponse.json(cachedRecords);
    }
    
    // Get all finalized tournaments (with optional year filter)
    let tournaments;
    if (yearFilter === 'all') {
      tournaments = await sql<{ id: string }[]>`
        SELECT id FROM tournaments 
        WHERE is_finalized = true
      `;
    } else {
      const yearInt = parseInt(yearFilter);
      tournaments = await sql<{ id: string }[]>`
        SELECT id FROM tournaments 
        WHERE is_finalized = true
          AND EXTRACT(YEAR FROM date::date) = ${yearInt}
      `;
    }

    if (tournaments.length === 0) {
      return NextResponse.json([]);
    }

    const tournamentIds = tournaments.map((t: { id: string }) => t.id);
    
    // Get all head-to-head match data in one query
    const headToHeadData = await sql<{
      opponent_name: string;
      player_won: boolean;
      margin: number;
    }[]>`
      WITH player_matches AS (
        SELECT 
          m.tournament_id,
          m.winner_team,
          m.score_a,
          m.score_b,
          m.team_a_p1,
          m.team_a_p2,
          m.team_b_p1,
          m.team_b_p2,
          p_main.id as player_id,
          p_opp.name as opponent_name
        FROM matches m
        JOIN players p_main ON m.tournament_id = p_main.tournament_id AND p_main.name = ${playerName}
        JOIN players p_opp ON m.tournament_id = p_opp.tournament_id AND p_opp.name != ${playerName}
        WHERE m.tournament_id = ANY(${tournamentIds})
          AND m.completed = true 
          AND m.winner_team IS NOT NULL
          AND m.score_a IS NOT NULL
          AND m.score_b IS NOT NULL
          AND (
            -- p_main on team A, p_opp on team B
            ((m.team_a_p1 = p_main.id OR m.team_a_p2 = p_main.id) AND (m.team_b_p1 = p_opp.id OR m.team_b_p2 = p_opp.id)) OR
            -- p_main on team B, p_opp on team A
            ((m.team_b_p1 = p_main.id OR m.team_b_p2 = p_main.id) AND (m.team_a_p1 = p_opp.id OR m.team_a_p2 = p_opp.id))
          )
      )
      SELECT 
        opponent_name,
        CASE 
          WHEN (team_a_p1 = player_id OR team_a_p2 = player_id) AND winner_team = 'A' THEN true
          WHEN (team_b_p1 = player_id OR team_b_p2 = player_id) AND winner_team = 'B' THEN true
          ELSE false
        END as player_won,
        CASE 
          WHEN team_a_p1 = player_id OR team_a_p2 = player_id THEN score_a - score_b
          ELSE score_b - score_a
        END as margin
      FROM player_matches
    `;

    // Aggregate by opponent
    const opponentStats = new Map<string, { wins: number; losses: number; totalMargin: number }>();
    
    for (const row of headToHeadData) {
      if (!opponentStats.has(row.opponent_name)) {
        opponentStats.set(row.opponent_name, { wins: 0, losses: 0, totalMargin: 0 });
      }
      const stats = opponentStats.get(row.opponent_name)!;
      if (row.player_won) {
        stats.wins++;
      } else {
        stats.losses++;
      }
      stats.totalMargin += row.margin;
    }

    const headToHeadRecords: HeadToHeadRecord[] = [];
    for (const [opponent, stats] of opponentStats.entries()) {
      const totalMatches = stats.wins + stats.losses;
      if (totalMatches > 0) {
        const winPercentage = Math.round((stats.wins / totalMatches) * 100);
        const avgMargin = Math.round((stats.totalMargin / totalMatches) * 10) / 10;
        
        headToHeadRecords.push({
          opponent,
          wins: stats.wins,
          losses: stats.losses,
          totalMatches,
          winPercentage,
          avgMargin
        });
      }
    }

    // Sort by win percentage (descending), then by total matches (descending)
    headToHeadRecords.sort((a, b) => {
      if (b.winPercentage !== a.winPercentage) {
        return b.winPercentage - a.winPercentage;
      }
      return b.totalMatches - a.totalMatches;
    });

    // headToHeadRecords is already in the correct format

    // Cache the results
    analyticsCache.set(cacheKey, headToHeadRecords, CACHE_TTL);

    return NextResponse.json(headToHeadRecords);
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Server error' }, { status: 500 });
  }
}
