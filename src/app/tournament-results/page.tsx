'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ChevronLeftIcon, TrophyIcon, CalendarIcon } from '@heroicons/react/24/outline';
import { Tournament, getRankedPlayers } from '@/lib/gameLogic';

export default function TournamentResultsPage() {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'history' | 'finishes'>('history');

  useEffect(() => {
    const loadTournaments = async () => {
      try {
        // Load from database first
        const response = await fetch('/api/tournaments/history', { cache: 'no-store' });
        if (response.ok) {
          const dbTournaments = await response.json();
          setTournaments(dbTournaments);
        } else {
          // Fallback to localStorage if API fails
          const history = JSON.parse(localStorage.getItem('tournamentHistory') || '[]');
          
          // Also check for current tournament if it's completed
          const currentTournament = localStorage.getItem('currentTournament');
          if (currentTournament) {
            const tournament = JSON.parse(currentTournament);
            const allMatches = tournament.matches;
            const isComplete = allMatches.every((match: any) => match.completed);
            
            if (isComplete && !history.find((t: Tournament) => t.id === tournament.id)) {
              history.unshift(tournament);
            }
          }

          // Sort by tournament date (newest first)
          history.sort((a: Tournament, b: Tournament) => 
            new Date(b.date).getTime() - new Date(a.date).getTime()
          );

          setTournaments(history);
        }
      } catch (error) {
        // Fallback to localStorage on error
        const history = JSON.parse(localStorage.getItem('tournamentHistory') || '[]');
        setTournaments(history);
      }
      
      setLoading(false);
    };

    loadTournaments();
  }, []);

  const formatDate = (dateString: string) => {
    // Interpret stored YYYY-MM-DD in Pacific Time without day shift
    const [y, m, d] = dateString.split('-').map(Number);
    const middayUtc = new Date(Date.UTC(y, (m || 1) - 1, d || 1, 12, 0, 0));
    return middayUtc.toLocaleDateString('en-US', {
      timeZone: 'America/Los_Angeles',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="mobile-container bg-blue-600 min-h-screen flex items-center justify-center">
        <div className="text-white text-xl">Loading results...</div>
      </div>
    );
  }

  return (
    <div className="mobile-container bg-blue-600 min-h-screen safe-area-inset-top safe-area-inset-bottom">
      {/* Header */}
      <div className="bg-white mx-[4%] mt-[4%] rounded-t-xl px-4 py-3 flex items-center">
        <Link href="/" className="flex items-center text-gray-600 hover:text-gray-800">
          <ChevronLeftIcon className="w-5 h-5 mr-1" />
          <TrophyIcon className="w-5 h-5 mr-2" />
          <span className="font-semibold">Tournament Results</span>
        </Link>
      </div>

      {/* Content */}
      <div className="bg-white mx-[4%] mb-[4%] rounded-b-xl flex-1">
        {tournaments.length === 0 ? (
          <div className="p-6 text-center">
            <TrophyIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-600 mb-2">No Tournament Results</h3>
            <p className="text-gray-500 mb-6">
              Complete tournaments will appear here for future reference
            </p>
            <Link href="/create-tournament">
              <button className="bg-blue-500 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-600 transition-colors">
                Create Your First Tournament
              </button>
            </Link>
          </div>
        ) : (
          <div>
            {/* Tab Navigation */}
            <div className="flex border-b">
              <button
                onClick={() => setActiveTab('history')}
                className={`flex-1 py-3 px-4 text-center font-semibold transition-colors ${
                  activeTab === 'history'
                    ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                Tournament History
              </button>
              <button
                onClick={() => setActiveTab('finishes')}
                className={`flex-1 py-3 px-4 text-center font-semibold transition-colors ${
                  activeTab === 'finishes'
                    ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                Historical Finishes
              </button>
            </div>

            {/* Tab Content */}
            <div className="p-4">
              {activeTab === 'history' ? (
                <div>
                  <div className="mb-6 text-center">
                    <h2 className="text-xl font-bold text-gray-800">Tournament History</h2>
                    <p className="text-gray-600 text-sm">
                      {tournaments.length} completed tournament{tournaments.length !== 1 ? 's' : ''}
                    </p>
                  </div>

                  <div className="space-y-4">
                    {tournaments.map((tournament) => (
                      <TournamentResultCard 
                        key={tournament.id} 
                        tournament={tournament}
                        formatDate={formatDate}
                      />
                    ))}
                  </div>
                </div>
              ) : (
                <HistoricalFinishesTab tournaments={tournaments} />
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

interface TournamentResultCardProps {
  tournament: Tournament;
  formatDate: (date: string) => string;
}

function TournamentResultCard({ tournament, formatDate }: TournamentResultCardProps) {
  const [expanded, setExpanded] = useState(false);
  const rankedPlayers = getRankedPlayers(tournament);
  const winner = rankedPlayers[0];

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      {/* Tournament Header */}
      <div 
        className="p-4 bg-black cursor-pointer hover:bg-gray-800 transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <CalendarIcon className="w-5 h-5 text-gray-300 mr-2" />
            <div>
              <p className="font-semibold text-white">
                {formatDate(tournament.date)}
              </p>
            </div>
          </div>
          <div className="text-right">
            <div className="flex items-center text-yellow-400">
              <TrophyIcon className="w-5 h-5 mr-1" />
              <span className="font-semibold">{winner.name}</span>
            </div>
            <p className="text-sm text-gray-300">
              {winner.totalScore - 147} from max
            </p>
          </div>
        </div>
      </div>

      {/* Expanded Details */}
      {expanded && (
        <div className="p-4 border-t bg-white">
          <h4 className="font-semibold mb-3 text-gray-800">Final Standings</h4>
          <div className="space-y-2">
            {rankedPlayers.map((player) => (
              <div key={player.id} className="flex items-center justify-between py-2">
                <div className="flex items-center">
                  <span className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center text-sm font-semibold mr-3">
                    {player.rank}
                  </span>
                  <span className={player.rank === 1 ? 'font-semibold text-yellow-600' : 'text-gray-800'}>
                    {player.name}
                  </span>
                </div>
                <span className="font-semibold text-gray-800">
                  {player.totalScore - 147}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

interface HistoricalFinishesTabProps {
  tournaments: Tournament[];
}

function HistoricalFinishesTab({ tournaments }: HistoricalFinishesTabProps) {
  // Calculate historical finishes and average scores for each player
  const playerFinishes: Record<string, number[]> = {};
  const playerScores: Record<string, number[]> = {};
  
  tournaments.forEach(tournament => {
    const rankedPlayers = getRankedPlayers(tournament);
    rankedPlayers.forEach((player) => {
      if (!playerFinishes[player.name]) {
        playerFinishes[player.name] = new Array(8).fill(0); // positions 1-8
        playerScores[player.name] = [];
      }
      if (player.rank && player.rank <= 8) { // Only count top 8 positions
        playerFinishes[player.name][player.rank - 1]++; // Use actual rank (convert to 0-based index)
      }
      // Store the score difference from max (147)
      playerScores[player.name].push(player.totalScore - 147);
    });
  });

  // Convert to array and sort by total tournaments played (descending)
  const playerStats = Object.entries(playerFinishes).map(([name, finishes]) => ({
    name,
    finishes,
    totalTournaments: finishes.reduce((sum, count) => sum + count, 0),
    avgScoreDiff: playerScores[name].length > 0 
      ? Math.round(playerScores[name].reduce((sum, score) => sum + score, 0) / playerScores[name].length)
      : 0,
    careerBest: playerScores[name].length > 0 
      ? Math.max(...playerScores[name])
      : 0,
    careerWorst: playerScores[name].length > 0 
      ? Math.min(...playerScores[name])
      : 0
  })).sort((a, b) => b.totalTournaments - a.totalTournaments);

  const getPositionColor = (position: number) => {
    switch (position) {
      case 0: return 'text-yellow-600'; // 1st
      case 1: return 'text-gray-500'; // 2nd
      case 2: return 'text-amber-600'; // 3rd
      default: return 'text-gray-700';
    }
  };

  const getPositionBg = (position: number) => {
    switch (position) {
      case 0: return 'bg-yellow-100'; // 1st - Gold
      case 1: return 'bg-gray-200'; // 2nd - Silver
      case 2: return 'bg-orange-100'; // 3rd - Bronze
      default: return 'bg-gray-50';
    }
  };

  if (playerStats.length === 0) {
    return (
      <div className="text-center py-8">
        <TrophyIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <h3 className="text-xl font-bold text-gray-600 mb-2">No Historical Data</h3>
        <p className="text-gray-500">
          Complete more tournaments to see historical finishes
        </p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6 text-center">
        <h2 className="text-xl font-bold text-gray-800">Historical Finishes</h2>
        <p className="text-gray-600 text-sm">
          How many times each player finished in each position
        </p>
      </div>

      <div className="relative">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            {/* Header */}
            <thead>
              <tr className="bg-gray-100 text-xs font-semibold text-gray-600">
                <th className="sticky left-0 z-20 bg-gray-100 w-32 px-3 py-2 text-left border-r border-gray-200">
                  Player
                </th>
                <th className="w-16 px-2 py-2 text-center border-r border-gray-200 bg-gray-100">Avg</th>
                <th className="w-12 px-2 py-2 text-center border-r border-gray-200 bg-yellow-100">1st</th>
                <th className="w-12 px-2 py-2 text-center border-r border-gray-200 bg-gray-200">2nd</th>
                <th className="w-12 px-2 py-2 text-center border-r border-gray-200 bg-orange-100">3rd</th>
                <th className="w-12 px-2 py-2 text-center border-r border-gray-200">4th</th>
                <th className="w-12 px-2 py-2 text-center border-r border-gray-200">5th</th>
                <th className="w-12 px-2 py-2 text-center border-r border-gray-200">6th</th>
                <th className="w-12 px-2 py-2 text-center border-r border-gray-200">7th</th>
                <th className="w-12 px-2 py-2 text-center border-r border-gray-200">8th</th>
                <th className="w-16 px-2 py-2 text-center border-r border-gray-200 bg-green-100">PB</th>
                <th className="w-16 px-2 py-2 text-center bg-red-100">PW</th>
              </tr>
            </thead>
            
            {/* Player Stats */}
            <tbody>
              {playerStats.map((player) => (
                <tr key={player.name} className="bg-gray-50 border-t border-gray-200">
                  <td className="sticky left-0 z-10 bg-gray-50 w-32 px-3 py-3 border-r border-gray-200">
                    <div className="flex items-center">
                      <span className="font-semibold truncate text-sm mr-1">{player.name}</span>
                      <span className="text-xs text-gray-500">({player.totalTournaments})</span>
                    </div>
                  </td>
                  <td className="w-16 px-2 py-3 text-center border-r border-gray-200 bg-gray-100">
                    <span className="text-xs font-semibold text-gray-700">
                      {player.avgScoreDiff >= 0 ? '+' : ''}{player.avgScoreDiff}
                    </span>
                  </td>
                  {player.finishes.map((count, position) => (
                    <td key={position} className={`w-12 px-2 py-3 text-center border-r border-gray-200 ${getPositionBg(position)}`}>
                      <span className={`text-xs font-semibold ${getPositionColor(position)}`}>
                        {count || '-'}
                      </span>
                    </td>
                  ))}
                  <td className="w-16 px-2 py-3 text-center border-r border-gray-200 bg-green-50">
                    <span className="text-xs font-semibold text-green-700">
                      {player.careerBest >= 0 ? '+' : ''}{player.careerBest}
                    </span>
                  </td>
                  <td className="w-16 px-2 py-3 text-center bg-red-50">
                    <span className="text-xs font-semibold text-red-700">
                      {player.careerWorst >= 0 ? '+' : ''}{player.careerWorst}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {/* Scroll hint */}
        <div className="mt-2 text-center">
          <p className="text-xs text-gray-500">← Scroll horizontally to see positions 5-8 →</p>
        </div>
      </div>

      {/* Summary */}
      <div className="mt-6 p-4 bg-blue-50 rounded-lg">
        <h3 className="font-semibold text-blue-800 mb-2">Summary</h3>
        <div className="text-sm text-blue-700">
          <p>• Total Players: {playerStats.length}</p>
          <p>• Total Tournaments: {tournaments.length}</p>
          <p>• Most Active: {playerStats[0]?.name} ({playerStats[0]?.totalTournaments} tournaments)</p>
        </div>
      </div>
    </div>
  );
}
