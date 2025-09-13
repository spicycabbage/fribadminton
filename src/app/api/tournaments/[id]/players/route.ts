import { NextResponse } from 'next/server';
import { ensureSchema, sql } from '@/lib/db';
import { assembleTournament } from '@/lib/tournamentRepo';

export async function POST(req: Request, context: any) {
  const { params } = context || { params: { id: '' } };
  try {
    await ensureSchema();
    const { playerNames } = await req.json();
    if (!Array.isArray(playerNames) || playerNames.length !== 8) {
      return NextResponse.json({ error: 'Invalid playerNames' }, { status: 400 });
    }

    // Update each player's name by id 1..8
    for (let i = 0; i < 8; i++) {
      const idNum = i + 1;
      await sql`update players set name=${playerNames[i]} where tournament_id=${params.id} and id=${idNum}`;
    }

    const updated = await assembleTournament(params.id);
    return NextResponse.json(updated);
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Server error' }, { status: 500 });
  }
}


