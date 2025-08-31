'use client';

import { useState } from 'react';
import { getSocket } from '@/lib/socket';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ChevronLeftIcon, UserGroupIcon } from '@heroicons/react/24/outline';

export default function JoinTournamentPage() {
  const router = useRouter();
  const [accessCode, setAccessCode] = useState('123');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleJoinTournament = async () => {
    setLoading(true);
    setError('');

    try {
      // Pre-wake the Render free instance (no-cors to avoid CORS blocking)
      try {
        const pingUrl = process.env.NEXT_PUBLIC_SOCKET_URL;
        if (pingUrl) {
          fetch(pingUrl, { method: 'GET', mode: 'no-cors', cache: 'no-store' }).catch(() => {});
        }
      } catch {}

      const socket = getSocket();

      const timeoutId = setTimeout(() => {
        setError('No active tournament found yet. Still waking the live server or waiting for the organizer. Try again in ~1 min.');
        setLoading(false);
      }, 90000);

      socket.once('tournament:sync', (serverTournament: any) => {
        if (!serverTournament || serverTournament.accessCode !== accessCode) {
          return;
        }
        clearTimeout(timeoutId);
        try {
          localStorage.setItem('currentTournament', JSON.stringify(serverTournament));
        } catch {}
        router.push(`/tournament/${serverTournament.id}`);
      });

      socket.emit('join-tournament', accessCode);
    } catch (err) {
      setError('Real-time server unavailable. Please try again in a moment.');
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
              Make sure this matches the organizer’s access code.
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
            <p className="mb-2">Don&apos;t have an access code?</p>
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
