import { NextRequest, NextResponse } from 'next/server';
import { ensureSchema, sql } from '@/lib/db';
import { validateScore } from '@/lib/gameLogic';

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await ensureSchema();
    const { matchId, scoreA, scoreB } = await req.json();
    if (!validateScore(Number(scoreA), Number(scoreB))) {
      return NextResponse.json({ error: 'Invalid score' }, { status: 400 });
    }

    const [match] = await sql<any[]>`select * from matches where tournament_id=${params.id} and id=${matchId} limit 1`;
    if (!match) return NextResponse.json({ error: 'Match not found' }, { status: 404 });

    // Update match
    await sql`update matches set score_a=${scoreA}, score_b=${scoreB}, completed=true where tournament_id=${params.id} and id=${matchId}`;

    // Update player totals for that round
    const round = match.round as number;
    // Sum totals per player by summing their played matches in DB
    // For simplicity, recompute totals by summing across rounds using matches table.
    // Fetch all players
    const players = await sql<any[]>`select id from players where tournament_id=${params.id}`;
    for (const p of players) {
      // Sum scores for this player across all matches
      const rows = await sql<any[]>`
        select coalesce(sum(
          case when (team_a_p1=${p.id} or team_a_p2=${p.id}) then score_a
               when (team_b_p1=${p.id} or team_b_p2=${p.id}) then score_b
               else 0 end),0) as total
        from matches where tournament_id=${params.id}`;
      const total = Number(rows[0]?.total || 0);
      await sql`update players set total_score=${total} where tournament_id=${params.id} and id=${p.id}`;
    }

    // Check if round is complete and possibly advance current round
    const currentRoundMatches = await sql<any[]>`select completed from matches where tournament_id=${params.id} and round=${round}`;
    const roundCompleted = currentRoundMatches.every(m => m.completed);
    if (roundCompleted) {
      const [trow] = await sql<any[]>`select current_round from tournaments where id=${params.id}`;
      const currentRound = Number(trow?.current_round || 1);
      if (currentRound === round && currentRound < 7) {
        await sql`update tournaments set current_round=${currentRound + 1} where id=${params.id}`;
      }
    }

    // Return updated tournament
    const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || ''}/api/tournaments/${params.id}`, { cache: 'no-store' });
    const updated = await res.json();
    return NextResponse.json(updated);
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Server error' }, { status: 500 });
  }
}


