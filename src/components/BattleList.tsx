import { useBattleLogic } from '../hooks/useBattleLogic';

export default function BattleList() {
  const { 
    hotBattles, 
    waitingBattles, 
    myBattles,
    isLoadingBattles,
    handleViewBattleDetails, 
    handleJoinCommittee,
    handleOpenChallenge
  } = useBattleLogic();
  
  if (isLoadingBattles) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }
  
  return (
    <div className="battle-list space-y-6">
      {/* Trending Battles */}
      <div>
        <h2 className="text-xl font-bold mb-3">Trending Battles</h2>
        
        {hotBattles.length === 0 ? (
          <p className="text-gray-400">No trending battles available.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {hotBattles.map((battle) => (
              <div key={battle.id} className="bg-gray-800 rounded-lg p-4 hover:bg-gray-750 transition">
                <h3 className="font-bold mb-2">{battle.title}</h3>
                <div className="flex justify-between text-sm mb-3">
                  <div className="flex items-center gap-1">
                    <span className="w-3 h-3 rounded-full bg-blue-500"></span>
                    <span>{battle.optionA}</span>
                  </div>
                  <span>vs</span>
                  <div className="flex items-center gap-1">
                    <span>{battle.optionB}</span>
                    <span className="w-3 h-3 rounded-full bg-red-500"></span>
                  </div>
                </div>
                <div className="flex justify-between text-xs text-gray-400 mb-3">
                  <span>Bet: {battle.betAmount} HSK</span>
                  <span>Participants: {battle.participants || 0}</span>
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={() => handleViewBattleDetails(battle)}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm px-3 py-1.5 rounded flex-1"
                  >
                    View Details
                  </button>
                  <button 
                    onClick={() => handleJoinCommittee(battle)}
                    className="bg-purple-600 hover:bg-purple-700 text-white text-sm px-3 py-1.5 rounded flex-1"
                  >
                    Join Committee
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      
      {/* Waiting Battles */}
      <div>
        <h2 className="text-xl font-bold mb-3">Waiting for Opponents</h2>
        
        {waitingBattles.length === 0 ? (
          <p className="text-gray-400">No battles waiting for opponents.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {waitingBattles.map((battle) => (
              <div key={battle.id} className="bg-gray-800 rounded-lg p-4 hover:bg-gray-750 transition border border-yellow-800/30">
                <h3 className="font-bold mb-2">{battle.title}</h3>
                <div className="flex justify-between text-sm mb-3">
                  <div className="flex items-center gap-1">
                    <span className="w-3 h-3 rounded-full bg-yellow-500"></span>
                    <span>{battle.optionA}</span>
                  </div>
                  <span className="text-yellow-400 text-xs">Awaiting Challenger</span>
                </div>
                <div className="flex justify-between text-xs text-gray-400 mb-3">
                  <span>Bet: {battle.betAmount} HSK</span>
                  <span>Status: <span className="text-yellow-400">Waiting</span></span>
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={() => handleViewBattleDetails(battle)}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm px-3 py-1.5 rounded flex-1"
                  >
                    View Details
                  </button>
                  <button 
                    onClick={() => handleOpenChallenge(battle)}
                    className="bg-yellow-600 hover:bg-yellow-700 text-white text-sm px-3 py-1.5 rounded flex-1"
                  >
                    Accept Challenge
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      
      {/* My Battles */}
      <div>
        <h2 className="text-xl font-bold mb-3">My Battles</h2>
        
        {myBattles.length === 0 ? (
          <p className="text-gray-400">You haven't joined any battles yet.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {myBattles.map((battle) => (
              <div key={battle.id} className="bg-gray-800 rounded-lg p-4 hover:bg-gray-750 transition border border-green-800/30">
                <h3 className="font-bold mb-2">{battle.title}</h3>
                <div className="flex justify-between text-sm mb-3">
                  <div className={`flex items-center gap-1 ${battle.myChoice === 'optionA' ? 'text-green-400' : ''}`}>
                    <span className={`w-3 h-3 rounded-full ${battle.myChoice === 'optionA' ? 'bg-green-500' : 'bg-blue-500'}`}></span>
                    <span>{battle.optionA}</span>
                  </div>
                  <span>vs</span>
                  <div className={`flex items-center gap-1 ${battle.myChoice === 'optionB' ? 'text-green-400' : ''}`}>
                    <span>{battle.optionB}</span>
                    <span className={`w-3 h-3 rounded-full ${battle.myChoice === 'optionB' ? 'bg-green-500' : 'bg-red-500'}`}></span>
                  </div>
                </div>
                <div className="flex justify-between text-xs text-gray-400 mb-3">
                  <span>My choice: <span className="text-green-400">{battle.myChoice === 'optionA' ? battle.optionA : battle.optionB}</span></span>
                  <span>Bet: {battle.betAmount} HSK</span>
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={() => handleViewBattleDetails(battle)}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm px-3 py-1.5 rounded flex-1"
                  >
                    View Details
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}