import { NextResponse } from 'next/server';
import { ensureSchema, sql } from '@/lib/db';

export async function POST(_: Request, context: any) {
  const { params } = context || { params: { id: '' } };
  try {
    await ensureSchema();
    
    // Before finalizing, ensure all player total_scores are correct
    const players = await sql<any[]>`select id, name from players where tournament_id=${params.id}`;
    for (const p of players) {
      // Sum scores for this player across all matches
      const rows = await sql<any[]>`
        select coalesce(sum(
          case when (team_a_p1=${p.id} or team_a_p2=${p.id}) then score_a
               when (team_b_p1=${p.id} or team_b_p2=${p.id}) then score_b
               else 0 end),0) as total
        from matches where tournament_id=${params.id} and (score_a is not null and score_b is not null)`;
      const total = Number(rows[0]?.total || 0);
      console.log(`Player ${p.name} (ID: ${p.id}) calculated total: ${total}`);
      await sql`update players set total_score=${total} where tournament_id=${params.id} and id=${p.id}`;
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


