'use client';

interface TournamentHeaderProps {
  date: string;
  accessCode: string;
  activeTab: 'players' | 'matches' | 'rank';
  onTabChange: (tab: 'players' | 'matches' | 'rank') => void;
}

export default function TournamentHeader({ 
  date, 
  accessCode, 
  activeTab, 
  onTabChange 
}: TournamentHeaderProps) {
  const formatDate = (dateString: string) => {
    // Interpret stored YYYY-MM-DD as Pacific Time
    const [y, m, d] = dateString.split('-').map(Number);
    const pacific = new Date(Date.UTC(y, (m || 1) - 1, d || 1));
    return pacific.toLocaleDateString('en-US', {
      timeZone: 'America/Los_Angeles',
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <div className="bg-white mx-[4%] mt-[3.5%] rounded-t-xl">
      {/* Date and Access Code Header */}
      <div className="px-4 py-2.5 border-b border-gray-200 flex justify-between items-center">
        <div className="text-sm text-gray-600">
          {formatDate(date)}
        </div>
        <div className="text-sm text-gray-600">
          <span className="font-semibold">Code: </span>
          <span className="font-mono">{accessCode}</span>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex">
        <button
          onClick={() => onTabChange('players')}
          className={`flex-1 py-3 text-center font-semibold transition-colors ${
            activeTab === 'players'
              ? 'bg-blue-500 text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          Players
        </button>
        <button
          onClick={() => onTabChange('matches')}
          className={`flex-1 py-3 text-center font-semibold transition-colors ${
            activeTab === 'matches'
              ? 'bg-blue-500 text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          Matches
        </button>
        <button
          onClick={() => onTabChange('rank')}
          className={`flex-1 py-3 text-center font-semibold transition-colors ${
            activeTab === 'rank'
              ? 'bg-blue-500 text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          Rank
        </button>
      </div>
    </div>
  );
}
