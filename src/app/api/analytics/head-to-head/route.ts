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
    const { playerName } = await req.json();
    
    if (!playerName) {
      return NextResponse.json({ error: 'Player name is required' }, { status: 400 });
    }
    
    // Check cache first
    const cacheKey = CACHE_KEYS.HEAD_TO_HEAD(playerName);
    const cachedRecords = analyticsCache.get<HeadToHeadRecord[]>(cacheKey);
    if (cachedRecords) {
      return NextResponse.json(cachedRecords);
    }
    
    // Single optimized query to get all head-to-head records
    const headToHeadRecords = await sql<{
      opponent: string;
      wins: number;
      losses: number;
      total_matches: number;
      win_percentage: number;
      avg_margin: number;
    }[]>`
      WITH opponent_matches AS (
        SELECT 
          CASE 
            WHEN p1.name = ${playerName} THEN p2.name
            WHEN p2.name = ${playerName} THEN p1.name
            WHEN p3.name = ${playerName} THEN p4.name
            WHEN p4.name = ${playerName} THEN p3.name
          END as opponent_name,
          CASE 
            -- Player is on team A and team A wins
            WHEN (p1.name = ${playerName} OR p2.name = ${playerName}) AND m.winner_team = 'A' THEN 1
            -- Player is on team B and team B wins
            WHEN (p3.name = ${playerName} OR p4.name = ${playerName}) AND m.winner_team = 'B' THEN 1
            ELSE 0
          END as is_win,
          CASE 
            -- Player is on team A
            WHEN p1.name = ${playerName} OR p2.name = ${playerName} THEN m.score_a - m.score_b
            -- Player is on team B
            WHEN p3.name = ${playerName} OR p4.name = ${playerName} THEN m.score_b - m.score_a
            ELSE 0
          END as margin
        FROM matches m
        JOIN tournaments t ON m.tournament_id = t.id
        JOIN players p1 ON m.tournament_id = p1.tournament_id AND m.team_a_p1 = p1.id
        JOIN players p2 ON m.tournament_id = p2.tournament_id AND m.team_a_p2 = p2.id
        JOIN players p3 ON m.tournament_id = p3.tournament_id AND m.team_b_p1 = p3.id
        JOIN players p4 ON m.tournament_id = p4.tournament_id AND m.team_b_p2 = p4.id
        WHERE t.is_finalized = true 
          AND m.completed = true 
          AND m.winner_team IS NOT NULL
          AND m.score_a IS NOT NULL
          AND m.score_b IS NOT NULL
          AND (
            -- Player is on team A, opponent on team B
            (p1.name = ${playerName} AND (p3.name != ${playerName} AND p4.name != ${playerName})) OR
            (p2.name = ${playerName} AND (p3.name != ${playerName} AND p4.name != ${playerName})) OR
            -- Player is on team B, opponent on team A  
            (p3.name = ${playerName} AND (p1.name != ${playerName} AND p2.name != ${playerName})) OR
            (p4.name = ${playerName} AND (p1.name != ${playerName} AND p2.name != ${playerName}))
          )
      )
      SELECT 
        opponent_name as opponent,
        SUM(is_win)::integer as wins,
        (COUNT(*) - SUM(is_win))::integer as losses,
        COUNT(*)::integer as total_matches,
        CASE 
          WHEN COUNT(*) > 0 THEN ROUND((SUM(is_win)::float / COUNT(*)) * 100)::integer
          ELSE 0
        END as win_percentage,
        CASE 
          WHEN COUNT(*) > 0 THEN ROUND((SUM(margin)::float / COUNT(*)) * 10) / 10
          ELSE 0
        END as avg_margin
      FROM opponent_matches
      WHERE opponent_name IS NOT NULL
      GROUP BY opponent_name
      ORDER BY win_percentage DESC, total_matches DESC
    `;

    // Convert to the expected format
    const formattedRecords: HeadToHeadRecord[] = headToHeadRecords.map((record: {
      opponent: string;
      wins: number;
      losses: number;
      total_matches: number;
      win_percentage: number;
      avg_margin: number;
    }) => ({
      opponent: record.opponent,
      wins: record.wins,
      losses: record.losses,
      totalMatches: record.total_matches,
      winPercentage: record.win_percentage,
      avgMargin: record.avg_margin
    }));

    // Cache the results
    analyticsCache.set(cacheKey, formattedRecords, CACHE_TTL);

    return NextResponse.json(formattedRecords);
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Server error' }, { status: 500 });
  }
}
