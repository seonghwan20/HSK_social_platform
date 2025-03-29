import { useBattleLogic } from '../hooks/useBattleLogic';
import { BattleStatus } from '../services/contracts/types';
import { useEffect, useState } from 'react';

export default function BattleDetails() {
  const { 
    selectedBattleDetails,
    handleJoinCommittee,
    handleSubmitVote
  } = useBattleLogic();

  const [votingResults, setVotingResults] = useState<{
    player1Votes: number;
    player2Votes: number;
  } | null>(null);

  useEffect(() => {
    if (!selectedBattleDetails?.contractAddress) {
      return;
    }

    const subscribeToVotes = async () => {
      try {
        const { FaucetService } = await import('../services/contracts');
        const faucetService = new FaucetService(window.ethereum);
        const unsubscribe = await faucetService.subscribeToVotingUpdates(
          selectedBattleDetails.contractAddress || '',
          (player1Votes, player2Votes) => {
            setVotingResults({ player1Votes, player2Votes });
          }
        );

        return unsubscribe;
      } catch (error) {
        console.error("Failed to subscribe to voting updates:", error);
      }
    };

    const unsubscribe = subscribeToVotes();
    return () => {
      unsubscribe.then(fn => fn?.());
    };
  }, [selectedBattleDetails?.contractAddress]);

  if (!selectedBattleDetails) {
    return null;
  }

  const renderStatusBadge = (status: BattleStatus | undefined) => {
    if (!status) {
      return null;
    }
    
    if (status.gameEnded) {
      return (
        <div className="bg-red-900/60 text-xs px-2 py-1 rounded-full uppercase tracking-wide font-medium">
          Game Ended
        </div>
      );
    }
    
    if (status.votingPhase) {
      return (
        <div className="bg-purple-900/60 text-xs px-2 py-1 rounded-full uppercase tracking-wide font-medium">
          Voting Phase
        </div>
      );
    }
    
    if (status.committeeRecruitmentOpen) {
      return (
        <div className="bg-yellow-900/60 text-xs px-2 py-1 rounded-full uppercase tracking-wide font-medium">
          Committee Recruitment ({status.committeeCount}/{status.minimumCommittee})
        </div>
      );
    }
    
    if (status.sideBettingOpen) {
      return (
        <div className="bg-green-900/60 text-xs px-2 py-1 rounded-full uppercase tracking-wide font-medium">
          Side Betting Open
        </div>
      );
    }
    
    return null;
  };

  const renderActionButtons = (status: BattleStatus | undefined) => {
    if (!status) {
      return null;
    }
    
    if (status.gameEnded) {
      return (
        <div className="text-center text-gray-400">
          Winner: {status.winner}
        </div>
      );
    }

    if (status.votingPhase) {
      return (
        <button
          onClick={() => handleSubmitVote()}
          className="bg-purple-600 hover:bg-purple-700 text-white py-3 rounded-lg font-medium w-full"
        >
          Submit Vote
        </button>
      );
    }

    if (status.committeeRecruitmentOpen) {
      return (
        <button
          onClick={() => handleJoinCommittee(selectedBattleDetails!)}
          className="bg-yellow-600 hover:bg-yellow-700 text-white py-3 rounded-lg font-medium w-full"
        >
          Join Committee
        </button>
      );
    }

    return null;
  };

  const calculateVotePercentage = (votes: number, total: number) => {
    if (total === 0) return 50;
    return Math.round((votes / total) * 100);
  };

  return (
    <div className="battle-details">
      <div className="mb-4">
        {renderStatusBadge(selectedBattleDetails.status)}
      </div>
      
      <div className="battle-info">
        <h3 className="font-bold text-lg mb-3">{selectedBattleDetails.title}</h3>
        <div className="space-y-3 mb-4">
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span>{selectedBattleDetails.optionA}</span>
              {votingResults && (
                <span className="text-blue-400">
                  {votingResults.player1Votes} votes ({calculateVotePercentage(votingResults.player1Votes, votingResults.player1Votes + votingResults.player2Votes)}%)
                </span>
              )}
            </div>
            <div className="h-2 w-full bg-gray-700 rounded-full overflow-hidden">
              <div 
                className="h-full bg-blue-600 rounded-full transition-all duration-300" 
                style={{
                  width: votingResults ? `${calculateVotePercentage(votingResults.player1Votes, votingResults.player1Votes + votingResults.player2Votes)}%` : '50%'
                }}
              ></div>
            </div>
          </div>
          
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span>{selectedBattleDetails.optionB}</span>
              {votingResults && (
                <span className="text-red-400">
                  {votingResults.player2Votes} votes ({calculateVotePercentage(votingResults.player2Votes, votingResults.player1Votes + votingResults.player2Votes)}%)
                </span>
              )}
            </div>
            <div className="h-2 w-full bg-gray-700 rounded-full overflow-hidden">
              <div 
                className="h-full bg-red-600 rounded-full transition-all duration-300"
                style={{
                  width: votingResults ? `${calculateVotePercentage(votingResults.player2Votes, votingResults.player1Votes + votingResults.player2Votes)}%` : '50%'
                }}
              ></div>
            </div>
          </div>
        </div>
        
        {renderActionButtons(selectedBattleDetails.status)}
      </div>
    </div>
  );
} 