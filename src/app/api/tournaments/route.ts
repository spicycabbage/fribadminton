import { NextRequest, NextResponse } from 'next/server';
import { ensureSchema, sql } from '@/lib/db';
import { createTournament } from '@/lib/gameLogic';

export async function POST(req: NextRequest) {
  try {
    await ensureSchema();
    const { accessCode, playerNames } = await req.json();
    if (!accessCode || !Array.isArray(playerNames) || playerNames.length !== 8) {
      return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
    }

    // Enforce only one active tournament at a time
    const active = await sql<{ c: number }[]>`select count(*)::int as c from tournaments where is_finalized=false`;
    if ((active[0]?.c || 0) > 0) {
      return NextResponse.json({ error: 'active_tournament_exists' }, { status: 409 });
    }

    const t = createTournament(accessCode, playerNames);

    await sql`insert into tournaments (id, access_code, date, current_round, is_finalized)
      values (${t.id}, ${t.accessCode}, ${t.date}, ${t.currentRound}, ${t.isFinalized})`;

    for (const p of t.players) {
      await sql`insert into players (tournament_id, id, name, total_score)
        values (${t.id}, ${p.id}, ${p.name}, ${p.totalScore})`;
    }

    for (const m of t.matches) {
      await sql`insert into matches (
        tournament_id, id, round, team_a_p1, team_a_p2, team_b_p1, team_b_p2,
        score_a, score_b, completed
      ) values (
        ${t.id}, ${m.id}, ${m.round}, ${m.teamA.player1}, ${m.teamA.player2}, ${m.teamB.player1}, ${m.teamB.player2},
        ${m.scoreA}, ${m.scoreB}, ${m.completed}
      )`;
    }

    return NextResponse.json(t);
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Server error' }, { status: 500 });
  }
}


