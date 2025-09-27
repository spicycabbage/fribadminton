'use client';
import Link from 'next/link';
import { Tournament, getRankedPlayers, isTournamentComplete } from '@/lib/gameLogic';
import { TrophyIcon, UserIcon } from '@heroicons/react/24/solid';

interface RankTabProps {
  tournament: Tournament;
  onFinalize: () => void;
}

export default function RankTab({ tournament, onFinalize }: RankTabProps) {
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
    <div className="p-4 w-full max-w-full">
      <div className="w-full">
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
        <div className="space-y-3 mb-6 w-full">
          {rankedPlayers.map((player, index) => (
            <div
              key={player.id}
              className={`flex items-center justify-between h-14 px-6 py-3 rounded-lg ${
                player.rank === 1 
                  ? 'bg-yellow-50 border-2 border-yellow-300' 
                  : 'bg-gray-50 border border-gray-200'
              }`}
            >
              <div className="flex items-center">
                {getRankIcon(player.rank || 1)}
                <div className="ml-3">
                  <div className="flex items-center">
                    <span className="text-sm font-semibold text-gray-600 mr-2">
                      {getRankDisplay(player.rank || 1)}
                    </span>
                    <span className="font-semibold">
                      {player.name}
                    </span>
                  </div>
                </div>
              </div>
              <div className="bg-gray-600 text-white px-3 py-2 rounded font-bold">
                {player.totalScore - 147}
              </div>
            </div>
          ))}
        </div>

        {/* Score Details - Always visible with all 7 rounds, no horizontal scroll */}
        <div className="bg-gray-50 rounded-lg p-3 mb-6">
          <h4 className="font-bold mb-3 text-center">Round Scores</h4>
          <div className="text-[11px]">
            <div className="grid grid-cols-[repeat(7,2rem)_2.5rem_2.5rem] items-center font-semibold border-b pb-1">
              {[1, 2, 3, 4, 5, 6, 7].map((round) => (
                <div key={round} className="text-center">R{round}</div>
              ))}
              <div className="text-center">Total</div>
              <div className="text-center">Diff</div>
            </div>
            <div>
              {rankedPlayers.map((player) => (
                <div key={player.id} className="border-b py-1">
                  <div className="truncate pr-1 font-medium mb-1 text-[12px]">{player.name}</div>
                  <div className="grid grid-cols-[repeat(7,2rem)_2.5rem_2.5rem] items-center">
                    {[0, 1, 2, 3, 4, 5, 6].map((roundIndex) => (
                      <div key={roundIndex} className="text-center">
                        {player.scores[roundIndex] || '-'}
                      </div>
                    ))}
                    <div className="text-center font-bold">{player.totalScore}</div>
                    <div className="text-center font-bold">{player.totalScore - 147}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom Actions */}
        <div className="mt-6 space-y-3">
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
    </div>
  );
}
