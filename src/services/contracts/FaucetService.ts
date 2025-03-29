import { ethers } from 'ethers';
import { Faucet, Faucet__factory } from '../../../contracts/typechain-types';
import { BattleStatus } from './types';

const BATTLE_FACTORY_ABI = [
  "function createBattle(uint256 battleId, address player1, uint256 minimumCommittee, uint256 betAmount) external payable returns (address)",
  "function acceptBattle(uint256 battleId, address player2) external returns (address)",
  "function getBattleContracts(uint256 battleId) external view returns (address, address)",
  "function isBattleAccepted(uint256 battleId) external view returns (bool)",
  "function getAllBattleIds() external view returns (uint256[] memory)",
  "event BattleCreated(uint256 indexed battleId, address indexed battleContract)",
  "event SideBettingCreated(uint256 indexed battleId, address indexed sideBettingContract)"
];

export class FaucetService {
  private provider: ethers.Provider | null;
  private signer: ethers.Signer | null;
  
  constructor(provider: ethers.Provider | null) {
    this.provider = provider;
    this.signer = null;
    
    if (provider && typeof window !== 'undefined' && window.ethereum) {
      this.initializeSigner();
    }
  }
  
  private async initializeSigner() {
    try {
      if (this.provider) {
        const provider = new ethers.BrowserProvider(window.ethereum);
        this.signer = await provider.getSigner();
      }
    } catch (error) {
      console.error("Failed to initialize signer:", error);
    }
  }
  
  /**
   * Connect to an existing Faucet contract
   */
  async connectToContract(contractAddress: string): Promise<Faucet | null> {
    try {
      if (!this.provider) {
        throw new Error("Provider not set");
      }
      
      if (!this.signer) {
        await this.initializeSigner();
      }
      
      if (!this.signer) {
        throw new Error("Signer not available");
      }
      
      return Faucet__factory.connect(contractAddress, this.signer);
    } catch (error) {
      console.error("Failed to connect to Faucet contract:", error);
      return null;
    }
  }
  
  /**
   * Get game status from Faucet contract
   */
  async getGameStatus(contractAddress: string): Promise<{
    success: boolean;
    isActive?: boolean;
    isValid?: boolean;
    inVotingPhase?: boolean;
    deadline?: number;
    currentCommitteeCount?: number;
    requiredCommitteeCount?: number;
    timeRemaining?: number;
    message?: string;
  }> {
    try {
      const contract = await this.connectToContract(contractAddress);
      
      if (!contract) {
        throw new Error("Failed to connect to contract");
      }
      
      const status = await contract.getGameStatus();
      
      return {
        success: true,
        isActive: status[0],
        isValid: status[1],
        inVotingPhase: status[2],
        deadline: Number(status[3]),
        currentCommitteeCount: Number(status[4]),
        requiredCommitteeCount: Number(status[5]),
        timeRemaining: Number(status[6])
      };
    } catch (error) {
      console.error("Failed to get game status:", error);
      return {
        success: false,
        message: error instanceof Error ? error.message : "Unknown error"
      };
    }
  }
  
  /**
   * Get players from Faucet contract
   */
  async getPlayers(contractAddress: string): Promise<{
    success: boolean;
    player1?: string;
    player2?: string;
    message?: string;
  }> {
    try {
      const contract = await this.connectToContract(contractAddress);
      
      if (!contract) {
        throw new Error("Failed to connect to contract");
      }
      
      const players = await contract.getPlayers();
      
      return {
        success: true,
        player1: players[0],
        player2: players[1]
      };
    } catch (error) {
      console.error("Failed to get players:", error);
      return {
        success: false,
        message: error instanceof Error ? error.message : "Unknown error"
      };
    }
  }
  
  /**
   * Fund a game with bet amount
   */
  async fundGame(contractAddress: string, betAmount: string): Promise<{
    success: boolean;
    txHash?: string;
    message?: string;
  }> {
    try {
      const contract = await this.connectToContract(contractAddress);
      
      if (!contract) {
        throw new Error("Failed to connect to contract");
      }
      
      const tx = await contract.FundGame({
        value: ethers.parseEther(betAmount)
      });
      
      console.log("Fund game transaction sent:", tx.hash);
      
      const receipt = await tx.wait();
      console.log("Fund game transaction confirmed:", receipt);
      
      return {
        success: true,
        txHash: tx.hash
      };
    } catch (error) {
      console.error("Failed to fund game:", error);
      return {
        success: false,
        message: error instanceof Error ? error.message : "Unknown error"
      };
    }
  }
  
  /**
   * Start a game
   */
  async startGame(contractAddress: string, durationInDays: number): Promise<{
    success: boolean;
    txHash?: string;
    message?: string;
  }> {
    try {
      const contract = await this.connectToContract(contractAddress);
      
      if (!contract) {
        throw new Error("Failed to connect to contract");
      }
      
      const tx = await contract.startGame(durationInDays);
      
      console.log("Start game transaction sent:", tx.hash);
      
      const receipt = await tx.wait();
      console.log("Start game transaction confirmed:", receipt);
      
      return {
        success: true,
        txHash: tx.hash
      };
    } catch (error) {
      console.error("Failed to start game:", error);
      return {
        success: false,
        message: error instanceof Error ? error.message : "Unknown error"
      };
    }
  }
  
  /**
   * Add committee member
   */
  async addCommittee(contractAddress: string, memberAddress: string): Promise<{
    success: boolean;
    txHash?: string;
    message?: string;
  }> {
    try {
      const contract = await this.connectToContract(contractAddress);
      
      if (!contract) {
        throw new Error("Failed to connect to contract");
      }
      
      const tx = await contract.addCommittee(memberAddress);
      
      console.log("Add committee transaction sent:", tx.hash);
      
      const receipt = await tx.wait();
      console.log("Add committee transaction confirmed:", receipt);
      
      return {
        success: true,
        txHash: tx.hash
      };
    } catch (error) {
      console.error("Failed to add committee member:", error);
      return {
        success: false,
        message: error instanceof Error ? error.message : "Unknown error"
      };
    }
  }
  
  /**
   * Check game status
   */
  async checkGameStatus(contractAddress: string): Promise<{
    success: boolean;
    status?: string;
    txHash?: string;
    message?: string;
  }> {
    try {
      const contract = await this.connectToContract(contractAddress);
      
      if (!contract) {
        throw new Error("Failed to connect to contract");
      }
      
      const tx = await contract.checkGameStatus();
      
      console.log("Check game status transaction sent:", tx.hash);
      
      const receipt = await tx.wait();
      console.log("Check game status transaction confirmed:", receipt);
      
      // We can't get the return value directly from a transaction
      // You would need to handle events or call a view function afterward
      
      return {
        success: true,
        txHash: tx.hash
      };
    } catch (error) {
      console.error("Failed to check game status:", error);
      return {
        success: false,
        message: error instanceof Error ? error.message : "Unknown error"
      };
    }
  }
  
  /**
   * Cancel a game
   */
  async cancelGame(contractAddress: string): Promise<{
    success: boolean;
    txHash?: string;
    message?: string;
  }> {
    try {
      const contract = await this.connectToContract(contractAddress);
      
      if (!contract) {
        throw new Error("Failed to connect to contract");
      }
      
      const tx = await contract.cancelGame();
      
      console.log("Cancel game transaction sent:", tx.hash);
      
      const receipt = await tx.wait();
      console.log("Cancel game transaction confirmed:", receipt);
      
      return {
        success: true,
        txHash: tx.hash
      };
    } catch (error) {
      console.error("Failed to cancel game:", error);
      return {
        success: false,
        message: error instanceof Error ? error.message : "Unknown error"
      };
    }
  }
  
  /**
   * Withdraw funds
   */
  async withdraw(contractAddress: string, amount: string): Promise<{
    success: boolean;
    txHash?: string;
    message?: string;
  }> {
    try {
      const contract = await this.connectToContract(contractAddress);
      
      if (!contract) {
        throw new Error("Failed to connect to contract");
      }
      
      const tx = await contract.withdraw(ethers.parseEther(amount));
      
      console.log("Withdraw transaction sent:", tx.hash);
      
      const receipt = await tx.wait();
      console.log("Withdraw transaction confirmed:", receipt);
      
      return {
        success: true,
        txHash: tx.hash
      };
    } catch (error) {
      console.error("Failed to withdraw funds:", error);
      return {
        success: false,
        message: error instanceof Error ? error.message : "Unknown error"
      };
    }
  }

  /**
   * Get real-time battle status
   */
  async getBattleStatus(contractAddress: string): Promise<{
    success: boolean;
    status?: BattleStatus;
    message?: string;
  }> {
    try {
      const contract = await this.connectToContract(contractAddress);
      if (!contract) {
        throw new Error("Failed to connect to contract");
      }

      const [
        isActive,
        gameDeadline,
        committeeCount,
        minimumCommittee,
        gameValid,
        gameStatus
      ] = await Promise.all([
        contract.gameActive(),
        contract.gameDeadline(),
        contract.committeeCount(),
        contract.minimumCommittee(),
        contract.gameValid(),
        contract.getGameStatus()
      ]);

      const currentTime = Math.floor(Date.now() / 1000);
      const sideBettingDeadline = Number(gameDeadline) - (7 * 24 * 60 * 60); // 7일 전에 사이드베팅 종료
      const votingDeadline = Number(gameDeadline);

      return {
        success: true,
        status: {
          isActive,
          sideBettingOpen: isActive && currentTime < sideBettingDeadline,
          sideBettingDeadline,
          committeeRecruitmentOpen: isActive && currentTime >= sideBettingDeadline && Number(committeeCount) < Number(minimumCommittee),
          committeeCount: Number(committeeCount),
          minimumCommittee: Number(minimumCommittee),
          votingPhase: isActive && Number(committeeCount) >= Number(minimumCommittee) && currentTime < votingDeadline,
          votingDeadline,
          gameEnded: !isActive,
          winner: gameStatus[0] ? await contract.player1() : await contract.player2()
        }
      };
    } catch (error) {
      console.error("Failed to get battle status:", error);
      return {
        success: false,
        message: error instanceof Error ? error.message : "Unknown error occurred while getting battle status"
      };
    }
  }

  /**
   * Subscribe to battle status changes
   */
  async subscribeToBattleStatus(
    contractAddress: string,
    callback: (status: BattleStatus) => void
  ): Promise<() => void> {
    const contract = await this.connectToContract(contractAddress);
    if (!contract) {
      throw new Error("Failed to connect to contract");
    }

    // 이벤트 리스너 등록
    const listeners = [
      contract.on(contract.filters.GameStarted, async () => {
        const status = await this.getBattleStatus(contractAddress);
        if (status.success && status.status) {
          callback(status.status);
        }
      }),
      contract.on(contract.filters.MinimumCommitteeMet, async () => {
        const status = await this.getBattleStatus(contractAddress);
        if (status.success && status.status) {
          callback(status.status);
        }
      }),
      contract.on(contract.filters.VotingPhaseStarted, async () => {
        const status = await this.getBattleStatus(contractAddress);
        if (status.success && status.status) {
          callback(status.status);
        }
      }),
      contract.on(contract.filters.GameEnded, async () => {
        const status = await this.getBattleStatus(contractAddress);
        if (status.success && status.status) {
          callback(status.status);
        }
      })
    ];

    // 초기 상태 가져오기
    const initialStatus = await this.getBattleStatus(contractAddress);
    if (initialStatus.success && initialStatus.status) {
      callback(initialStatus.status);
    }

    // 구독 해제 함수 반환
    return () => {
      contract.removeAllListeners();
    };
  }

  /**
   * Get voting results
   */
  async getVotingResults(contractAddress: string): Promise<{
    success: boolean;
    player1Votes?: number;
    player2Votes?: number;
    message?: string;
  }> {
    try {
      const contract = await this.connectToContract(contractAddress);
      if (!contract) {
        throw new Error("Failed to connect to contract");
      }

      const gameStatus = await contract.getGameStatus();
      const [player1, player2] = await Promise.all([
        contract.player1(),
        contract.player2()
      ]);

      // 게임 상태에서 투표 결과를 계산
      const player1Votes = gameStatus[0] ? 1 : 0;
      const player2Votes = gameStatus[0] ? 0 : 1;

      return {
        success: true,
        player1Votes,
        player2Votes
      };
    } catch (error) {
      console.error("Failed to get voting results:", error);
      return {
        success: false,
        message: error instanceof Error ? error.message : "Unknown error occurred while getting voting results"
      };
    }
  }

  /**
   * Subscribe to voting updates
   */
  async subscribeToVotingUpdates(
    contractAddress: string,
    callback: (player1Votes: number, player2Votes: number) => void
  ): Promise<() => void> {
    const contract = await this.connectToContract(contractAddress);
    if (!contract) {
      throw new Error("Failed to connect to contract");
    }

    // 투표 이벤트 리스너 등록
    await contract.on(contract.filters.GameEnded, async () => {
      const results = await this.getVotingResults(contractAddress);
      if (results.success && results.player1Votes !== undefined && results.player2Votes !== undefined) {
        callback(results.player1Votes, results.player2Votes);
      }
    });

    // 초기 투표 결과 가져오기
    const initialResults = await this.getVotingResults(contractAddress);
    if (initialResults.success && initialResults.player1Votes !== undefined && initialResults.player2Votes !== undefined) {
      callback(initialResults.player1Votes, initialResults.player2Votes);
    }

    // 구독 해제 함수 반환
    return () => {
      contract.removeAllListeners();
    };
  }
}

// Add window.ethereum type declaration
declare global {
  interface Window {
    ethereum: any;
  }
}