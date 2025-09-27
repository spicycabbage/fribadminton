import { NextRequest, NextResponse } from 'next/server';
import { ensureSchema, sql } from '@/lib/db';
import { analyticsCache, CACHE_KEYS, CACHE_TTL } from '@/lib/cache';

export async function GET(request: NextRequest) {
  try {
    await ensureSchema();
    
    const { searchParams } = new URL(request.url);
    const player1Name = searchParams.get('player1');
    const player2Name = searchParams.get('player2');

    // If no players specified, return all unique players
    if (!player1Name || !player2Name) {
      // Check cache for all players
      const cachedPlayers = analyticsCache.get<string[]>(CACHE_KEYS.ALL_PLAYERS);
      if (cachedPlayers) {
        return NextResponse.json({ players: cachedPlayers });
      }

      const players = await sql<{ name: string }[]>`
        SELECT DISTINCT name 
        FROM players 
        ORDER BY name ASC
      `;
      const playerNames = players.map((p: { name: string }) => p.name);
      
      // Cache the player list
      analyticsCache.set(CACHE_KEYS.ALL_PLAYERS, playerNames, CACHE_TTL);
      
      return NextResponse.json({ players: playerNames });
    }

    // Check cache for partnership stats
    const cacheKey = CACHE_KEYS.PARTNERSHIP_STATS(player1Name, player2Name);
    const cachedStats = analyticsCache.get(cacheKey);
    if (cachedStats) {
      return NextResponse.json(cachedStats);
    }

    // Find all matches where these two players were partners
    const partnershipMatches = await sql<{
      tournament_id: string;
      match_id: number;
      round: number;
      score_a: number;
      score_b: number;
      winner_team: string;
      team_position: string;
      date: string;
    }[]>`
      SELECT DISTINCT 
        m.tournament_id,
        m.id as match_id,
        m.round,
        m.score_a,
        m.score_b,
        m.winner_team,
        CASE 
          WHEN (p1.name = ${player1Name} AND p2.name = ${player2Name}) OR 
               (p1.name = ${player2Name} AND p2.name = ${player1Name}) THEN 'A'
          WHEN (p3.name = ${player1Name} AND p4.name = ${player2Name}) OR 
               (p3.name = ${player2Name} AND p4.name = ${player1Name}) THEN 'B'
        END as team_position,
        t.date
      FROM matches m
      JOIN tournaments t ON m.tournament_id = t.id
      JOIN players p1 ON m.tournament_id = p1.tournament_id AND m.team_a_p1 = p1.id
      JOIN players p2 ON m.tournament_id = p2.tournament_id AND m.team_a_p2 = p2.id
      JOIN players p3 ON m.tournament_id = p3.tournament_id AND m.team_b_p1 = p3.id
      JOIN players p4 ON m.tournament_id = p4.tournament_id AND m.team_b_p2 = p4.id
      WHERE m.completed = true
        AND (
          (p1.name = ${player1Name} AND p2.name = ${player2Name}) OR
          (p1.name = ${player2Name} AND p2.name = ${player1Name}) OR
          (p3.name = ${player1Name} AND p4.name = ${player2Name}) OR
          (p3.name = ${player2Name} AND p4.name = ${player1Name})
        )
      ORDER BY t.date DESC, m.round ASC
    `;

    if (partnershipMatches.length === 0) {
      const noPartnershipResult = { 
        exists: false, 
        message: "No such partnership" 
      };
      
      // Cache the "no partnership" result too
      analyticsCache.set(cacheKey, noPartnershipResult, CACHE_TTL);
      
      return NextResponse.json(noPartnershipResult);
    }

    // Calculate statistics
    let wins = 0;
    let losses = 0;
    let totalMargin = 0;

    partnershipMatches.forEach((match: {
      tournament_id: string;
      match_id: number;
      round: number;
      score_a: number;
      score_b: number;
      winner_team: string;
      team_position: string;
      date: string;
    }) => {
      const isWin = match.winner_team === match.team_position;
      const partnerScore = match.team_position === 'A' ? match.score_a : match.score_b;
      const opponentScore = match.team_position === 'A' ? match.score_b : match.score_a;
      const margin = partnerScore - opponentScore; // Net margin (positive for wins, negative for losses)

      totalMargin += margin;

      if (isWin) {
        wins++;
      } else {
        losses++;
      }
    });

    const totalGames = wins + losses;
    const winPercentage = totalGames > 0 ? ((wins / totalGames) * 100).toFixed(1) : '0.0';
    const avgMarginVictory = totalGames > 0 ? (totalMargin / totalGames).toFixed(1) : '0.0';

    const result = {
      exists: true,
      player1: player1Name,
      player2: player2Name,
      stats: {
        totalGames,
        wins,
        losses,
        winPercentage: parseFloat(winPercentage),
        avgMarginVictory: parseFloat(avgMarginVictory)
      },
      matches: partnershipMatches.map((match: {
        tournament_id: string;
        match_id: number;
        round: number;
        score_a: number;
        score_b: number;
        winner_team: string;
        team_position: string;
        date: string;
      }) => ({
        tournamentId: match.tournament_id,
        date: match.date,
        round: match.round,
        partnerScore: match.team_position === 'A' ? match.score_a : match.score_b,
        opponentScore: match.team_position === 'A' ? match.score_b : match.score_a,
        won: match.winner_team === match.team_position
      }))
    };

    // Cache the result
    analyticsCache.set(cacheKey, result, CACHE_TTL);

    return NextResponse.json(result);

  } catch (error) {
    console.error('Partnership stats error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch partnership statistics' },
      { status: 500 }
    );
  }
}
