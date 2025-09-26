import { NextResponse } from 'next/server';
import { ensureSchema, sql } from '@/lib/db';

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
    
    // Get all finalized tournaments
    const tournaments = await sql<{ id: string }[]>`
      SELECT id FROM tournaments 
      WHERE is_finalized = true
    `;

    if (tournaments.length === 0) {
      return NextResponse.json([]);
    }

    const tournamentIds = tournaments.map((t: { id: string }) => t.id);
    
    // Get all opponents this player has faced
    const opponents = await sql<{ name: string }[]>`
      SELECT DISTINCT p2.name
      FROM players p1
      JOIN matches m ON (
        (m.team_a_p1 = p1.id OR m.team_a_p2 = p1.id OR m.team_b_p1 = p1.id OR m.team_b_p2 = p1.id)
        AND m.completed = true 
        AND m.winner_team IS NOT NULL
      )
      JOIN players p2 ON (
        (m.team_a_p1 = p2.id OR m.team_a_p2 = p2.id OR m.team_b_p1 = p2.id OR m.team_b_p2 = p2.id)
        AND p2.id != p1.id
      )
      WHERE p1.name = ${playerName}
        AND p1.tournament_id = ANY(${tournamentIds})
        AND p2.tournament_id = ANY(${tournamentIds})
      ORDER BY p2.name
    `;

    const headToHeadRecords: HeadToHeadRecord[] = [];

    for (const opponent of opponents) {
      let wins = 0;
      let losses = 0;
      let totalMargin = 0;

      // For each tournament, get matches between these two players
      for (const tournament of tournaments) {
        // Get player IDs in this tournament
        const [player1] = await sql<{ id: number }[]>`
          SELECT id FROM players 
          WHERE tournament_id = ${tournament.id} AND name = ${playerName}
          LIMIT 1
        `;
        
        const [player2] = await sql<{ id: number }[]>`
          SELECT id FROM players 
          WHERE tournament_id = ${tournament.id} AND name = ${opponent.name}
          LIMIT 1
        `;

        if (!player1 || !player2) continue;

        const p1Id = player1.id;
        const p2Id = player2.id;

        // Get matches where both players participated
        const matches = await sql<{ winner_team: string; team_a_p1: number; team_a_p2: number; team_b_p1: number; team_b_p2: number; score_a: number; score_b: number }[]>`
          SELECT winner_team, team_a_p1, team_a_p2, team_b_p1, team_b_p2, score_a, score_b
          FROM matches 
          WHERE tournament_id = ${tournament.id} 
            AND completed = true 
            AND winner_team IS NOT NULL
            AND score_a IS NOT NULL
            AND score_b IS NOT NULL
            AND (
              (team_a_p1 = ${p1Id} OR team_a_p2 = ${p1Id}) AND (team_b_p1 = ${p2Id} OR team_b_p2 = ${p2Id})
              OR
              (team_b_p1 = ${p1Id} OR team_b_p2 = ${p1Id}) AND (team_a_p1 = ${p2Id} OR team_a_p2 = ${p2Id})
            )
        `;

        for (const match of matches) {
          const p1IsTeamA = match.team_a_p1 === p1Id || match.team_a_p2 === p1Id;
          const p1IsTeamB = match.team_b_p1 === p1Id || match.team_b_p2 === p1Id;
          
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
      }

      const totalMatches = wins + losses;
      if (totalMatches > 0) {
        const winPercentage = Math.round((wins / totalMatches) * 100);
        const avgMargin = Math.round((totalMargin / totalMatches) * 10) / 10; // Round to 1 decimal place
        
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

    return NextResponse.json(headToHeadRecords);
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Server error' }, { status: 500 });
  }
}
