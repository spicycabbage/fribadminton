'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

export default function HomePage() {
  const [hasActive, setHasActive] = useState<boolean>(false);
  const [checking, setChecking] = useState<boolean>(true);

  useEffect(() => {
    let ignore = false;
    (async () => {
      try {
        const res = await fetch('/api/tournaments/active', { cache: 'no-store' });
        if (!ignore && res.ok) {
          const data = await res.json();
          setHasActive(!!data?.active);
        }
      } catch {}
      if (!ignore) setChecking(false);
    })();
    return () => { ignore = true; };
  }, []);

  return (
    <div className="mobile-container bg-blue-600 flex flex-col justify-center items-center min-h-screen safe-area-inset-top safe-area-inset-bottom">
      {/* Main Tournament Section */}
      <div className="tournament-card w-[92%] mb-6">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-800 mb-2">
            Friday Badminton
          </h1>
        </div>

        <div className="space-y-4">
          {hasActive && (
            <div className="w-full bg-yellow-100 text-yellow-800 px-4 py-2 rounded-lg text-sm font-medium text-center">
              A tournament is already in progress
            </div>
          )}
          {!hasActive && (
            <Link 
              href="/create-tournament" 
              className="block w-full"
            >
              <button className="w-full bg-black text-white py-4 rounded-lg font-semibold text-lg hover:bg-gray-800 transition-colors">
                Create New Tournament
              </button>
            </Link>
          )}

          <Link 
            href="/join-tournament" 
            className="block w-full"
          >
            <button className="w-full bg-gray-200 text-gray-800 py-4 rounded-lg font-semibold text-lg hover:bg-gray-300 transition-colors">
              Join Tournament
            </button>
          </Link>
        </div>
      </div>

      {/* Tournament History Section */}
      <div className="tournament-card w-[92%]">
        {/* Removed section title per request */}

        <div className="space-y-3">
          <Link 
            href="/tournament-results" 
            className="block w-full"
          >
            <button className="w-full bg-blue-500 text-white py-4 rounded-lg font-semibold text-lg hover:bg-blue-600 transition-colors">
              View Tournament Results
            </button>
          </Link>

          <button 
            className="w-full bg-gray-300 text-gray-600 py-4 rounded-lg font-semibold text-lg cursor-not-allowed"
            disabled
          >
            Advanced Analytics - Coming Soon
          </button>
        </div>
      </div>

      {/* Version info */}
      <div className="mt-8 text-center">
        <p className="text-white text-xs opacity-75">
          Version 1.0
        </p>
      </div>
    </div>
  );
}
