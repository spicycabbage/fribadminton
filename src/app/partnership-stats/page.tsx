'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface PartnershipStats {
  totalGames: number;
  wins: number;
  losses: number;
  winPercentage: number;
  avgMarginVictory: number;
  avgMarginDefeat: number;
}

interface PartnershipMatch {
  tournamentId: string;
  date: string;
  round: number;
  partnerScore: number;
  opponentScore: number;
  won: boolean;
}

interface PartnershipData {
  exists: boolean;
  message?: string;
  player1?: string;
  player2?: string;
  stats?: PartnershipStats;
  matches?: PartnershipMatch[];
}

export default function PartnershipStatsPage() {
  const [players, setPlayers] = useState<string[]>([]);
  const [player1, setPlayer1] = useState<string>('');
  const [player2, setPlayer2] = useState<string>('');
  const [partnershipData, setPartnershipData] = useState<PartnershipData | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  // Fetch all players on component mount
  useEffect(() => {
    const fetchPlayers = async () => {
      try {
        const response = await fetch('/api/analytics/partnership-stats');
        if (response.ok) {
          const data = await response.json();
          setPlayers(data.players || []);
        }
      } catch (err) {
        console.error('Failed to fetch players:', err);
      }
    };

    fetchPlayers();
  }, []);

  const handleSearch = async () => {
    if (!player1 || !player2) {
      setError('Please select both players');
      return;
    }

    if (player1 === player2) {
      setError('Players cannot be the same person');
      return;
    }

    setLoading(true);
    setError('');
    setPartnershipData(null);

    try {
      const response = await fetch(
        `/api/analytics/partnership-stats?player1=${encodeURIComponent(player1)}&player2=${encodeURIComponent(player2)}`
      );
      
      if (response.ok) {
        const data = await response.json();
        setPartnershipData(data);
      } else {
        setError('Failed to fetch partnership statistics');
      }
    } catch (err) {
      setError('An error occurred while fetching data');
    } finally {
      setLoading(false);
    }
  };

  const availablePlayer2Options = players.filter(p => p !== player1);

  return (
    <div className="mobile-container bg-blue-600 flex flex-col min-h-screen safe-area-inset-top safe-area-inset-bottom">
      {/* Header */}
      <div className="tournament-card w-[92%] mx-auto mt-4 mb-6">
        <div className="flex items-center justify-between mb-6">
          <Link 
            href="/" 
            className="text-blue-600 hover:text-blue-800 font-medium"
          >
            ← Back to Home
          </Link>
          <h1 className="text-xl font-bold text-gray-800">Partnership Statistics</h1>
          <div className="w-20"></div> {/* Spacer for centering */}
        </div>

        {/* Player Selection */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select First Player
            </label>
            <select
              value={player1}
              onChange={(e) => {
                setPlayer1(e.target.value);
                if (e.target.value === player2) {
                  setPlayer2('');
                }
              }}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Choose a player...</option>
              {players.map((player) => (
                <option key={player} value={player}>
                  {player}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Second Player
            </label>
            <select
              value={player2}
              onChange={(e) => setPlayer2(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={!player1}
            >
              <option value="">Choose a partner...</option>
              {availablePlayer2Options.map((player) => (
                <option key={player} value={player}>
                  {player}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={handleSearch}
            disabled={!player1 || !player2 || loading}
            className="w-full bg-blue-500 text-white py-3 rounded-lg font-semibold hover:bg-blue-600 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {loading ? 'Searching...' : 'Get Partnership Stats'}
          </button>

          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}
        </div>
      </div>

      {/* Results */}
      {partnershipData && (
        <div className="tournament-card w-[92%] mx-auto mb-6">
          {!partnershipData.exists ? (
            <div className="text-center py-8">
              <div className="text-gray-600 text-lg">
                {partnershipData.message || 'No such partnership'}
              </div>
              <div className="text-sm text-gray-500 mt-2">
                {player1} and {player2} have never played together as partners.
              </div>
            </div>
          ) : (
            <div>
              <h2 className="text-lg font-bold text-gray-800 mb-4 text-center">
                {partnershipData.player1} & {partnershipData.player2}
              </h2>
              
              {partnershipData.stats && (
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="bg-gray-50 p-4 rounded-lg text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {partnershipData.stats.wins}
                    </div>
                    <div className="text-sm text-gray-600">Wins</div>
                  </div>
                  
                  <div className="bg-gray-50 p-4 rounded-lg text-center">
                    <div className="text-2xl font-bold text-red-600">
                      {partnershipData.stats.losses}
                    </div>
                    <div className="text-sm text-gray-600">Losses</div>
                  </div>
                  
                  <div className="bg-gray-50 p-4 rounded-lg text-center">
                    <div className="text-2xl font-bold text-blue-600">
                      {partnershipData.stats.winPercentage}%
                    </div>
                    <div className="text-sm text-gray-600">Win Rate</div>
                  </div>
                  
                  <div className="bg-gray-50 p-4 rounded-lg text-center">
                    <div className="text-2xl font-bold text-purple-600">
                      {partnershipData.stats.avgMarginVictory > 0 ? `+${partnershipData.stats.avgMarginVictory}` : partnershipData.stats.avgMarginVictory}
                    </div>
                    <div className="text-sm text-gray-600">Avg Margin</div>
                  </div>
                </div>
              )}

              {partnershipData.matches && partnershipData.matches.length > 0 && (
                <div>
                  <h3 className="font-semibold text-gray-800 mb-3">Match History</h3>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {partnershipData.matches.map((match, index) => (
                      <div
                        key={index}
                        className={`p-3 rounded-lg border ${
                          match.won 
                            ? 'bg-green-50 border-green-200' 
                            : 'bg-red-50 border-red-200'
                        }`}
                      >
                        <div className="flex justify-between items-center">
                          <div className="text-sm">
                            <div className="font-medium">
                              Round {match.round} - {match.date}
                            </div>
                            <div className="text-gray-600">
                              Score: {match.partnerScore} - {match.opponentScore}
                            </div>
                          </div>
                          <div className={`text-sm font-bold ${
                            match.won ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {match.won ? 'WIN' : 'LOSS'}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
