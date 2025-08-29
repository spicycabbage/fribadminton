'use client';

import { useState, useCallback, useMemo, useEffect } from 'react';
import { Tournament, Match, validateScore } from '@/lib/gameLogic';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';

interface MatchesTabProps {
  tournament: Tournament;
  onScoreUpdate: (matchId: number, scoreA: number, scoreB: number, isEdit?: boolean) => void;
}

export default function MatchesTab({ tournament, onScoreUpdate }: MatchesTabProps) {
  const [selectedRound, setSelectedRound] = useState(tournament.currentRound);

  // Update selected round when tournament current round changes, but only if we're not editing
  useEffect(() => {
    // Don't auto-switch rounds if user is manually viewing a different round
    // Only auto-switch if we're currently on the tournament's current round
    if (selectedRound === tournament.currentRound - 1 || selectedRound === tournament.currentRound) {
      setSelectedRound(tournament.currentRound);
    }
  }, [tournament.currentRound, selectedRound]);

  const getRoundStatus = useCallback((round: number) => {
    const roundMatches = tournament.matches.filter(m => m.round === round);
    const allCompleted = roundMatches.every(m => m.completed);
    
    if (round === tournament.currentRound && !allCompleted) return 'current';
    if (allCompleted) return 'completed';
    return 'pending';
  }, [tournament.matches, tournament.currentRound]);

  const canSelectRound = useCallback((round: number) => {
    const status = getRoundStatus(round);
    return status !== 'pending';
  }, [getRoundStatus]);

  const currentRoundMatches = useMemo(() => 
    tournament.matches.filter(m => m.round === selectedRound),
    [tournament.matches, selectedRound]
  );

  return (
    <div className="p-4">
      {/* Round Navigation */}
      <div className="flex items-center justify-center mb-6">
        <button
          onClick={() => selectedRound > 1 && setSelectedRound(selectedRound - 1)}
          disabled={selectedRound === 1}
          className="p-2 disabled:opacity-30"
        >
          <ChevronLeftIcon className="w-5 h-5" />
        </button>

        <div className="flex mx-4">
          {[1, 2, 3, 4, 5, 6, 7].map((round) => {
            const status = getRoundStatus(round);
            const isSelected = round === selectedRound;
            const canSelect = canSelectRound(round);

            return (
              <button
                key={round}
                onClick={() => canSelect && setSelectedRound(round)}
                disabled={!canSelect}
                className={`round-button ${
                  isSelected 
                    ? 'ring-2 ring-blue-300' 
                    : ''
                } ${
                  status === 'current' ? 'round-current' :
                  status === 'completed' ? 'round-completed' :
                  'round-pending'
                }`}
              >
                {round}
              </button>
            );
          })}
        </div>

        <button
          onClick={() => selectedRound < 7 && setSelectedRound(selectedRound + 1)}
          disabled={selectedRound === 7}
          className="p-2 disabled:opacity-30"
        >
          <ChevronRightIcon className="w-5 h-5" />
        </button>
      </div>

      <div className="text-center mb-6">
        <h3 className="text-xl font-bold">Round {selectedRound}</h3>
      </div>

      {/* Matches */}
      <div className="space-y-4">
        {currentRoundMatches.map((match) => (
          <MatchCard
            key={match.id}
            match={match}
            tournament={tournament}
            onScoreUpdate={onScoreUpdate}
          />
        ))}
      </div>
    </div>
  );
}

interface MatchCardProps {
  match: Match;
  tournament: Tournament;
  onScoreUpdate: (matchId: number, scoreA: number, scoreB: number, isEdit?: boolean) => void;
}

function MatchCard({ match, tournament, onScoreUpdate }: MatchCardProps) {
  const [scoreA, setScoreA] = useState(match.scoreA?.toString() || '');
  const [scoreB, setScoreB] = useState(match.scoreB?.toString() || '');
  const [showValidation, setShowValidation] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const getPlayerName = useCallback((playerId: number) => {
    return tournament.players.find(p => p.id === playerId)?.name || `P${playerId}`;
  }, [tournament.players]);

  const handleSubmit = useCallback(() => {
    const numScoreA = parseInt(scoreA) || 0;
    const numScoreB = parseInt(scoreB) || 0;

    if (!validateScore(numScoreA, numScoreB)) {
      setShowValidation(true);
      setTimeout(() => setShowValidation(false), 3000);
      return;
    }

    // Determine if this is an edit: match was already completed OR we're in editing mode
    const isEditOperation = match.completed || isEditing;
    
    onScoreUpdate(match.id, numScoreA, numScoreB, isEditOperation);
    setIsEditing(false);
  }, [scoreA, scoreB, match.id, onScoreUpdate, isEditing, match.completed]);

  const handleEdit = useCallback(() => {
    setIsEditing(true);
    setScoreA(match.scoreA?.toString() || '');
    setScoreB(match.scoreB?.toString() || '');
  }, [match.scoreA, match.scoreB]);

  const handleCancelEdit = useCallback(() => {
    setIsEditing(false);
    setScoreA(match.scoreA?.toString() || '');
    setScoreB(match.scoreB?.toString() || '');
    setShowValidation(false);
  }, [match.scoreA, match.scoreB]);

  const isValid = useMemo(() => {
    const numScoreA = parseInt(scoreA) || 0;
    const numScoreB = parseInt(scoreB) || 0;
    return validateScore(numScoreA, numScoreB);
  }, [scoreA, scoreB]);

  const isCompleted = match.completed;
  const containerClass = isCompleted 
    ? 'bg-green-100 border-2 border-green-400 rounded-xl p-2 mb-4' 
    : 'bg-white border-2 border-gray-200 rounded-xl p-2 mb-4';

  return (
    <div className={containerClass}>
      {/* Team A */}
      <div className="team-a mb-3 p-4 rounded-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-1 flex-1 mr-2">
            <span className="text-xs font-medium text-blue-800 whitespace-nowrap">Team A</span>
            <div className="flex items-center space-x-2 ml-1">
              <span className="player-button">
                {getPlayerName(match.teamA.player1)}
              </span>
              <span className="text-gray-500 text-sm">-</span>
              <span className="player-button">
                {getPlayerName(match.teamA.player2)}
              </span>
            </div>
          </div>
          <div className="text-3xl font-bold text-right min-w-[80px]">
            {isCompleted && !isEditing ? match.scoreA : (
              <input
                type="number"
                value={scoreA}
                onChange={(e) => setScoreA(e.target.value)}
                className="w-16 h-12 text-center text-2xl font-bold border-2 border-gray-300 rounded-md focus:outline-none focus:border-blue-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                min="0"
                max="21"
                inputMode="numeric"
                autoComplete="off"
                placeholder="0"
              />
            )}
          </div>
        </div>
      </div>

      {/* Team B */}
      <div className="team-b mb-4 p-4 rounded-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-1 flex-1 mr-2">
            <span className="text-xs font-medium text-red-800 whitespace-nowrap">Team B</span>
            <div className="flex items-center space-x-2 ml-1">
              <span className="player-button bg-red-600">
                {getPlayerName(match.teamB.player1)}
              </span>
              <span className="text-gray-500 text-sm">-</span>
              <span className="player-button bg-red-600">
                {getPlayerName(match.teamB.player2)}
              </span>
            </div>
          </div>
          <div className="text-3xl font-bold text-right min-w-[80px]">
            {isCompleted && !isEditing ? match.scoreB : (
              <input
                type="number"
                value={scoreB}
                onChange={(e) => setScoreB(e.target.value)}
                className="w-16 h-12 text-center text-2xl font-bold border-2 border-gray-300 rounded-md focus:outline-none focus:border-blue-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                min="0"
                max="21"
                inputMode="numeric"
                autoComplete="off"
                placeholder="0"
              />
            )}
          </div>
        </div>
      </div>

      {/* Validation Message */}
      {showValidation && (
        <div className="mb-4 p-3 bg-red-100 border border-red-400 rounded text-red-700 text-sm">
          <p className="font-semibold">Invalid Score!</p>
          <p>One team must score exactly 21 points, the other must score less than 21.</p>
        </div>
      )}

      {/* Submit Button */}
      {(!isCompleted || isEditing) && (
        <div className="space-y-2">
          <button
            onClick={handleSubmit}
            disabled={!isValid}
            className={`w-full py-3 rounded-lg font-semibold transition-colors ${
              isValid
                ? 'bg-black text-white hover:bg-gray-800 active:bg-gray-900'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            {isValid ? (isEditing ? 'Update Score' : 'Submit') : 'Enter Valid Scores'}
          </button>
          
          {isEditing && (
            <button
              onClick={handleCancelEdit}
              className="w-full py-2 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300 transition-colors"
            >
              Cancel
            </button>
          )}
        </div>
      )}

      {isCompleted && !isEditing && (
        <div className="flex items-center justify-between w-full py-3 bg-green-500 text-white rounded-lg font-semibold">
          <button
            onClick={handleEdit}
            className="flex items-center justify-center w-8 h-8 bg-green-600 hover:bg-green-700 rounded-md transition-colors ml-2"
            title="Edit scores"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </button>
          <span className="flex-1 text-center">✓ Match Completed</span>
          <div className="w-8"></div> {/* Spacer for centering */}
        </div>
      )}
    </div>
  );
}
