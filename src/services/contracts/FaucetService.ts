import { ethers } from 'ethers';
import { Faucet, Faucet__factory } from '../../../contracts/typechain-types';

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
  }8
  
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
}

// Add window.ethereum type declaration
declare global {
  interface Window {
    ethereum: any;
  }
}