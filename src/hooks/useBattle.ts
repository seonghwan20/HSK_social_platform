import { useBattleLogic } from './useBattleLogic';

/**
 * This hook is a wrapper around useBattleLogic for backward compatibility
 * with existing components that use useBattle
 */
export function useBattle(provider?: any) {
  const {
    // Get all the battle-related state and functions from useBattleLogic
    hotBattles: battles,
    selectedBattleDetails,
    handleFileUpload,
    handleViewBattleDetails,
    handleJoinCommittee,
    handleCreateBattle,
    ...rest
  } = useBattleLogic();
  
  return {
    // Return with the same API as before
    battles,
    selectedBattleDetails,
    handleFileUpload,
    handleViewBattleDetails,
    handleJoinCommittee,
    handleCreateBattle,
    ...rest
  };
}