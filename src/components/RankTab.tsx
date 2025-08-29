'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Tournament, getRankedPlayers, isTournamentComplete } from '@/lib/gameLogic';
import { TrophyIcon, UserIcon } from '@heroicons/react/24/solid';

interface RankTabProps {
  tournament: Tournament;
  onFinalize: () => void;
}

export default function RankTab({ tournament, onFinalize }: RankTabProps) {
  const [showScoreDetails, setShowScoreDetails] = useState(false);
  const rankedPlayers = getRankedPlayers(tournament);
  const isComplete = isTournamentComplete(tournament);

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <TrophyIcon className="w-6 h-6 text-yellow-500" />;
      case 2:
        return <TrophyIcon className="w-6 h-6 text-gray-400" />;
      case 3:
        return <TrophyIcon className="w-6 h-6 text-amber-600" />;
      default:
        return <UserIcon className="w-6 h-6 text-gray-500" />;
    }
  };

  const getRankDisplay = (rank: number) => {
    switch (rank) {
      case 1: return '#1';
      case 2: return '#2'; 
      case 3: return '#3';
      default: return `#${rank}`;
    }
  };

  // Always show rankings, but with different headers for in-progress vs complete

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 flex-1">
        {/* Rankings Header */}
        <div className="text-center mb-6">
          <h3 className="text-xl font-bold mb-2">
            {isComplete ? 'Final Rankings' : 'Current Standings'}
          </h3>
          <p className="text-gray-600 text-sm">
            {isComplete ? 'Tournament Complete! 🎉' : `Round ${tournament.currentRound} - Tournament in Progress`}
          </p>
        </div>

        {/* Rankings List */}
        <div className="space-y-3 mb-6">
          {rankedPlayers.map((player, index) => (
            <div
              key={player.id}
              className={`flex items-center justify-between h-14 px-4 rounded-lg ${
                index === 0 
                  ? 'bg-yellow-50 border-2 border-yellow-300' 
                  : 'bg-gray-50 border border-gray-200'
              }`}
            >
              <div className="flex items-center">
                {getRankIcon(index + 1)}
                <div className="ml-3">
                  <div className="flex items-center">
                    <span className="text-sm font-semibold text-gray-600 mr-2">
                      {getRankDisplay(index + 1)}
                    </span>
                    <span className="font-semibold">
                      {player.name}
                    </span>
                  </div>
                </div>
              </div>
              <div className="bg-black text-white px-3 py-2 rounded font-bold">
                {player.totalScore}
              </div>
            </div>
          ))}
        </div>

        {/* Toggle Score Details */}
        <div className="text-center mb-4">
          <button
            onClick={() => setShowScoreDetails(!showScoreDetails)}
            className="text-blue-600 underline font-medium"
          >
            {showScoreDetails ? 'Hide' : 'Show'} Round Scores
          </button>
        </div>

        {/* Score Details */}
        {showScoreDetails && (
          <div className="bg-gray-50 rounded-lg p-4 mb-6 overflow-x-auto">
            <h4 className="font-bold mb-4 text-center">Round Scores</h4>
            <div className="min-w-full">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 pr-2 font-semibold">Player</th>
                    {[1, 2, 3, 4, 5, 6, 7].map(round => (
                      <th key={round} className="text-center py-2 px-1 font-semibold">
                        R{round}
                      </th>
                    ))}
                    <th className="text-center py-2 pl-2 font-semibold">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {rankedPlayers.map((player) => (
                    <tr key={player.id} className="border-b">
                      <td className="py-2 pr-2 font-medium">{player.name}</td>
                      {player.scores.map((score, roundIndex) => (
                        <td key={roundIndex} className="text-center py-2 px-1">
                          {score || '-'}
                        </td>
                      ))}
                      <td className="text-center py-2 pl-2 font-bold">
                        {player.totalScore}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Actions */}
      <div className="p-4 border-t bg-white space-y-3">
        {isComplete && !tournament.isFinalized && (
          <button
            onClick={onFinalize}
            className="w-full bg-red-500 text-white h-14 rounded-lg font-semibold hover:bg-red-600 transition-colors"
          >
            Finalize Tournament
          </button>
        )}
        
        <Link href="/" className="block w-full">
          <button className="w-full bg-yellow-500 text-white h-14 rounded-lg font-semibold hover:bg-yellow-600 transition-colors">
            Return to Home Screen
          </button>
        </Link>
      </div>
    </div>
  );
}
