'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Tournament, updateMatchScore, isTournamentComplete } from '@/lib/gameLogic';
import TournamentHeader from '@/components/TournamentHeader';
import PlayersTab from '@/components/PlayersTab';
import MatchesTab from '@/components/MatchesTab';
import RankTab from '@/components/RankTab';

type TabType = 'players' | 'matches' | 'rank';

export default function TournamentPage() {
  const params = useParams();
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('matches');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Use requestAnimationFrame for smoother loading
    requestAnimationFrame(() => {
      // Load tournament from localStorage (later will use real-time DB)
      const storedTournament = localStorage.getItem('currentTournament');
      if (storedTournament) {
        const parsedTournament = JSON.parse(storedTournament);
        setTournament(parsedTournament);
        
        // If tournament is complete, show rank tab
        if (isTournamentComplete(parsedTournament)) {
          setActiveTab('rank');
        }
      }
      setLoading(false);
    });
  }, []);

  const handleScoreUpdate = (matchId: number, scoreA: number, scoreB: number, isEdit: boolean = false) => {
    if (!tournament) return;

    const updatedTournament = updateMatchScore(tournament, matchId, scoreA, scoreB, isEdit);
    
    // CRITICAL: Save to localStorage FIRST before any UI updates
    localStorage.setItem('currentTournament', JSON.stringify(updatedTournament));
    
    // Then update the UI state
    setTournament(updatedTournament);

    // Only auto-advance if this is NOT an edit and we're on the matches tab
    if (!isEdit && activeTab === 'matches') {
      // Check if current round is complete
      const currentRoundMatches = updatedTournament.matches.filter(m => m.round === updatedTournament.currentRound);
      const currentRoundComplete = currentRoundMatches.every(m => m.completed);
      
      // Also check if this specific match was just completed for the first time
      const updatedMatch = updatedTournament.matches.find(m => m.id === matchId);
      const wasJustCompleted = updatedMatch?.completed && !tournament.matches.find(m => m.id === matchId)?.completed;

      if (currentRoundComplete && wasJustCompleted) {
        // Wait 1.5 seconds to show completed state, then proceed
        setTimeout(() => {
          // Force another save to be absolutely sure
          localStorage.setItem('currentTournament', JSON.stringify(updatedTournament));
          
          if (updatedTournament.currentRound === 7) {
            // Tournament complete - go to rank tab
            setActiveTab('rank');
          } else {
            // Move to next round - the tournament state already updated currentRound
            // Force re-render by updating the tournament state
            setTournament({...updatedTournament});
          }
        }, 1500);
      }
    }
  };

  const handlePlayerUpdate = (updatedPlayers: string[]) => {
    if (!tournament) return;

    const updatedTournament = {
      ...tournament,
      players: tournament.players.map((player, index) => ({
        ...player,
        name: updatedPlayers[index]
      }))
    };

    setTournament(updatedTournament);
    localStorage.setItem('currentTournament', JSON.stringify(updatedTournament));
  };

  const handleFinalizeTournament = () => {
    if (!tournament) return;

    const finalizedTournament = {
      ...tournament,
      isFinalized: true
    };

    setTournament(finalizedTournament);
    localStorage.setItem('currentTournament', JSON.stringify(finalizedTournament));

    // Save to tournament history
    const history = JSON.parse(localStorage.getItem('tournamentHistory') || '[]');
    history.push(finalizedTournament);
    localStorage.setItem('tournamentHistory', JSON.stringify(history));
  };

  if (loading) {
    return (
      <div className="mobile-container bg-blue-600 min-h-screen flex items-center justify-center">
        <div className="text-white text-xl">Loading tournament...</div>
      </div>
    );
  }

  if (!tournament) {
    return (
      <div className="mobile-container bg-blue-600 min-h-screen flex items-center justify-center">
        <div className="text-white text-xl text-center">
          <p>Tournament not found</p>
          <Link href="/" className="text-blue-200 underline mt-4 block">
            Return to Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mobile-container bg-blue-600 min-h-screen safe-area-inset-top safe-area-inset-bottom">
      <TournamentHeader 
        date={tournament.date}
        accessCode={tournament.accessCode}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />

      <div className="flex-1 bg-white mx-[4%] mb-[4%] rounded-b-xl overflow-hidden">
        {activeTab === 'players' && (
          <PlayersTab 
            players={tournament.players}
            onUpdatePlayers={handlePlayerUpdate}
            isFinalized={tournament.isFinalized}
          />
        )}

        {activeTab === 'matches' && (
          <MatchesTab
            tournament={tournament}
            onScoreUpdate={handleScoreUpdate}
          />
        )}

        {activeTab === 'rank' && (
          <RankTab
            tournament={tournament}
            onFinalize={handleFinalizeTournament}
          />
        )}
      </div>
    </div>
  );
}
