'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ChevronLeftIcon, UserGroupIcon } from '@heroicons/react/24/outline';

export default function JoinTournamentPage() {
  const router = useRouter();
  const [accessCode, setAccessCode] = useState('111');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleJoinTournament = async () => {
    setLoading(true);
    setError('');

    try {
      // Check if there's a current tournament with matching access code
      const storedTournament = localStorage.getItem('currentTournament');
      
      if (!storedTournament) {
        setError('No active tournament found. Please check the access code or create a new tournament.');
        setLoading(false);
        return;
      }

      const tournament = JSON.parse(storedTournament);
      
      if (tournament.accessCode !== accessCode) {
        setError('Invalid access code. Please check with the tournament organizer.');
        setLoading(false);
        return;
      }

      // Successfully joined - redirect to tournament
      router.push(`/tournament/${tournament.id}`);
    } catch (err) {
      setError('Error joining tournament. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="mobile-container bg-blue-600 min-h-screen safe-area-inset-top safe-area-inset-bottom">
      {/* Header */}
      <div className="bg-white mx-[4%] mt-[4%] rounded-t-xl px-4 py-3 flex items-center">
        <Link href="/" className="flex items-center text-gray-600 hover:text-gray-800">
          <ChevronLeftIcon className="w-5 h-5 mr-1" />
          <UserGroupIcon className="w-5 h-5 mr-2" />
          <span className="font-semibold">Join Tournament</span>
        </Link>
      </div>

      {/* Join Form */}
      <div className="bg-white mx-[4%] mb-[4%] rounded-b-xl p-6">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-800 mb-2">
            Join Existing Tournament
          </h1>
          <p className="text-gray-600 text-sm">
            Enter the access code to join and get real-time updates
          </p>
        </div>

        <div className="space-y-6">
          {/* Access Code Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tournament Access Code
            </label>
            <input
              type="text"
              value={accessCode}
              onChange={(e) => setAccessCode(e.target.value.trim())}
              placeholder="Enter access code"
              className="w-full px-4 py-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-center font-mono text-lg"
              maxLength={6}
              autoFocus
            />
            <p className="text-xs text-gray-500 mt-1 text-center">
              Default access code is "111"
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-4 bg-red-100 border border-red-400 rounded-lg text-red-700 text-sm">
              <p className="font-semibold">Unable to join tournament</p>
              <p>{error}</p>
            </div>
          )}

          {/* Join Button */}
          <button
            onClick={handleJoinTournament}
            disabled={loading || !accessCode.trim()}
            className={`w-full py-4 rounded-lg font-semibold text-lg transition-colors ${
              loading || !accessCode.trim()
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-blue-500 text-white hover:bg-blue-600'
            }`}
          >
            {loading ? 'Joining Tournament...' : 'Join Tournament'}
          </button>

          {/* Help Text */}
          <div className="text-center text-sm text-gray-600">
            <p className="mb-2">Don't have an access code?</p>
            <Link href="/create-tournament" className="text-blue-600 underline font-medium">
              Create a new tournament instead
            </Link>
          </div>
        </div>

        {/* Info Section */}
        <div className="mt-8 p-4 bg-blue-50 rounded-lg">
          <h3 className="font-semibold text-blue-800 mb-2">What happens when you join?</h3>
          <ul className="text-sm text-blue-700 space-y-1">
            <li>• Get real-time score updates</li>
            <li>• View live tournament progress</li>
            <li>• Edit scores (if authorized)</li>
            <li>• See final rankings</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
