'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

export default function HomePage() {
  const [hasActive, setHasActive] = useState<boolean>(false);
  const [checking, setChecking] = useState<boolean>(true);
  const [selectedYear, setSelectedYear] = useState<string>('');
  const [availableYears, setAvailableYears] = useState<string[]>([]);

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

  // Fetch available years from tournaments
  useEffect(() => {
    const fetchYears = async () => {
      try {
        const response = await fetch('/api/tournaments/history', { cache: 'no-store' });
        if (response.ok) {
          const tournaments = await response.json();
          const years = new Set<string>();
          tournaments.forEach((t: any) => {
            const year = new Date(t.date).getFullYear().toString();
            years.add(year);
          });
          const sortedYears = Array.from(years).sort((a, b) => parseInt(b) - parseInt(a));
          setAvailableYears(sortedYears);
          
          // Set default to current year
          const currentYear = new Date().getFullYear().toString();
          const savedYear = localStorage.getItem('selectedYear');
          setSelectedYear(savedYear || currentYear);
        }
      } catch (err) {
        console.error('Failed to fetch years:', err);
        // Default to current year
        const currentYear = new Date().getFullYear().toString();
        setSelectedYear(currentYear);
      }
    };
    fetchYears();
  }, []);

  const handleYearChange = (year: string) => {
    setSelectedYear(year);
    localStorage.setItem('selectedYear', year);
  };

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

          {hasActive && (
            <Link 
              href="/join-tournament" 
              className="block w-full"
            >
              <button className="w-full bg-green-500 text-white py-4 rounded-lg font-semibold text-lg hover:bg-green-600 transition-colors">
                Join Tournament
              </button>
            </Link>
          )}
        </div>
      </div>

      {/* Tournament History Section */}
      <div className="tournament-card w-[92%]">
        {/* Year Filter */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Filter by Year
          </label>
          <select
            value={selectedYear}
            onChange={(e) => handleYearChange(e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-semibold"
          >
            <option value="all">All Years</option>
            {availableYears.map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-3">
          <Link 
            href={`/tournament-results?year=${selectedYear}`}
            className="block w-full"
          >
            <button className="w-full bg-blue-500 text-white py-4 rounded-lg font-semibold text-lg hover:bg-blue-600 transition-colors">
              View Tournament Results
            </button>
          </Link>

          <Link 
            href={`/analytics?year=${selectedYear}`}
            className="block w-full"
          >
            <button className="w-full bg-purple-500 text-white py-4 rounded-lg font-semibold text-lg hover:bg-purple-600 transition-colors">
              Advanced Analytics
            </button>
          </Link>

          <Link 
            href={`/partnership-stats?year=${selectedYear}`}
            className="block w-full"
          >
            <button className="w-full bg-orange-500 text-white py-4 rounded-lg font-semibold text-lg hover:bg-orange-600 transition-colors">
              Partnership Statistics
            </button>
          </Link>
        </div>
      </div>

      {/* Version info */}
      <div className="mt-8 text-center">
        <p className="text-white text-xs opacity-75">
          Version 1.1
        </p>
      </div>
    </div>
  );
}
