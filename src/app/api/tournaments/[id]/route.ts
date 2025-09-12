import { NextResponse } from 'next/server';
import { assembleTournament } from '@/lib/tournamentRepo';

// helper moved to src/lib/tournamentRepo.ts to satisfy Next route export rules

export async function GET(_: Request, context: any) {
  try {
    const { params } = context || { params: { id: '' } };
    const t = await assembleTournament(params.id);
    if (!t) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json(t);
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Server error' }, { status: 500 });
  }
}


