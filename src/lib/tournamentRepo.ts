import { ensureSchema, sql, DbTournamentRow } from '@/lib/db';
import { Tournament } from '@/lib/gameLogic';

export async function assembleTournament(id: string): Promise<Tournament | null> {
  await ensureSchema();
  const rows = await sql<DbTournamentRow[]>`select * from tournaments where id=${id} limit 1`;
  const tr = rows[0];
  if (!tr) return null;
  const players = await sql<any[]>`select * from players where tournament_id=${id} order by id asc`;
  const matches = await sql<any[]>`select * from matches where tournament_id=${id} order by id asc`;
  return {
    id: tr.id,
    accessCode: tr.access_code,
    date: tr.date,
    players: players.map(p => ({ id: p.id, name: p.name, scores: new Array(7).fill(0), totalScore: p.total_score })),
    matches: matches.map(m => ({
      id: m.id,
      round: m.round,
      teamA: { player1: m.team_a_p1, player2: m.team_a_p2 },
      teamB: { player1: m.team_b_p1, player2: m.team_b_p2 },
      scoreA: m.score_a,
      scoreB: m.score_b,
      completed: m.completed,
    })),
    currentRound: tr.current_round,
    isFinalized: tr.is_finalized,
    createdAt: new Date(tr.created_at),
  } as Tournament;
}


