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

    // For each tournament, get players with their STORED total_score (historical snapshot)
    const tournaments: Tournament[] = [];
    for (const row of rows) {
      const players = await sql<{ id: number; name: string; total_score: number }[]>`
        SELECT * FROM players 
        WHERE tournament_id = ${row.id} 
        ORDER BY total_score DESC, id ASC
      `;
      
      const tournament: Tournament = {
        id: row.id,
        accessCode: row.access_code,
        date: row.date,
        players: players.map((p: { id: number; name: string; total_score: number }) => ({
          id: p.id,
          name: p.name,
          scores: new Array(7).fill(0), // Not needed for history display
          totalScore: p.total_score // Use the STORED score, don't recalculate
        })),
        matches: [], // Not needed for history display
        currentRound: row.current_round,
        isFinalized: row.is_finalized,
        createdAt: new Date(row.created_at)
      };
      
      tournaments.push(tournament);
    }

    return NextResponse.json(tournaments);
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Server error' }, { status: 500 });
  }
}
