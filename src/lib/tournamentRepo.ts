import { ensureSchema, sql, DbTournamentRow } from '@/lib/db';
import { Tournament } from '@/lib/gameLogic';

export async function assembleTournament(id: string): Promise<Tournament | null> {
  await ensureSchema();
  const rows = await sql<DbTournamentRow[]>`select * from tournaments where id=${id} limit 1`;
  const tr = rows[0];
  if (!tr) return null;
  const players = await sql<{ id: number; name: string; total_score: number }[]>`select * from players where tournament_id=${id} order by id asc`;
  const matches = await sql<{
    id: number;
    round: number;
    team_a_p1: number;
    team_a_p2: number;
    team_b_p1: number;
    team_b_p2: number;
    score_a: number | null;
    score_b: number | null;
    completed: boolean;
    winner_team: string | null;
  }[]>`select * from matches where tournament_id=${id} order by id asc`;

  // Build per-player, per-round scores from matches
  const playerScoresByRound: Record<number, number[]> = {};
  players.forEach((p: { id: number }) => { playerScoresByRound[p.id] = new Array(7).fill(0); });
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
  return {
    id: tr.id,
    accessCode: tr.access_code,
    date: tr.date,
    players: players.map((p: { id: number; name: string; total_score: number }) => ({ id: p.id, name: p.name, scores: playerScoresByRound[p.id] || new Array(7).fill(0), totalScore: p.total_score })),
    matches: matches.map((m: { id: number; round: number; team_a_p1: number; team_a_p2: number; team_b_p1: number; team_b_p2: number; score_a: number | null; score_b: number | null; completed: boolean }) => ({
      id: m.id,
      round: m.round,
      teamA: { player1: m.team_a_p1, player2: m.team_a_p2 },
      teamB: { player1: m.team_b_p1, player2: m.team_b_p2 },
      scoreA: m.score_a,
      scoreB: m.score_b,
      completed: m.completed,
      winnerTeam: (m.winner_team === 'A' || m.winner_team === 'B') ? (m.winner_team as 'A' | 'B') : null,
    })),
    currentRound: tr.current_round,
    isFinalized: tr.is_finalized,
    createdAt: new Date(tr.created_at),
  } as Tournament;
}


