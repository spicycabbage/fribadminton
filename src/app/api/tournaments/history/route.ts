import { NextResponse } from 'next/server';
import { ensureSchema, sql, DbTournamentRow } from '@/lib/db';
import { Tournament } from '@/lib/gameLogic';
import { assembleTournament } from '@/lib/tournamentRepo';

export async function GET() {
  try {
    await ensureSchema();
    
    // Get all finalized tournaments ordered by tournament date (newest first)
    const rows = await sql<DbTournamentRow[]>`
      SELECT * FROM tournaments 
      WHERE is_finalized = true 
      ORDER BY date DESC
    `;

    if (rows.length === 0) {
      return NextResponse.json([]);
    }

    const tournamentIds = rows.map((r: DbTournamentRow) => r.id);

    // Batch load all players and matches for these tournaments (2 queries instead of N*2)
    const [allPlayers, allMatches] = await Promise.all([
      sql<{ tournament_id: string; id: number; name: string; total_score: number }[]>`
        SELECT * FROM players 
        WHERE tournament_id = ANY(${tournamentIds}) 
        ORDER BY tournament_id, id
      `,
      sql<{ tournament_id: string; id: number; round: number; team_a_p1: number; team_a_p2: number; team_b_p1: number; team_b_p2: number; score_a: number | null; score_b: number | null; completed: boolean; winner_team?: string | null }[]>`
        SELECT * FROM matches 
        WHERE tournament_id = ANY(${tournamentIds}) 
        ORDER BY tournament_id, id
      `
    ]);

    // Group by tournament_id
    const playersByTournament = new Map<string, typeof allPlayers>();
    const matchesByTournament = new Map<string, typeof allMatches>();
    
    allPlayers.forEach((p: { tournament_id: string; id: number; name: string; total_score: number }) => {
      if (!playersByTournament.has(p.tournament_id)) {
        playersByTournament.set(p.tournament_id, []);
      }
      playersByTournament.get(p.tournament_id)!.push(p);
    });

    allMatches.forEach((m: { tournament_id: string; id: number; round: number; team_a_p1: number; team_a_p2: number; team_b_p1: number; team_b_p2: number; score_a: number | null; score_b: number | null; completed: boolean; winner_team?: string | null }) => {
      if (!matchesByTournament.has(m.tournament_id)) {
        matchesByTournament.set(m.tournament_id, []);
      }
      matchesByTournament.get(m.tournament_id)!.push(m);
    });

    // Build tournaments
    const tournaments: Tournament[] = rows.map(tr => {
      const players = playersByTournament.get(tr.id) || [];
      const matches = matchesByTournament.get(tr.id) || [];

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
        players: players.map((p: { id: number; name: string; total_score: number }) => {
          const scores = playerScoresByRound[p.id] || new Array(7).fill(0);
          const calculatedTotal = scores.reduce((sum: number, score: number) => sum + score, 0);
          return { id: p.id, name: p.name, scores, totalScore: calculatedTotal };
        }),
        matches: matches.map((m: { id: number; round: number; team_a_p1: number; team_a_p2: number; team_b_p1: number; team_b_p2: number; score_a: number | null; score_b: number | null; completed: boolean; winner_team?: string | null }) => ({
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
    });

    return NextResponse.json(tournaments);
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Server error' }, { status: 500 });
  }
}
