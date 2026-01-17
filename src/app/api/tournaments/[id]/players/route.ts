import { NextResponse } from 'next/server';
import { ensureSchema, sql } from '@/lib/db';
import { assembleTournament } from '@/lib/tournamentRepo';

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await ensureSchema();
    
    // Verify tournament exists first
    const [tournament] = await sql`select id from tournaments where id=${id} limit 1`;
    if (!tournament) {
      return NextResponse.json({ error: 'Tournament not found' }, { status: 404 });
    }

    const { playerNames } = await req.json();
    if (!Array.isArray(playerNames) || playerNames.length !== 8) {
      return NextResponse.json({ error: 'Invalid playerNames' }, { status: 400 });
    }

    // Update each player's name by id 1..8
    for (let i = 0; i < 8; i++) {
      const idNum = i + 1;
      await sql`update players set name=${playerNames[i]} where tournament_id=${id} and id=${idNum}`;
    }

    const updated = await assembleTournament(id);
    if (!updated) {
      return NextResponse.json({ error: 'Failed to fetch updated tournament' }, { status: 500 });
    }
    return NextResponse.json(updated);
  } catch (e: any) {
    console.error('Error updating players:', e);
    return NextResponse.json({ error: e.message || 'Server error' }, { status: 500 });
  }
}


