import { NextResponse } from 'next/server';
import { ensureSchema, sql, DbTournamentRow } from '@/lib/db';
import { Tournament } from '@/lib/gameLogic';

export async function GET() {
  try {
    await ensureSchema();
    
    // Get all finalized tournaments ordered by creation date (newest first)
    const rows = await sql<DbTournamentRow[]>`
      SELECT * FROM tournaments 
      WHERE is_finalized = true 
      ORDER BY created_at DESC
    `;

    // Convert to Tournament objects with minimal data needed for history
    const tournaments: Tournament[] = rows.map((tr: DbTournamentRow) => ({
      id: tr.id,
      accessCode: tr.access_code,
      date: tr.date,
      players: [], // We'll load this separately if needed
      matches: [], // We'll load this separately if needed
      currentRound: tr.current_round,
      isFinalized: tr.is_finalized,
      createdAt: new Date(tr.created_at)
    }));

    // For each tournament, get all players (for full rankings when expanded)
    for (const tournament of tournaments) {
      const players = await sql<{ id: number; name: string; total_score: number }[]>`
        SELECT * FROM players 
        WHERE tournament_id = ${tournament.id} 
        ORDER BY total_score DESC, id ASC
      `;
      
      if (players.length > 0) {
        // Convert all players to proper format (needed for full rankings)
        tournament.players = players.map((p: { id: number; name: string; total_score: number }) => ({
          id: p.id,
          name: p.name,
          scores: new Array(7).fill(0), // Not needed for history display
          totalScore: p.total_score
        }));
      }
    }

    return NextResponse.json(tournaments);
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Server error' }, { status: 500 });
  }
}
