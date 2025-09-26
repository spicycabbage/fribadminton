import { NextResponse } from 'next/server';
import { ensureSchema, sql, DbTournamentRow } from '@/lib/db';
import { Tournament } from '@/lib/gameLogic';
import { assembleTournament } from '@/lib/tournamentRepo';

export async function GET() {
  try {
    await ensureSchema();
    
    // Get all finalized tournaments ordered by creation date (newest first)
    const rows = await sql<DbTournamentRow[]>`
      SELECT * FROM tournaments 
      WHERE is_finalized = true 
      ORDER BY created_at DESC
    `;

    // Use assembleTournament to get complete tournament data (same as RankTab)
    const tournaments: Tournament[] = [];
    for (const row of rows) {
      const tournament = await assembleTournament(row.id);
      if (tournament) {
        tournaments.push(tournament);
      }
    }

    return NextResponse.json(tournaments);
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Server error' }, { status: 500 });
  }
}
