import { NextResponse } from 'next/server';
import { ensureSchema, sql } from '@/lib/db';

export async function GET(_: Request, context: any) {
  const { params } = context || { params: { id: '' } };
  try {
    await ensureSchema();
    
    const players = await sql<any[]>`select * from players where tournament_id=${params.id}`;
    const matches = await sql<any[]>`select * from matches where tournament_id=${params.id}`;
    
    return NextResponse.json({
      players,
      matches: matches.map(m => ({
        id: m.id,
        round: m.round,
        team_a: `${m.team_a_p1}-${m.team_a_p2}`,
        team_b: `${m.team_b_p1}-${m.team_b_p2}`,
        score_a: m.score_a,
        score_b: m.score_b,
        completed: m.completed
      }))
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Server error' }, { status: 500 });
  }
}
