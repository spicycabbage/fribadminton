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
    
    // Get all opponents this player has faced (players on opposing teams)
    const opponents = await sql<{ name: string }[]>`
      SELECT DISTINCT p2.name
      FROM players p1
      JOIN matches m ON p1.tournament_id = m.tournament_id
      JOIN players p2 ON m.tournament_id = p2.tournament_id
      WHERE p1.name = ${playerName}
        AND p1.tournament_id = ANY(${tournamentIds})
        AND p2.tournament_id = ANY(${tournamentIds})
        AND p2.name != ${playerName}
        AND m.completed = true 
        AND m.winner_team IS NOT NULL
        AND (
          -- p1 and p2 are on opposite teams
          ((m.team_a_p1 = p1.id OR m.team_a_p2 = p1.id) AND (m.team_b_p1 = p2.id OR m.team_b_p2 = p2.id)) OR
          ((m.team_b_p1 = p1.id OR m.team_b_p2 = p1.id) AND (m.team_a_p1 = p2.id OR m.team_a_p2 = p2.id))
        )
      ORDER BY p2.name
    `;

    const headToHeadRecords: HeadToHeadRecord[] = [];

    for (const opponent of opponents) {
      let wins = 0;
      let losses = 0;
      let totalMargin = 0;

      // Get all matches where these two players faced each other (on opposite teams)
      const matches = await sql<{ 
        winner_team: string; 
        team_a_p1: number; 
        team_a_p2: number; 
        team_b_p1: number; 
        team_b_p2: number; 
        score_a: number; 
        score_b: number;
        tournament_id: string;
      }[]>`
        SELECT DISTINCT m.winner_team, m.team_a_p1, m.team_a_p2, m.team_b_p1, m.team_b_p2, m.score_a, m.score_b, m.tournament_id
        FROM matches m
        JOIN players p1 ON m.tournament_id = p1.tournament_id
        JOIN players p2 ON m.tournament_id = p2.tournament_id
        WHERE m.tournament_id = ANY(${tournamentIds})
          AND m.completed = true 
          AND m.winner_team IS NOT NULL
          AND m.score_a IS NOT NULL
          AND m.score_b IS NOT NULL
          AND p1.name = ${playerName}
          AND p2.name = ${opponent.name}
          AND (
            -- Player 1 on team A, Player 2 on team B
            ((m.team_a_p1 = p1.id OR m.team_a_p2 = p1.id) AND (m.team_b_p1 = p2.id OR m.team_b_p2 = p2.id)) OR
            -- Player 1 on team B, Player 2 on team A
            ((m.team_b_p1 = p1.id OR m.team_b_p2 = p1.id) AND (m.team_a_p1 = p2.id OR m.team_a_p2 = p2.id))
          )
      `;

      for (const match of matches) {
        // Get player IDs for this tournament
        const [playerRecord] = await sql<{ id: number }[]>`
          SELECT id FROM players 
          WHERE tournament_id = ${match.tournament_id} AND name = ${playerName}
          LIMIT 1
        `;
        
        if (!playerRecord) continue;
        const playerId = playerRecord.id;
        
        const p1IsTeamA = match.team_a_p1 === playerId || match.team_a_p2 === playerId;
        const p1IsTeamB = match.team_b_p1 === playerId || match.team_b_p2 === playerId;
        
        // Calculate margin from player's perspective
        let margin = 0;
        if (p1IsTeamA) {
          margin = match.score_a - match.score_b; // Positive if player won
        } else if (p1IsTeamB) {
          margin = match.score_b - match.score_a; // Positive if player won
        }
        
        totalMargin += margin;
        
        if (match.winner_team === 'A' && p1IsTeamA) {
          wins++;
        } else if (match.winner_team === 'B' && p1IsTeamB) {
          wins++;
        } else if ((match.winner_team === 'A' && p1IsTeamB) || (match.winner_team === 'B' && p1IsTeamA)) {
          losses++;
        }
      }

      const totalMatches = wins + losses;
      if (totalMatches > 0) {
        const winPercentage = Math.round((wins / totalMatches) * 100);
        const avgMargin = Math.round((totalMargin / totalMatches) * 10) / 10;
        
        headToHeadRecords.push({
          opponent: opponent.name,
          wins,
          losses,
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
