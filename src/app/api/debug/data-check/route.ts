import { NextResponse } from 'next/server';
import { ensureSchema, sql } from '@/lib/db';

export async function GET() {
  try {
    await ensureSchema();
    
    // Get all finalized tournaments with their dates
    const tournaments = await sql`
      SELECT id, date, is_finalized, 
             EXTRACT(YEAR FROM date::date) as year
      FROM tournaments 
      WHERE is_finalized = true
      ORDER BY date DESC
    `;
    
    // Get count of matches per tournament
    const matches = await sql`
      SELECT tournament_id, COUNT(*) as match_count
      FROM matches
      WHERE completed = true AND winner_team IS NOT NULL
      GROUP BY tournament_id
    `;
    
    // Get player count
    const players = await sql`
      SELECT COUNT(DISTINCT name) as player_count
      FROM players
    `;
    
    return NextResponse.json({
      tournaments: tournaments,
      matches: matches,
      playerCount: players[0]?.player_count || 0
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

