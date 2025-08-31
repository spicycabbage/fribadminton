export interface Player {
  id: number;
  name: string;
  scores: number[];
  totalScore: number;
}

export interface Match {
  id: number;
  round: number;
  teamA: { player1: number; player2: number };
  teamB: { player1: number; player2: number };
  scoreA: number | null;
  scoreB: number | null;
  completed: boolean;
}

export interface Tournament {
  id: string;
  accessCode: string;
  date: string;
  players: Player[];
  matches: Match[];
  currentRound: number;
  isFinalized: boolean;
  createdAt: Date;
}

// Game logic based on the provided chart
export const ROUND_MATCHUPS = [
  // Round 1
  [
    { teamA: [8, 1], teamB: [2, 6] },
    { teamA: [7, 5], teamB: [3, 4] }
  ],
  // Round 2
  [
    { teamA: [8, 2], teamB: [3, 7] },
    { teamA: [1, 6], teamB: [4, 5] }
  ],
  // Round 3
  [
    { teamA: [8, 3], teamB: [4, 1] },
    { teamA: [2, 7], teamB: [5, 6] }
  ],
  // Round 4
  [
    { teamA: [8, 4], teamB: [5, 2] },
    { teamA: [3, 1], teamB: [6, 7] }
  ],
  // Round 5
  [
    { teamA: [8, 5], teamB: [6, 3] },
    { teamA: [4, 2], teamB: [7, 1] }
  ],
  // Round 6
  [
    { teamA: [8, 6], teamB: [7, 4] },
    { teamA: [5, 3], teamB: [1, 2] }
  ],
  // Round 7
  [
    { teamA: [8, 7], teamB: [1, 5] },
    { teamA: [6, 4], teamB: [2, 3] }
  ]
];

export const DEFAULT_PLAYER_NAMES = [
  'Jason', 'JasonNg', 'Mike', 'Kim', 'Alex', 'Ray', 'Steven', 'Josh',
  'Justin', 'Stevie', 'Eddie', 'Yorkie', 'Tonny', 'Wilson', 'Victor',
  'Ian', 'Trevor', 'Jim', 'Peter', 'Ben', 'Andrew', 'Dan', 'Yves', 'Brian'
];

export function createTournament(accessCode: string, playerNames: string[]): Tournament {
  const players: Player[] = playerNames.map((name, index) => ({
    id: index + 1,
    name,
    scores: new Array(7).fill(0),
    totalScore: 0
  }));

  const matches: Match[] = [];
  let matchId = 1;

  ROUND_MATCHUPS.forEach((roundMatches, roundIndex) => {
    roundMatches.forEach((matchup) => {
      matches.push({
        id: matchId++,
        round: roundIndex + 1,
        teamA: { 
          player1: matchup.teamA[0], 
          player2: matchup.teamA[1] 
        },
        teamB: { 
          player1: matchup.teamB[0], 
          player2: matchup.teamB[1] 
        },
        scoreA: null,
        scoreB: null,
        completed: false
      });
    });
  });

  return {
    id: generateTournamentId(),
    accessCode,
    // Store date as local YYYY-MM-DD to avoid timezone shifts later
    date: (() => {
      const now = new Date();
      const y = now.getFullYear();
      const m = String(now.getMonth() + 1).padStart(2, '0');
      const d = String(now.getDate()).padStart(2, '0');
      return `${y}-${m}-${d}`;
    })(),
    players,
    matches,
    currentRound: 1,
    isFinalized: false,
    createdAt: new Date()
  };
}

export function validateScore(scoreA: number, scoreB: number): boolean {
  // One team must get exactly 21, the other must be less than 21
  if (scoreA < 0 || scoreB < 0 || scoreA > 21 || scoreB > 21) return false;
  if (scoreA === 21 && scoreB < 21) return true;
  if (scoreB === 21 && scoreA < 21) return true;
  return false;
}

export function updateMatchScore(
  tournament: Tournament, 
  matchId: number, 
  scoreA: number, 
  scoreB: number,
  isEdit: boolean = false
): Tournament {
  const updatedTournament = { ...tournament };
  const match = updatedTournament.matches.find(m => m.id === matchId);
  
  if (!match || !validateScore(scoreA, scoreB)) {
    return tournament;
  }

  // Update match scores
  match.scoreA = scoreA;
  match.scoreB = scoreB;
  match.completed = true;

  // Update player scores
  const roundIndex = match.round - 1;
  
  // Team A players get scoreA
  const playerA1 = updatedTournament.players.find(p => p.id === match.teamA.player1);
  const playerA2 = updatedTournament.players.find(p => p.id === match.teamA.player2);
  if (playerA1) playerA1.scores[roundIndex] = scoreA;
  if (playerA2) playerA2.scores[roundIndex] = scoreA;

  // Team B players get scoreB  
  const playerB1 = updatedTournament.players.find(p => p.id === match.teamB.player1);
  const playerB2 = updatedTournament.players.find(p => p.id === match.teamB.player2);
  if (playerB1) playerB1.scores[roundIndex] = scoreB;
  if (playerB2) playerB2.scores[roundIndex] = scoreB;

  // Only advance current round if this is NOT an edit
  if (!isEdit) {
    // Check if round is completed
    const roundMatches = updatedTournament.matches.filter(m => m.round === match.round);
    const roundCompleted = roundMatches.every(m => m.completed);

    if (roundCompleted && match.round < 7) {
      updatedTournament.currentRound = match.round + 1;
    }
  }

  // Update total scores
  updatedTournament.players.forEach(player => {
    player.totalScore = player.scores.reduce((sum, score) => sum + score, 0);
  });

  return updatedTournament;
}

export function getRankedPlayers(tournament: Tournament): Player[] {
  return [...tournament.players]
    .sort((a, b) => b.totalScore - a.totalScore)
    .map((player, index) => ({ ...player, rank: index + 1 }));
}

export function generateTournamentId(): string {
  return Math.random().toString(36).substr(2, 9);
}

export function isTournamentComplete(tournament: Tournament): boolean {
  return tournament.matches.every(match => match.completed);
}
