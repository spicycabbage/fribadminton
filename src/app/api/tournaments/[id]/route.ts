import { NextResponse } from 'next/server';
import { ensureSchema, sql } from '@/lib/db';
import { assembleTournament } from '@/lib/tournamentRepo';

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await ensureSchema();
    
    const tournament = await assembleTournament(id);
    if (!tournament) {
      return NextResponse.json({ error: 'Tournament not found' }, { status: 404 });
    }
    
    return NextResponse.json(tournament);
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Server error' }, { status: 500 });
  }
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await ensureSchema();
    
    // Delete the tournament (cascade will handle players and matches)
    const result = await sql`delete from tournaments where id=${id}`;
    
    return NextResponse.json({ success: true, message: 'Tournament deleted successfully' });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Server error' }, { status: 500 });
  }
}