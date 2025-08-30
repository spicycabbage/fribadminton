'use client';

import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="mobile-container bg-blue-600 flex flex-col justify-center items-center min-h-screen safe-area-inset-top safe-area-inset-bottom">
      {/* Main Tournament Section */}
      <div className="tournament-card w-[92%] mb-6">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-800 mb-2">
            Badminton Tournament
          </h1>
          <p className="text-gray-600 text-sm">
            Choose how you&apos;d like to participate
          </p>
        </div>

        <div className="space-y-4">
          <Link 
            href="/create-tournament" 
            className="block w-full"
          >
            <button className="w-full bg-black text-white py-4 rounded-lg font-semibold text-lg hover:bg-gray-800 transition-colors">
              Create New Tournament
            </button>
          </Link>

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

      {/* Tournament History & Analytics Section */}
      <div className="tournament-card w-[92%]">
        <div className="text-center mb-6">
          <h2 className="text-xl font-bold text-gray-800 mb-2">
            Tournament History & Analytics
          </h2>
        </div>

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
