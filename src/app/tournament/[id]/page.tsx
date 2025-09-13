'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Tournament, updateMatchScore, isTournamentComplete } from '@/lib/gameLogic';
import { getSocket } from '@/lib/socket';
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
  const [toast, setToast] = useState<string | null>(null);
  const latestTournamentRef = useRef<Tournament | null>(null);

  useEffect(() => {
    latestTournamentRef.current = tournament;
  }, [tournament]);

  useEffect(() => {
    // Use requestAnimationFrame for smoother loading
    requestAnimationFrame(() => {
      (async () => {
        // Load tournament from API first; fallback to localStorage
        const id = (params as any)?.id as string;
        let parsedTournament: any = null;
        try {
          const res = await fetch(`/api/tournaments/${id}`, { cache: 'no-store' });
          if (res.ok) {
            parsedTournament = await res.json();
            try { localStorage.setItem('currentTournament', JSON.stringify(parsedTournament)); } catch {}
          }
        } catch {}
        if (!parsedTournament) {
          const storedTournament = localStorage.getItem('currentTournament');
          if (storedTournament) parsedTournament = JSON.parse(storedTournament);
        }
        if (parsedTournament) {
          setTournament(parsedTournament);
          // Join live updates for this tournament
          try {
            const socket = getSocket();
            const joinRoom = () => socket.emit('join-tournament', parsedTournament.accessCode);
            joinRoom();
            socket.io.on('reconnect', joinRoom);
            socket.on('tournament:sync', (serverTournament: Tournament) => {
              // Only accept updates for this tournament id
              if (serverTournament?.id === parsedTournament.id) {
                localStorage.setItem('currentTournament', JSON.stringify(serverTournament));
                setTournament(serverTournament);
              }
            });
            socket.on('toast:score', (payload: any) => {
              if (payload && typeof payload === 'object') {
                const { round, scoreA, scoreB, matchId } = payload as any;

                const base = latestTournamentRef.current || parsedTournament;
                let msg = `Scores updated for Round ${round}: ${scoreA}-${scoreB}`;
                try {
                  const match = base?.matches.find((m: any) => m.id === matchId);
                  const getName = (id: number) => base?.players.find((p: any) => p.id === id)?.name || `P${id}`;
                  if (match) {
                    const teamA = `${getName(match.teamA.player1)}-${getName(match.teamA.player2)}`;
                    const teamB = `${getName(match.teamB.player1)}-${getName(match.teamB.player2)}`;
                    msg = `Round ${round}: ${teamA} vs ${teamB} — ${scoreA}-${scoreB}`;
                  }
                } catch {}

                setToast(msg);
                setTimeout(() => setToast(null), 3000);
              }
            });
          } catch (_) {
            // socket init failed in this environment; silently ignore
          }
          
          // If tournament is complete, show rank tab
          if (isTournamentComplete(parsedTournament)) {
            setActiveTab('rank');
          }
        }
        setLoading(false);
      })();
    });
  }, [params]);

  const handleScoreUpdate = (matchId: number, scoreA: number, scoreB: number, isEdit: boolean = false) => {
    if (!tournament) return;

    if (tournament.isFinalized) return; // guard: no updates after finalize
    const updatedTournament = updateMatchScore(tournament, matchId, scoreA, scoreB, isEdit);
    
    // CRITICAL: Save to localStorage FIRST before any UI updates
    localStorage.setItem('currentTournament', JSON.stringify(updatedTournament));
    
    // Then update the UI state
    setTournament(updatedTournament);

    // Broadcast to all viewers (creator, joiners, spectators)
    try {
      const socket = getSocket();
      const match = updatedTournament.matches.find(m => m.id === matchId);
      socket.emit('tournament:update', {
        tournament: updatedTournament,
        update: match ? {
          matchId: match.id,
          round: match.round,
          scoreA,
          scoreB
        } : undefined
      });
    } catch (_) {
      // ignore if socket not available
    }

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
          
          if (updatedTournament.currentRound === 7 && currentRoundComplete) {
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

    // Fallback: If all matches are completed, make sure we switch to Rank tab
    if (activeTab === 'matches' && isTournamentComplete(updatedTournament)) {
      setActiveTab('rank');
    }
  };

  const handlePlayerUpdate = async (updatedPlayers: string[]) => {
    if (!tournament) return;
    try {
      const res = await fetch(`/api/tournaments/${tournament.id}/players`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ playerNames: updatedPlayers }),
      });
      if (!res.ok) throw new Error('Failed to update players');
      const updated = await res.json();
      setTournament(updated);
      try { localStorage.setItem('currentTournament', JSON.stringify(updated)); } catch {}
      try {
        const socket = getSocket();
        socket.emit('tournament:update', { tournament: updated });
      } catch {}
    } catch (e) {
      // Optimistic: keep local names even if API fails silently, but do nothing extra here
    }
  };

  const handleFinalizeTournament = async () => {
    if (!tournament) return;

    try {
      // Persist to Neon so Home active-state reflects immediately
      const res = await fetch(`/api/tournaments/${tournament.id}/finalize`, { method: 'POST' });
      const updated = res.ok ? await res.json() : { ...tournament, isFinalized: true };

      setTournament(updated);
      try { localStorage.setItem('currentTournament', JSON.stringify(updated)); } catch {}

      // Broadcast finalization so all clients lock immediately
      try {
        const socket = getSocket();
        socket.emit('tournament:update', { tournament: updated });
      } catch {}

      // Save to tournament history locally
      const history = JSON.parse(localStorage.getItem('tournamentHistory') || '[]');
      history.push(updated);
      localStorage.setItem('tournamentHistory', JSON.stringify(history));
    } catch {}
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
    <div className="mobile-container bg-blue-600 min-h-screen safe-area-inset-top safe-area-inset-bottom relative">
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

      {toast && (
        <div className="absolute left-1/2 -translate-x-1/2 bottom-6 bg-black text-white px-4 py-2 rounded-lg text-sm shadow-lg animate-fade-in-out">
          {toast}
        </div>
      )}
    </div>
  );
}
