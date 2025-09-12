'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ChevronLeftIcon, UserGroupIcon } from '@heroicons/react/24/outline';
import { DEFAULT_PLAYER_NAMES } from '@/lib/gameLogic';
import { getSocket } from '@/lib/socket';

export default function CreateTournamentPage() {
  const router = useRouter();
  const [accessCode, setAccessCode] = useState('123');
  const [tournamentDate, setTournamentDate] = useState('');
  const [playerNames, setPlayerNames] = useState<string[]>(new Array(8).fill(''));
  const [filledCount, setFilledCount] = useState(0);
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    // Set default date to today
    const today = new Date().toISOString().split('T')[0];
    setTournamentDate(today);
  }, []);

  useEffect(() => {
    const filled = playerNames.filter(name => name.trim() !== '').length;
    setFilledCount(filled);
  }, [playerNames]);

  const handlePlayerNameChange = (index: number, value: string) => {
    // Limit to 8 characters
    const limitedValue = value.slice(0, 8);
    const newNames = [...playerNames];
    newNames[index] = limitedValue;
    setPlayerNames(newNames);
    
    // Update suggestions for this input
    const newSuggestions = [...suggestions];
    newSuggestions[index] = getFilteredSuggestions(value, index);
    setSuggestions(newSuggestions);
  };

  const handleSuggestionClick = (index: number, suggestion: string) => {
    const newNames = [...playerNames];
    newNames[index] = suggestion;
    setPlayerNames(newNames);
    
    // Clear suggestions for this input
    const newSuggestions = [...suggestions];
    newSuggestions[index] = [];
    setSuggestions(newSuggestions);
  };

  const [suggestions, setSuggestions] = useState<string[][]>(new Array(8).fill([]));
  const [activeSuggestion, setActiveSuggestion] = useState<{index: number, suggestionIndex: number} | null>(null);

  const getFilteredSuggestions = (currentValue: string, currentIndex: number) => {
    if (currentValue.length < 1) return [];
    
    const usedNames = playerNames
      .filter((name, index) => index !== currentIndex && name.trim() !== '')
      .map(name => name.toLowerCase());
    
    return DEFAULT_PLAYER_NAMES
      .filter(name => 
        name.toLowerCase().startsWith(currentValue.toLowerCase()) &&
        !usedNames.includes(name.toLowerCase())
      )
      .slice(0, 3);
  };

  const handleStartTournament = async () => {
    if (filledCount !== 8 || isCreating) return;
    setIsCreating(true);
    try {
      const res = await fetch('/api/tournaments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accessCode, playerNames }),
      });
      if (!res.ok) throw new Error('Failed to create tournament');
      const tournament = await res.json();
      try { localStorage.setItem('currentTournament', JSON.stringify(tournament)); } catch {}
      try { const socket = getSocket(); socket.emit('create-tournament', tournament); } catch {}
      router.push(`/tournament/${tournament.id}`);
    } catch (e) {
      setIsCreating(false);
      alert('Unable to create tournament right now. Please try again.');
    }
  };

  const isStartDisabled = filledCount < 8;

  return (
    <div className="mobile-container bg-blue-600 min-h-screen safe-area-inset-top safe-area-inset-bottom">
      {/* Header */}
      <div className="bg-white mx-[4%] mt-[4%] rounded-t-xl px-4 py-3 flex items-center justify-between">
        <Link href="/" className="flex items-center text-gray-600 hover:text-gray-800">
          <ChevronLeftIcon className="w-5 h-5 mr-1" />
          <UserGroupIcon className="w-5 h-5 mr-2" />
          <span className="font-semibold">Create Tournament</span>
        </Link>
        <div className="text-sm text-gray-600">
          <span className="font-semibold">{filledCount}/8</span>
        </div>
      </div>

      {/* Tournament Settings */}
      <div className="bg-white mx-[4%] px-4 py-4 border-b border-gray-200">
        <div className="flex justify-between items-center mb-4">
          <div className="flex-1 mr-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tournament Date
            </label>
            <input
              type="date"
              value={tournamentDate}
              onChange={(e) => setTournamentDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Access Code
            </label>
            <input
              type="text"
              value={accessCode}
              onChange={(e) => setAccessCode(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-center font-mono"
              maxLength={6}
            />
          </div>
        </div>
      </div>

      {/* Player Registration */}
      <div className="bg-white mx-[4%] px-4 py-4">
        <div className="mb-4">
          <p className="text-sm text-gray-600 text-center">
            Enter all 8 player names to start (max 8 characters each)
          </p>
        </div>

        <div className="space-y-3">
          {playerNames.map((name, index) => (
            <div key={index} className="flex items-center">
              <div className="player-button w-12 h-12 flex items-center justify-center mr-3 text-sm">
                P{index + 1}
              </div>
              <div className="flex-1 relative">
                <input
                  type="text"
                  value={name}
                  onChange={(e) => handlePlayerNameChange(index, e.target.value)}
                  maxLength={8}
                  onFocus={() => {
                    const newSuggestions = [...suggestions];
                    newSuggestions[index] = getFilteredSuggestions(name, index);
                    setSuggestions(newSuggestions);
                  }}
                  onBlur={() => {
                    // Delay clearing suggestions to allow click
                    setTimeout(() => {
                      const newSuggestions = [...suggestions];
                      newSuggestions[index] = [];
                      setSuggestions(newSuggestions);
                    }, 150);
                  }}
                  placeholder="Enter player name"
                  className="w-full px-3 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  autoComplete="off"
                />
                {suggestions[index] && suggestions[index].length > 0 && (
                  <div className="absolute z-10 w-full bg-white border border-gray-300 rounded-md shadow-lg mt-1 max-h-32 overflow-y-auto">
                    {suggestions[index].map((suggestion, suggestionIndex) => (
                      <button
                        key={suggestion}
                        type="button"
                        onClick={() => handleSuggestionClick(index, suggestion)}
                        className="w-full px-3 py-2 text-left hover:bg-blue-50 focus:bg-blue-50 focus:outline-none"
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Start Tournament Button */}
      <div className="bg-white mx-[4%] mb-[4%] rounded-b-xl px-4 py-6">
        <button
          onClick={handleStartTournament}
          disabled={isStartDisabled || isCreating}
          className={`w-full py-4 rounded-lg font-semibold text-lg transition-all ${
            isStartDisabled || isCreating
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-green-500 text-white hover:bg-green-600 shadow-lg'
          }`}
        >
          {isCreating 
            ? 'Creating Tournament...' 
            : isStartDisabled 
              ? 'Please fill in all player names to continue' 
              : 'Start Tournament'
          }
        </button>
      </div>
    </div>
  );
}
