'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ChevronLeftIcon, ChartBarIcon } from '@heroicons/react/24/outline';

interface PlayerStats {
  name: string;
  wins: number;
  losses: number;
  totalMatches: number;
  winPercentage: number;
}

export default function AnalyticsPage() {
  const [playerStats, setPlayerStats] = useState<PlayerStats[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadPlayerStats = async () => {
      try {
        const response = await fetch('/api/analytics/player-stats', { cache: 'no-store' });
        console.log('Analytics API response status:', response.status);
        if (response.ok) {
          const stats = await response.json();
          console.log('Analytics data:', stats);
          setPlayerStats(stats);
        } else {
          const errorText = await response.text();
          console.error('Analytics API error:', response.status, errorText);
        }
      } catch (error) {
        console.error('Failed to load player stats:', error);
      }
      setLoading(false);
    };

    loadPlayerStats();
  }, []);

  if (loading) {
    return (
      <div className="mobile-container bg-blue-600 min-h-screen flex items-center justify-center">
        <div className="text-white text-xl">Loading analytics...</div>
      </div>
    );
  }

  return (
    <div className="mobile-container bg-blue-600 min-h-screen safe-area-inset-top safe-area-inset-bottom">
      {/* Header */}
      <div className="bg-white mx-[4%] mt-[4%] rounded-t-xl px-4 py-3 flex items-center">
        <Link href="/" className="flex items-center text-gray-600 hover:text-gray-800">
          <ChevronLeftIcon className="w-5 h-5 mr-1" />
          <ChartBarIcon className="w-5 h-5 mr-2" />
          <span className="font-semibold">Advanced Analytics</span>
        </Link>
      </div>

      {/* Content */}
      <div className="bg-white mx-[4%] mb-[4%] rounded-b-xl flex-1">
        <div className="p-4">
          <div className="mb-6 text-center">
            <h2 className="text-xl font-bold text-gray-800">Player Win-Loss Records</h2>
            <p className="text-gray-600 text-sm">
              Statistics from all finalized tournaments
            </p>
          </div>

          {playerStats.length === 0 ? (
            <div className="text-center py-8">
              <ChartBarIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-gray-600 mb-2">No Data Available</h3>
              <p className="text-gray-500 mb-6">
                Complete and finalize tournaments to see player statistics
              </p>
              <Link href="/create-tournament">
                <button className="bg-blue-500 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-600 transition-colors">
                  Create Your First Tournament
                </button>
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {/* Header */}
              <div className="grid grid-cols-[2fr_1fr_1fr_1fr_1fr] gap-2 px-3 py-2 bg-gray-100 rounded-lg text-xs font-semibold text-gray-600">
                <div>Player</div>
                <div className="text-center">W</div>
                <div className="text-center">L</div>
                <div className="text-center">Total</div>
                <div className="text-center">Win%</div>
              </div>

              {/* Player Stats */}
              {playerStats.map((player, index) => (
                <div key={player.name} className="grid grid-cols-[2fr_1fr_1fr_1fr_1fr] gap-2 px-3 py-3 bg-gray-50 rounded-lg items-center">
                  <div className="flex items-center">
                    <span className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-semibold mr-3">
                      {index + 1}
                    </span>
                    <span className="font-semibold truncate">{player.name}</span>
                  </div>
                  <div className="text-center font-semibold text-green-600">{player.wins}</div>
                  <div className="text-center font-semibold text-red-600">{player.losses}</div>
                  <div className="text-center font-semibold">{player.totalMatches}</div>
                  <div className="text-center">
                    <span className={`font-semibold ${
                      player.winPercentage >= 70 ? 'text-green-600' :
                      player.winPercentage >= 50 ? 'text-yellow-600' :
                      'text-red-600'
                    }`}>
                      {player.winPercentage}%
                    </span>
                  </div>
                </div>
              ))}

              {/* Summary */}
              <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                <h3 className="font-semibold text-blue-800 mb-2">Summary</h3>
                <div className="text-sm text-blue-700">
                  <p>• Total Players: {playerStats.length}</p>
                  <p>• Total Matches: {playerStats.reduce((sum, p) => sum + p.totalMatches, 0)}</p>
                  <p>• Average Win Rate: {playerStats.length > 0 ? Math.round(playerStats.reduce((sum, p) => sum + p.winPercentage, 0) / playerStats.length) : 0}%</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
