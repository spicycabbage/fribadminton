'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ChevronLeftIcon, TrophyIcon, CalendarIcon } from '@heroicons/react/24/outline';
import { Tournament, getRankedPlayers } from '@/lib/gameLogic';

export default function TournamentResultsPage() {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Load tournament history from localStorage
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

    // Sort by date (newest first)
    history.sort((a: Tournament, b: Tournament) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    setTournaments(history);
    setLoading(false);
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
          <div className="p-4">
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
        className="p-4 bg-gray-50 cursor-pointer hover:bg-gray-100 transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <CalendarIcon className="w-5 h-5 text-gray-500 mr-2" />
            <div>
              <p className="font-semibold text-gray-800">
                {formatDate(tournament.date)}
              </p>
              <p className="text-sm text-gray-600">
                Code: {tournament.accessCode}
              </p>
            </div>
          </div>
          <div className="text-right">
            <div className="flex items-center text-yellow-600">
              <TrophyIcon className="w-5 h-5 mr-1" />
              <span className="font-semibold">{winner.name}</span>
            </div>
            <p className="text-sm text-gray-600">
              {winner.totalScore} points
            </p>
          </div>
        </div>
      </div>

      {/* Expanded Details */}
      {expanded && (
        <div className="p-4 border-t">
          <h4 className="font-semibold mb-3">Final Standings</h4>
          <div className="space-y-2">
            {rankedPlayers.map((player, index) => (
              <div key={player.id} className="flex items-center justify-between py-2">
                <div className="flex items-center">
                  <span className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center text-sm font-semibold mr-3">
                    {index + 1}
                  </span>
                  <span className={index === 0 ? 'font-semibold text-yellow-600' : ''}>
                    {player.name}
                  </span>
                </div>
                <span className="font-semibold">
                  {player.totalScore}
                </span>
              </div>
            ))}
          </div>

          {tournament.isFinalized && (
            <div className="mt-4 p-3 bg-green-100 rounded-lg">
              <p className="text-green-800 text-sm font-medium">
                ✓ Tournament Finalized
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
