import { ethers } from 'ethers';
import { SideBetting, SideBetting__factory } from '../../../contracts/typechain-types';

export class SideBettingService {
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
   * Connect to an existing SideBetting contract
   */
  async connectToContract(contractAddress: string): Promise<SideBetting | null> {
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
      
      return SideBetting__factory.connect(contractAddress, this.signer);
    } catch (error) {
      console.error("Failed to connect to SideBetting contract:", error);
      return null;
    }
  }
  
  /**
   * Place a bet on a game
   */
  async placeBet(contractAddress: string, gameId: number, playerChoice: string, betAmount: string): Promise<{
    success: boolean;
    txHash?: string;
    message?: string;
  }> {
    try {
      const contract = await this.connectToContract(contractAddress);
      
      if (!contract) {
        throw new Error("Failed to connect to contract");
      }
      
      // Convert bet amount to wei
      const betAmountWei = ethers.parseEther(betAmount);
      
      const tx = await contract.placeBet(gameId, playerChoice, {
        value: betAmountWei
      });
      
      console.log("Place bet transaction sent:", tx.hash);
      
      const receipt = await tx.wait();
      console.log("Place bet transaction confirmed:", receipt);
      
      return {
        success: true,
        txHash: tx.hash
      };
    } catch (error) {
      console.error("Failed to place bet:", error);
      return {
        success: false,
        message: error instanceof Error ? error.message : "Unknown error"
      };
    }
  }
  
  /**
   * Calculate odds for a player
   */
  async calculateOdds(contractAddress: string, gameId: number, playerChoice: string): Promise<{
    success: boolean;
    odds?: string;
    message?: string;
  }> {
    try {
      const contract = await this.connectToContract(contractAddress);
      
      if (!contract) {
        throw new Error("Failed to connect to contract");
      }
      
      const odds = await contract.calculateOdds(gameId, playerChoice);
      
      // Format odds - they are returned as a percentage multiplied by 10000
      // So 1.5x odds would be 15000
      const formattedOdds = (Number(odds) / 10000).toFixed(2) + 'x';
      
      return {
        success: true,
        odds: formattedOdds
      };
    } catch (error) {
      console.error("Failed to calculate odds:", error);
      return {
        success: false,
        message: error instanceof Error ? error.message : "Unknown error"
      };
    }
  }
  
  /**
   * Claim winnings from a bet
   */
  async claimWinnings(contractAddress: string, gameId: number, betIndices: number[]): Promise<{
    success: boolean;
    txHash?: string;
    message?: string;
  }> {
    try {
      const contract = await this.connectToContract(contractAddress);
      
      if (!contract) {
        throw new Error("Failed to connect to contract");
      }
      
      const tx = await contract.claimWinnings(gameId, betIndices);
      
      console.log("Claim winnings transaction sent:", tx.hash);
      
      const receipt = await tx.wait();
      console.log("Claim winnings transaction confirmed:", receipt);
      
      return {
        success: true,
        txHash: tx.hash
      };
    } catch (error) {
      console.error("Failed to claim winnings:", error);
      return {
        success: false,
        message: error instanceof Error ? error.message : "Unknown error"
      };
    }
  }
  
  /**
   * Get game statistics
   */
  async getGameStats(contractAddress: string, gameId: number): Promise<{
    success: boolean;
    totalPool?: string;
    winner?: string;
    resultSet?: boolean;
    player1BetAmount?: string;
    player2BetAmount?: string;
    message?: string;
  }> {
    try {
      const contract = await this.connectToContract(contractAddress);
      
      if (!contract) {
        throw new Error("Failed to connect to contract");
      }
      
      const stats = await contract.getGameStats(gameId);
      
      return {
        success: true,
        totalPool: ethers.formatEther(stats[0]),
        winner: stats[1],
        resultSet: stats[2],
        player1BetAmount: ethers.formatEther(stats[3]),
        player2BetAmount: ethers.formatEther(stats[4])
      };
    } catch (error) {
      console.error("Failed to get game stats:", error);
      return {
        success: false,
        message: error instanceof Error ? error.message : "Unknown error"
      };
    }
  }
  
  /**
   * Set game result (admin only)
   */
  async setGameResult(contractAddress: string, gameId: number): Promise<{
    success: boolean;
    txHash?: string;
    message?: string;
  }> {
    try {
      const contract = await this.connectToContract(contractAddress);
      
      if (!contract) {
        throw new Error("Failed to connect to contract");
      }
      
      const tx = await contract.setGameResult(gameId);
      
      console.log("Set game result transaction sent:", tx.hash);
      
      const receipt = await tx.wait();
      console.log("Set game result transaction confirmed:", receipt);
      
      return {
        success: true,
        txHash: tx.hash
      };
    } catch (error) {
      console.error("Failed to set game result:", error);
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