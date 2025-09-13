'use client';

import { useState } from 'react';
import { Player } from '@/lib/gameLogic';
import { PencilIcon } from '@heroicons/react/24/outline';

interface PlayersTabProps {
  players: Player[];
  onUpdatePlayers: (updatedNames: string[]) => void;
  isFinalized: boolean;
}

export default function PlayersTab({ players, onUpdatePlayers, isFinalized }: PlayersTabProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedNames, setEditedNames] = useState(players.map(p => p.name));

  const handleStartEdit = () => {
    setIsEditing(true);
    setEditedNames(players.map(p => p.name));
  };

  const handleSaveEdit = () => {
    onUpdatePlayers(editedNames);
    setIsEditing(false);
  };

  const handleCancelEdit = () => {
    setEditedNames(players.map(p => p.name));
    setIsEditing(false);
  };

  // Keep editedNames in sync with latest players when not actively editing
  // so inputs are pre-populated correctly when entering edit mode later
  useEffect(() => {
    if (!isEditing) {
      setEditedNames(players.map(p => p.name));
    }
  }, [players, isEditing]);

  const handleNameChange = (index: number, value: string) => {
    const newNames = [...editedNames];
    newNames[index] = value;
    setEditedNames(newNames);
  };

  const isValidNames = () => {
    const nonEmptyNames = editedNames.filter(name => name.trim() !== '');
    const uniqueNames = new Set(nonEmptyNames.map(name => name.trim().toLowerCase()));
    return nonEmptyNames.length === 8 && uniqueNames.size === 8;
  };

  return (
    <div className="p-4 w-full max-w-full">
      <div className="w-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <PencilIcon className="w-5 h-5 mr-2" />
          <h3 className="text-lg font-bold">
            {isEditing ? 'Edit Players' : 'Players'}
          </h3>
        </div>
        <div className="text-sm text-gray-600">
          <span className="font-semibold">8/8</span>
        </div>
      </div>

      {/* Removed instructional text per request */}

      {/* Player List */}
      <div className="space-y-3 mb-6">
        {players.map((player, index) => (
          <div key={player.id} className="flex items-center">
            <div className="player-button w-12 h-12 flex items-center justify-center mr-3 text-sm">
              P{player.id}
            </div>
            <div className="flex-1">
              {isEditing ? (
                <input
                  type="text"
                  value={editedNames[index] ?? player.name}
                  onChange={(e) => handleNameChange(index, e.target.value)}
                  className="w-full px-3 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter player name"
                />
              ) : (
                <div className="px-3 py-3 bg-gray-50 rounded-md font-medium">
                  {player.name}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Action Buttons */}
      <div className="space-y-3">
        {!isEditing ? (
          <button
            onClick={handleStartEdit}
            disabled={isFinalized}
            className={`w-full py-4 rounded-lg font-semibold transition-colors ${
              isFinalized
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-black text-white hover:bg-gray-800'
            }`}
          >
            <PencilIcon className="w-5 h-5 inline mr-2" />
            {isFinalized ? 'Tournament Finalized' : 'Update Players'}
          </button>
        ) : (
          <div className="space-y-3">
            <button
              onClick={handleSaveEdit}
              disabled={!isValidNames()}
              className={`w-full py-4 rounded-lg font-semibold transition-colors ${
                isValidNames()
                  ? 'bg-green-500 text-white hover:bg-green-600'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              Save Changes
            </button>
            <button
              onClick={handleCancelEdit}
              className="w-full py-4 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300 transition-colors"
            >
              Cancel
            </button>
          </div>
        )}
      </div>

      {isEditing && !isValidNames() && (
        <div className="mt-4 p-3 bg-yellow-100 border border-yellow-400 rounded text-yellow-700 text-sm">
          <p className="font-semibold">Validation Error</p>
          <p>All player names must be filled and unique.</p>
        </div>
      )}
      </div>
    </div>
  );
}
