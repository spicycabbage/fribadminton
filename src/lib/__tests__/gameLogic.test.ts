import { 
  createTournament, 
  validateScore, 
  updateMatchScore, 
  getRankedPlayers,
  isTournamentComplete,
  ROUND_MATCHUPS 
} from '../gameLogic';

describe('Game Logic', () => {
  const playerNames = ['Alice', 'Bob', 'Charlie', 'David', 'Eve', 'Frank', 'Grace', 'Henry'];

  describe('createTournament', () => {
    it('should create a tournament with 8 players and 14 matches', () => {
      const tournament = createTournament('123', playerNames);
      
      expect(tournament.players).toHaveLength(8);
      expect(tournament.matches).toHaveLength(14); // 7 rounds × 2 matches
      expect(tournament.currentRound).toBe(1);
      expect(tournament.accessCode).toBe('123');
    });

    it('should initialize all player scores to 0', () => {
      const tournament = createTournament('123', playerNames);
      
      tournament.players.forEach(player => {
        expect(player.scores).toEqual([0, 0, 0, 0, 0, 0, 0]);
        expect(player.totalScore).toBe(0);
      });
    });
  });

  describe('validateScore', () => {
    it('should accept valid scores', () => {
      expect(validateScore(21, 15)).toBe(true);
      expect(validateScore(10, 21)).toBe(true);
      expect(validateScore(21, 0)).toBe(true);
      expect(validateScore(0, 21)).toBe(true);
    });

    it('should reject invalid scores', () => {
      expect(validateScore(20, 19)).toBe(false);
      expect(validateScore(21, 21)).toBe(false);
      expect(validateScore(22, 15)).toBe(false);
      expect(validateScore(15, 22)).toBe(false);
      expect(validateScore(-1, 21)).toBe(false);
    });
  });

  describe('updateMatchScore', () => {
    it('should update player scores correctly', () => {
      const tournament = createTournament('123', playerNames);
      const firstMatch = tournament.matches[0];
      
      const updatedTournament = updateMatchScore(tournament, firstMatch.id, 21, 15);
      
      // Check that the match was updated
      const updatedMatch = updatedTournament.matches[0];
      expect(updatedMatch.scoreA).toBe(21);
      expect(updatedMatch.scoreB).toBe(15);
      expect(updatedMatch.completed).toBe(true);
      
      // Check that player scores were updated
      const player1 = updatedTournament.players.find(p => p.id === firstMatch.teamA.player1);
      const player2 = updatedTournament.players.find(p => p.id === firstMatch.teamA.player2);
      const player3 = updatedTournament.players.find(p => p.id === firstMatch.teamB.player1);
      const player4 = updatedTournament.players.find(p => p.id === firstMatch.teamB.player2);
      
      expect(player1?.scores[0]).toBe(21);
      expect(player2?.scores[0]).toBe(21);
      expect(player3?.scores[0]).toBe(15);
      expect(player4?.scores[0]).toBe(15);
    });
  });

  describe('getRankedPlayers', () => {
    it('should rank players by total score', () => {
      const tournament = createTournament('123', playerNames);
      
      // Manually set some scores
      tournament.players[0].scores = [21, 21, 15, 10, 21, 18, 12];
      tournament.players[0].totalScore = 118;
      tournament.players[1].scores = [15, 18, 21, 21, 15, 21, 21];
      tournament.players[1].totalScore = 132;
      
      const ranked = getRankedPlayers(tournament);
      
      expect(ranked[0].name).toBe('Bob'); // Higher score
      expect(ranked[1].name).toBe('Alice'); // Lower score
    });
  });

  describe('ROUND_MATCHUPS', () => {
    it('should have 7 rounds with 2 matches each', () => {
      expect(ROUND_MATCHUPS).toHaveLength(7);
      ROUND_MATCHUPS.forEach(round => {
        expect(round).toHaveLength(2);
      });
    });

    it('should ensure each player partners with every other player exactly once', () => {
      const partnerships: Set<string> = new Set();
      
      ROUND_MATCHUPS.forEach(round => {
        round.forEach(match => {
          const teamA = match.teamA.sort().join('-');
          const teamB = match.teamB.sort().join('-');
          
          expect(partnerships.has(teamA)).toBe(false);
          expect(partnerships.has(teamB)).toBe(false);
          
          partnerships.add(teamA);
          partnerships.add(teamB);
        });
      });
      
      // Should have exactly 28 unique partnerships (8 choose 2)
      expect(partnerships.size).toBe(28);
    });
  });
});
