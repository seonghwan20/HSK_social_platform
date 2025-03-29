import { ethers } from 'ethers';
import { SideBetting, SideBetting__factory } from '../../../contracts/typechain-types';
import { formatEther } from '../../utils/ethers';

// Hashkey Testnet RPC URL
const HASHKEY_RPC_URL = process.env.NEXT_PUBLIC_RPC_URL || 'https://hashkeychain-testnet.alt.technology';

export class SideBettingService {
  private provider: ethers.Provider | null;
  private signer: ethers.Signer | null;
  private defaultProvider: ethers.Provider | null = null;
  
  constructor(provider: ethers.Provider | null) {
    this.provider = provider;
    this.signer = null;
    
    if (provider && typeof window !== 'undefined' && window.ethereum) {
      this.initializeSigner();
    }

    // 기본 프로바이더 초기화 (읽기 전용)
    this.initializeDefaultProvider();
  }
  
  private async initializeSigner() {
    try {
      if (this.provider) {
        // ENS 비활성화된 provider 생성
        const provider = new ethers.BrowserProvider(window.ethereum, {
          chainId: 133, // HashKey Testnet chainId
          name: 'HashKey Testnet',
          ensAddress: undefined // ENS 비활성화
        });
        this.signer = await provider.getSigner();
      }
    } catch (error) {
      console.error("Failed to initialize signer:", error);
    }
  }

  private initializeDefaultProvider() {
    try {
      // Hashkey testnet RPC URL로 직접 연결
      this.defaultProvider = new ethers.JsonRpcProvider(HASHKEY_RPC_URL);
      console.log("SideBettingService: Default provider initialized");
    } catch (error) {
      console.error("SideBettingService: Failed to initialize default provider:", error);
    }
  }
  
  /**
   * Connect to an existing SideBetting contract
   */
  async connectToContract(contractAddress: string): Promise<SideBetting | null> {
    try {
      if (!this.provider && !this.defaultProvider) {
        throw new Error("No provider available");
      }
      
      if (this.signer) {
        // 사이너가 있는 경우 쓰기 가능한 컨트랙트 인스턴스 반환
        return SideBetting__factory.connect(contractAddress, this.signer);
      } else if (this.defaultProvider) {
        // 사이너가 없는 경우 읽기 전용 컨트랙트 인스턴스 반환
        return SideBetting__factory.connect(contractAddress, this.defaultProvider);
      } else if (this.provider) {
        // 사이너가 없지만 프로바이더가 있는 경우 읽기 전용 컨트랙트 인스턴스 반환
        return SideBetting__factory.connect(contractAddress, this.provider);
      } else {
        throw new Error("No provider or signer available");
      }
    } catch (error) {
      console.error("Failed to connect to SideBetting contract:", error);
      return null;
    }
  }
  
  /**
   * Place a bet on a game
   */
  async placeBet(
    contractAddress: string,
    battleId: number,
    playerChoice: string,
    betAmount: string
  ): Promise<{
    success: boolean;
    message?: string;
    txHash?: string;
  }> {
    try {
      // 사이너가 필요한 작업이므로 사이너 확인
      if (!this.signer) {
        throw new Error("Wallet not connected. Please connect your wallet to place a bet.");
      }
      
      const contract = await this.connectToContract(contractAddress);
      
      if (!contract) {
        throw new Error("Failed to connect to contract");
      }
      
      // Convert bet amount to HSK
      const betAmountGwei = ethers.parseUnits(betAmount, 'gwei');
      
      console.log(`Placing bet on contract ${contractAddress}, battle ID ${battleId}, player choice ${playerChoice}, amount ${betAmount} HSK`);
      
      const tx = await contract.placeBet(battleId, playerChoice, {
        value: betAmountGwei
      });
      
      console.log("Bet transaction sent:", tx.hash);
      
      const receipt = await tx.wait();
      console.log("Bet transaction confirmed:", receipt);
      
      if (!receipt) {
        throw new Error("Transaction failed: No receipt received");
      }
      
      return {
        success: true,
        txHash: tx.hash
      };
    } catch (error) {
      console.error("Failed to place bet:", error);
      
      // 사용자 친화적인 오류 메시지
      let errorMessage = "Failed to place bet";
      if (error instanceof Error) {
        // 오류 메시지에서 필요한 정보 추출
        if (error.message.includes("insufficient funds")) {
          errorMessage = "Insufficient funds in your wallet";
        } else if (error.message.includes("user rejected transaction")) {
          errorMessage = "Transaction rejected by user";
        } else {
          errorMessage = error.message;
        }
      }
      
      return {
        success: false,
        message: errorMessage
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
      // 사이너가 필요한 작업이므로 사이너 확인
      if (!this.signer) {
        throw new Error("Wallet not connected. Please connect your wallet to claim winnings.");
      }
      
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
        totalPool: formatEther(stats[0]),
        winner: stats[1],
        resultSet: stats[2],
        player1BetAmount: formatEther(stats[3]),
        player2BetAmount: formatEther(stats[4])
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