import { NextResponse } from 'next/server';
import { ensureSchema, sql } from '@/lib/db';

export async function POST(_: Request, context: any) {
  const { params } = context || { params: { id: '' } };
  try {
    await ensureSchema();
    
    // Before finalizing, use the same logic as assembleTournament to calculate correct scores
    const players = await sql<{ id: number; name: string }[]>`select id, name from players where tournament_id=${params.id}`;
    const matches = await sql<{ id: number; round: number; team_a_p1: number; team_a_p2: number; team_b_p1: number; team_b_p2: number; score_a: number | null; score_b: number | null; completed: boolean }[]>`select * from matches where tournament_id=${params.id} order by id asc`;

    // Build per-player, per-round scores from matches (same logic as assembleTournament)
    const playerScoresByRound: Record<number, number[]> = {};
    players.forEach((p) => { playerScoresByRound[p.id] = new Array(7).fill(0); });
    
    for (const m of matches) {
      const r = Math.max(1, Math.min(7, Number(m.round || 1))) - 1;
      if (m.score_a != null) {
        if (playerScoresByRound[m.team_a_p1]) playerScoresByRound[m.team_a_p1][r] = m.score_a;
        if (playerScoresByRound[m.team_a_p2]) playerScoresByRound[m.team_a_p2][r] = m.score_a;
      }
      if (m.score_b != null) {
        if (playerScoresByRound[m.team_b_p1]) playerScoresByRound[m.team_b_p1][r] = m.score_b;
        if (playerScoresByRound[m.team_b_p2]) playerScoresByRound[m.team_b_p2][r] = m.score_b;
      }
    }

    // Calculate total scores and save to database
    for (const p of players) {
      const scores = playerScoresByRound[p.id] || new Array(7).fill(0);
      const totalScore = scores.reduce((sum, score) => sum + score, 0);
      console.log(`Player ${p.name} (ID: ${p.id}) calculated total: ${totalScore}`);
      await sql`update players set total_score=${totalScore} where tournament_id=${params.id} and id=${p.id}`;
    }
    
    // Now finalize the tournament
    await sql`update tournaments set is_finalized=true where id=${params.id}`;
    const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || ''}/api/tournaments/${params.id}`, { cache: 'no-store' });
    const updated = await res.json();
    return NextResponse.json(updated);
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Server error' }, { status: 500 });
  }
}


