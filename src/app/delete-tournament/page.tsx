'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ChevronLeftIcon } from '@heroicons/react/24/outline';
import { Tournament } from '@/lib/gameLogic';

export default function DeleteTournamentPage() {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Load tournaments from localStorage
    const history = JSON.parse(localStorage.getItem('tournamentHistory') || '[]');
    const current = localStorage.getItem('currentTournament');
    
    let allTournaments = [...history];
    if (current) {
      const currentTournament = JSON.parse(current);
      // Add current tournament if not already in history
      if (!history.find((t: Tournament) => t.id === currentTournament.id)) {
        allTournaments.unshift(currentTournament);
      }
    }

    // Sort by date (newest first)
    allTournaments.sort((a: Tournament, b: Tournament) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    setTournaments(allTournaments);
    setLoading(false);
  }, []);

  const deleteTournament = async (id: string, date: string) => {
    if (!confirm(`Are you sure you want to delete the tournament from ${date}?`)) {
      return;
    }

    try {
      const response = await fetch(`/api/tournaments/${id}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        alert('Tournament deleted successfully!');
        
        // Remove from localStorage
        const history = JSON.parse(localStorage.getItem('tournamentHistory') || '[]');
        const updatedHistory = history.filter((t: Tournament) => t.id !== id);
        localStorage.setItem('tournamentHistory', JSON.stringify(updatedHistory));
        
        // Remove from current tournament if it matches
        const current = localStorage.getItem('currentTournament');
        if (current) {
          const currentTournament = JSON.parse(current);
          if (currentTournament.id === id) {
            localStorage.removeItem('currentTournament');
          }
        }
        
        // Update state to show updated list
        setTournaments(prev => prev.filter(t => t.id !== id));
      } else {
        const error = await response.json();
        alert(`Error deleting tournament: ${error.error || 'Unknown error'}`);
      }
    } catch (error: any) {
      alert(`Error deleting tournament: ${error.message}`);
    }
  };

  if (loading) {
    return (
      <div className="mobile-container bg-blue-600 min-h-screen flex items-center justify-center">
        <div className="text-white text-xl">Loading tournaments...</div>
      </div>
    );
  }

  return (
    <div className="mobile-container bg-blue-600 min-h-screen safe-area-inset-top safe-area-inset-bottom">
      {/* Header */}
      <div className="bg-white mx-[4%] mt-[4%] rounded-t-xl px-4 py-3 flex items-center">
        <Link href="/" className="flex items-center text-gray-600 hover:text-gray-800">
          <ChevronLeftIcon className="w-5 h-5 mr-1" />
          <span className="font-semibold">Tournament Manager</span>
        </Link>
      </div>

      {/* Content */}
      <div className="bg-white mx-[4%] mb-[4%] rounded-b-xl flex-1">
        <div className="p-4">
          <div className="mb-6 text-center">
            <h2 className="text-xl font-bold text-gray-800">Delete Tournament</h2>
            <p className="text-gray-600 text-sm">
              Manage and delete tournaments from the database
            </p>
          </div>

          {tournaments.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">No tournaments found</p>
            </div>
          ) : (
            <div className="space-y-4">
              {tournaments.map((tournament) => (
                <div key={tournament.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="mb-3">
                    <h3 className="font-semibold text-lg">Tournament: {tournament.date}</h3>
                    <div className="text-sm text-gray-600 space-y-1">
                      <p><strong>ID:</strong> {tournament.id}</p>
                      <p><strong>Access Code:</strong> {tournament.accessCode}</p>
                      <p><strong>Finalized:</strong> {tournament.isFinalized ? 'Yes' : 'No'}</p>
                      <p><strong>Created:</strong> {new Date(tournament.createdAt).toLocaleString()}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => deleteTournament(tournament.id, tournament.date)}
                    className="w-full bg-red-500 text-white py-2 px-4 rounded-lg font-semibold hover:bg-red-600 transition-colors"
                  >
                    Delete This Tournament
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
