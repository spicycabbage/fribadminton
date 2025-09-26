import { NextResponse } from 'next/server';
import { ensureSchema, sql } from '@/lib/db';

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
    
    // Get all finalized tournaments
    const tournaments = await sql<{ id: string }[]>`
      SELECT id FROM tournaments 
      WHERE is_finalized = true
    `;

    if (tournaments.length === 0) {
      return NextResponse.json([]);
    }

    // Get all players from finalized tournaments
    const players = await sql<{ name: string }[]>`
      SELECT DISTINCT name FROM players 
      WHERE tournament_id IN (${tournaments.map(t => `'${t.id}'`).join(',')})
      ORDER BY name
    `;

    const playerStats: PlayerStats[] = [];

    for (const player of players) {
      let wins = 0;
      let losses = 0;

      // For each tournament, get matches where this player participated
      for (const tournament of tournaments) {
        // Get player ID in this tournament
        const playerInTournament = await sql<{ id: number }[]>`
          SELECT id FROM players 
          WHERE tournament_id = ${tournament.id} AND name = ${player.name}
          LIMIT 1
        `;

        if (playerInTournament.length === 0) continue;
        const playerId = playerInTournament[0].id;

        // Get all completed matches where this player participated
        const matches = await sql<{ winner_team: string | null; team_a_p1: number; team_a_p2: number; team_b_p1: number; team_b_p2: number }[]>`
          SELECT winner_team, team_a_p1, team_a_p2, team_b_p1, team_b_p2
          FROM matches 
          WHERE tournament_id = ${tournament.id} 
            AND completed = true 
            AND winner_team IS NOT NULL
            AND (team_a_p1 = ${playerId} OR team_a_p2 = ${playerId} OR team_b_p1 = ${playerId} OR team_b_p2 = ${playerId})
        `;

        for (const match of matches) {
          const isTeamA = match.team_a_p1 === playerId || match.team_a_p2 === playerId;
          const isTeamB = match.team_b_p1 === playerId || match.team_b_p2 === playerId;
          
          if (match.winner_team === 'A' && isTeamA) {
            wins++;
          } else if (match.winner_team === 'B' && isTeamB) {
            wins++;
          } else if ((match.winner_team === 'A' && isTeamB) || (match.winner_team === 'B' && isTeamA)) {
            losses++;
          }
        }
      }

      const totalMatches = wins + losses;
      const winPercentage = totalMatches > 0 ? Math.round((wins / totalMatches) * 100) : 0;

      playerStats.push({
        name: player.name,
        wins,
        losses,
        totalMatches,
        winPercentage
      });
    }

    // Sort by win percentage (descending), then by total matches (descending)
    playerStats.sort((a, b) => {
      if (b.winPercentage !== a.winPercentage) {
        return b.winPercentage - a.winPercentage;
      }
      return b.totalMatches - a.totalMatches;
    });

    return NextResponse.json(playerStats);
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Server error' }, { status: 500 });
  }
}
