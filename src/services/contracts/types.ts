// Common interfaces and types for contract services

// Faucet contract interfaces
export interface GameStatus {
  isActive: boolean;
  isValid: boolean;
  inVotingPhase: boolean;
  deadline: number;
  currentCommitteeCount: number;
  requiredCommitteeCount: number;
  timeRemaining: number;
}

export interface Players {
  player1: string;
  player2: string;
}

// SideBetting contract interfaces
export interface BetInfo {
  bettor: string;
  amount: string;
  playerChoice: string;
  claimed: boolean;
}

export interface GameStats {
  totalPool: string;
  winner: string;
  resultSet: boolean;
  player1BetAmount: string;
  player2BetAmount: string;
}

// Battle Factory interfaces
export interface BattleInfo {
  id: number;
  battleContract: string;
  sideBettingContract: string;
  player1: string;
  player2: string;
  betAmount: string;
  isAccepted: boolean;
}

// Wallet connection interfaces
export interface NetworkInfo {
  chainId: string;
  name: string;
  isCorrectNetwork: boolean;
}

export interface WalletConnectionInfo {
  connected: boolean;
  address?: string;
  networkInfo?: NetworkInfo;
  error?: string;
}

export interface BattleStatus {
  isActive: boolean;
  sideBettingOpen: boolean;
  sideBettingDeadline: number;
  committeeRecruitmentOpen: boolean;
  committeeCount: number;
  minimumCommittee: number;
  votingPhase: boolean;
  votingDeadline: number;
  gameEnded: boolean;
  winner?: string;
}