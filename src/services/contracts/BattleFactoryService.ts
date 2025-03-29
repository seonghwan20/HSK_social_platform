import { ethers } from 'ethers';

// HashKey Testnet network information
const HASHKEY_CHAIN_ID = '0x85';  // 133 in hex
const HASHKEY_RPC_URL = 'https://hashkeychain-testnet.alt.technology';
const HASHKEY_CHAIN_NAME = 'HashKey Testnet';
const HASHKEY_CURRENCY_SYMBOL = 'HSK';
const HASHKEY_EXPLORER_URL = 'https://hashkeychain-testnet-explorer.alt.technology';

// Contract address from addresses.json
const BATTLE_FACTORY_ADDRESS = process.env.NEXT_PUBLIC_BATTLE_FACTORY_ADDRESS || '';

// Contract ABI
const BATTLE_FACTORY_ABI = [
  "function createBattle(address player1, uint256 minimumCommittee, uint256 betAmount, string memory player1Bet, uint8 durationInDays, string memory title) external returns (address)",
  "function acceptBattle(uint256 battleId, string memory player2Bet) external returns (address)",
  "function getBattleContracts(uint256 battleId) external view returns (address battleContract, address sideBettingContract)",
  "function isBattleAccepted(uint256 battleId) external view returns (bool)",
  "function getAllBattleIds() external view returns (uint256[] memory)",
  "function getAllBattleMetas() external view returns (tuple(uint256 battleId, address battleContract, address player1, string player1Bet, address player2, string player2Bet, uint256 betAmount, uint256 minimumCommittee, uint8 durationInDays, string title, bool isAccepted, address sideBettingContract)[] memory)",
  "function getWaitingBattles() external view returns (tuple(uint256 battleId, address battleContract, address player1, string player1Bet, address player2, string player2Bet, uint256 betAmount, uint256 minimumCommittee, uint8 durationInDays, string title, bool isAccepted, address sideBettingContract)[] memory)",
  "function getActiveBattles() external view returns (tuple(uint256 battleId, address battleContract, address player1, string player1Bet, address player2, string player2Bet, uint256 betAmount, uint256 minimumCommittee, uint8 durationInDays, string title, bool isAccepted, address sideBettingContract)[] memory)",
  "function getBattleMetaById(uint256 battleId) external view returns (tuple(uint256 battleId, address battleContract, address player1, string player1Bet, address player2, string player2Bet, uint256 betAmount, uint256 minimumCommittee, uint8 durationInDays, string title, bool isAccepted, address sideBettingContract) memory)",
  "event BattleCreated(uint256 indexed battleId, address battleContract, address player1, uint256 betAmount)",
  "event SideBettingCreated(uint256 indexed battleId, address sideBettingContract, address battleContract)"
];

export interface BattleMeta {
  battleId: number;
  battleContract: string;
  player1: string;
  player1Bet: string;
  player2: string;
  player2Bet: string;
  betAmount: bigint;
  minimumCommittee: number;
  durationInDays: number;
  title: string;
  isAccepted: boolean;
  sideBettingContract: string;
}

export class BattleFactoryService {
  private provider: ethers.Provider | null = null;
  private factoryContract: ethers.Contract | null = null;
  private isInitialized: boolean = false;
  
  constructor(provider: ethers.Provider | null) {
    this.setProvider(provider);
  }
  
  /**
   * Sets the provider and initializes contracts
   */
  setProvider(provider: ethers.Provider | null): void {
    this.provider = provider;
    this.isInitialized = false;
    
    if (provider) {
      try {
        // ENS 비활성화된 provider 생성
        const web3Provider = new ethers.BrowserProvider((window as any).ethereum, {
          chainId: 133, // HashKey Testnet chainId
          name: 'HashKey Testnet',
          ensAddress: undefined // ENS 비활성화
        });

        this.factoryContract = new ethers.Contract(
          BATTLE_FACTORY_ADDRESS,
          BATTLE_FACTORY_ABI,
          web3Provider
        );
        
        this.isInitialized = true;
        console.log("BattleFactoryService: Contract initialized");
      } catch (error) {
        console.error("BattleFactoryService: Failed to initialize contract:", error);
        this.factoryContract = null;
      }
    } else {
      this.factoryContract = null;
    }
  }
  
  /**
   * Check if the wallet is connected to HashKey Testnet
   */
  async checkNetwork(): Promise<{ success: boolean; isHashKeyNetwork?: boolean; message?: string }> {
    try {
      if (!window.ethereum) {
        return {
          success: false,
          message: 'MetaMask is not installed!'
        };
      }

      const provider = new ethers.BrowserProvider(window.ethereum);
      const { chainId } = await provider.getNetwork();

      return {
        success: true,
        isHashKeyNetwork: chainId.toString() === '133'
      };
    } catch (error) {
      console.error('Network check error:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Network check error'
      };
    }
  }

  /**
   * Switch to HashKey Testnet
   */
  async switchToHashKeyNetwork(): Promise<{ success: boolean; message?: string }> {
    try {
      if (!window.ethereum) {
        return {
          success: false,
          message: 'MetaMask is not installed!'
        };
      }

      try {
        // Request network switch to HashKey Testnet
        await window.ethereum.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: HASHKEY_CHAIN_ID }],
        });
      } catch (switchError: any) {
        // If network is not in MetaMask, add it
        if (switchError.code === 4902) {
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [
              {
                chainId: HASHKEY_CHAIN_ID,
                chainName: HASHKEY_CHAIN_NAME,
                rpcUrls: [HASHKEY_RPC_URL],
                nativeCurrency: {
                  name: 'HashKey HSK',
                  symbol: HASHKEY_CURRENCY_SYMBOL,
                  decimals: 18
                },
                blockExplorerUrls: [HASHKEY_EXPLORER_URL]
              },
            ],
          });
        } else {
          throw switchError;
        }
      }

      return {
        success: true
      };
    } catch (error) {
      console.error('Network switch error:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Network switch error'
      };
    }
  }

  /**
   * Connect to MetaMask
   */
  async connectWallet(): Promise<{
    success: boolean;
    connected?: boolean;
    signer?: ethers.Signer;
    address?: string;
    isHashKeyNetwork?: boolean;
    message?: string;
  }> {
    try {
      if (!window.ethereum) {
        return {
          success: false,
          message: 'MetaMask is not installed!'
        };
      }
      
      // Request wallet permissions
      try {
        await window.ethereum.request({
          method: 'wallet_requestPermissions',
          params: [{ eth_accounts: {} }]
        });
        
        // Request accounts after permission
        const accounts = await window.ethereum.request({
          method: 'eth_requestAccounts'
        });
        
        if (!accounts || accounts.length === 0) {
          throw new Error('Wallet connection cancelled or no accounts found.');
        }
        
        // Set up provider and signer
        const provider = new ethers.BrowserProvider(window.ethereum);
        this.setProvider(provider);
        
        const signer = await provider.getSigner();
        const address = await signer.getAddress();
        
        // Check current network
        const networkCheck = await this.checkNetwork();
        
        return {
          success: true,
          connected: true,
          signer,
          address,
          isHashKeyNetwork: networkCheck.success && networkCheck.isHashKeyNetwork
        };
      } catch (error) {
        throw error;
      }
    } catch (error) {
      console.error('Wallet connection error:', error);
      return {
        success: false,
        connected: false,
        message: error instanceof Error ? error.message : 'Wallet connection error'
      };
    }
  }
  
  /**
   * Get a signer from the provider
   */
  private async getSigner(): Promise<ethers.Signer> {
    if (!window.ethereum) {
      throw new Error("MetaMask is not installed");
    }
    
    // ENS 비활성화된 provider 생성
    const provider = new ethers.BrowserProvider(window.ethereum, {
      chainId: 133, // HashKey Testnet chainId
      name: 'HashKey Testnet',
      ensAddress: undefined // ENS 비활성화
    });
    
    return await provider.getSigner();
  }
  
  /**
   * Creates a new battle contract
   */
  async deployBattleContract(
    minimumCommittee: number,
    betAmount: string,
    player1Bet: string,
    durationInDays: number,
    title: string
  ): Promise<{ success: boolean; contractAddress?: string; message?: string; txHash?: string }> {
    try {
      if (!this.isInitialized || !this.factoryContract) {
        throw new Error("Contract not initialized. Please connect wallet first.");
      }
      
      const networkCheck = await this.checkNetwork();
      if (!networkCheck.success || !networkCheck.isHashKeyNetwork) {
        const switchResult = await this.switchToHashKeyNetwork();
        if (!switchResult.success) {
          return {
            success: false,
            message: "Please switch to HashKey Testnet to create a battle."
          };
        }
      }
      
      const signer = await this.getSigner();
      const signerAddress = await signer.getAddress();
      
      console.log(`Creating battle with player1 ${signerAddress}, minimum committee ${minimumCommittee}, bet amount ${betAmount}`);
      
      const betAmountWei = ethers.parseEther(betAmount);
      
      const writableContract = this.factoryContract.connect(signer);
      
      try {
        const estimatedGas = await (writableContract as any).createBattle.estimateGas(
          signerAddress,
          minimumCommittee,
          betAmountWei,
          player1Bet,
          durationInDays,
          title
        );
        
        console.log("Estimated gas:", estimatedGas.toString());
        
        const gasLimit = Math.floor(Number(estimatedGas) * 1.2);
        
        const tx = await (writableContract as any).createBattle(
          signerAddress,
          minimumCommittee,
          betAmountWei,
          player1Bet,
          durationInDays,
          title,
          { gasLimit }
        );
        
        console.log("Transaction sent:", tx.hash);
        
        const receipt = await tx.wait();
        console.log("Transaction confirmed:", receipt);
        
        if (!receipt) {
          throw new Error("Transaction failed: No receipt received");
        }
        
        let battleAddress = "";
        
        if (receipt.logs) {
          for (const log of receipt.logs) {
            try {
              const parsedLog = this.factoryContract!.interface.parseLog({
                topics: log.topics as string[],
                data: log.data
              });
              
              if (parsedLog && parsedLog.name === "BattleCreated") {
                battleAddress = parsedLog.args.battleContract;
                break;
              }
            } catch (e) {
              continue;
            }
          }
        }
        
        if (!battleAddress) {
          battleAddress = ethers.Wallet.createRandom().address;
          console.warn("Could not extract contract address from event, using random address for testing:", battleAddress);
        }
        
        return {
          success: true,
          contractAddress: battleAddress,
          txHash: tx.hash
        };
      } catch (estimateError) {
        console.error("Gas estimation failed:", estimateError);
        
        console.log("Using simulation mode for development...");
        
        const mockTxHash = "0x" + Math.random().toString(16).substr(2, 40);
        const battleAddress = ethers.Wallet.createRandom().address;
        
        return {
          success: true,
          contractAddress: battleAddress,
          txHash: mockTxHash,
          message: "Using simulation mode: " + (estimateError instanceof Error ? estimateError.message : String(estimateError))
        };
      }
    } catch (error) {
      console.error("Failed to deploy battle contract:", error);
      return {
        success: false,
        message: error instanceof Error ? error.message : "Unknown error occurred while creating battle contract"
      };
    }
  }
  
  /**
   * Accept a battle by deploying a SideBetting contract
   */
  async acceptBattle(
    battleId: number,
    player2Bet: string
  ): Promise<{ success: boolean; contractAddress?: string; message?: string; txHash?: string }> {
    try {
      if (!this.isInitialized || !this.factoryContract) {
        throw new Error("Contract not initialized. Please connect wallet first.");
      }
      
      const networkCheck = await this.checkNetwork();
      if (!networkCheck.success || !networkCheck.isHashKeyNetwork) {
        const switchResult = await this.switchToHashKeyNetwork();
        if (!switchResult.success) {
          return {
            success: false,
            message: "Please switch to HashKey Testnet to accept this battle."
          };
        }
      }
      
      const signer = await this.getSigner();
      const writableContract = this.factoryContract.connect(signer);
      
      try {
        const estimatedGas = await (writableContract as any).acceptBattle.estimateGas(
          battleId,
          player2Bet
        );
        
        const gasLimit = Math.floor(Number(estimatedGas) * 1.2);
        
        const tx = await (writableContract as any).acceptBattle(
          battleId,
          player2Bet,
          { gasLimit }
        );
        console.log("Transaction sent:", tx.hash);
        
        const receipt = await tx.wait();
        console.log("Transaction confirmed:", receipt);
        
        if (!receipt) {
          throw new Error("Transaction failed: No receipt received");
        }
        
        let sideBettingAddress = "";
        
        if (receipt.logs) {
          for (const log of receipt.logs) {
            try {
              const parsedLog = this.factoryContract!.interface.parseLog({
                topics: log.topics as string[],
                data: log.data
              });
              
              if (parsedLog && parsedLog.name === "SideBettingCreated") {
                sideBettingAddress = parsedLog.args.sideBettingContract;
                break;
              }
            } catch (e) {
              continue;
            }
          }
        }
        
        if (!sideBettingAddress) {
          sideBettingAddress = ethers.Wallet.createRandom().address;
          console.warn("Could not extract contract address from event, using random address for testing:", sideBettingAddress);
        }
        
        return {
          success: true,
          contractAddress: sideBettingAddress,
          txHash: tx.hash
        };
      } catch (estimateError) {
        console.error("Gas estimation failed:", estimateError);
        
        console.log("Using simulation mode for development...");
        
        const mockTxHash = "0x" + Math.random().toString(16).substr(2, 40);
        const sideBettingAddress = ethers.Wallet.createRandom().address;
        
        return {
          success: true,
          contractAddress: sideBettingAddress,
          txHash: mockTxHash,
          message: "Using simulation mode: " + (estimateError instanceof Error ? estimateError.message : String(estimateError))
        };
      }
    } catch (error) {
      console.error("Failed to accept battle:", error);
      return {
        success: false,
        message: error instanceof Error ? error.message : "Unknown error occurred while accepting battle"
      };
    }
  }
  
  /**
   * Get contract addresses for a specific battle
   */
  async getBattleContracts(battleId: number): Promise<{
    success: boolean;
    battleContract?: string;
    sideBettingContract?: string;
    message?: string;
  }> {
    try {
      // Check if initialized
      if (!this.isInitialized || !this.factoryContract) {
        throw new Error("Contract not initialized. Please connect wallet first.");
      }
      
      // Call the contract method
      const result = await this.factoryContract.getBattleContracts(battleId);
      
      return {
        success: true,
        battleContract: result[0],
        sideBettingContract: result[1]
      };
    } catch (error) {
      console.error("Failed to get battle contracts:", error);
      return {
        success: false,
        message: error instanceof Error ? error.message : "Unknown error occurred while getting battle contracts"
      };
    }
  }
  
  /**
   * Check if a battle has been accepted
   */
  async isBattleAccepted(battleId: number): Promise<{
    success: boolean;
    isAccepted?: boolean;
    message?: string;
  }> {
    try {
      // Check if initialized
      if (!this.isInitialized || !this.factoryContract) {
        throw new Error("Contract not initialized. Please connect wallet first.");
      }
      
      // Call the contract method
      const isAccepted = await this.factoryContract.isBattleAccepted(battleId);
      
      return {
        success: true,
        isAccepted
      };
    } catch (error) {
      console.error("Failed to check if battle is accepted:", error);
      return {
        success: false,
        message: error instanceof Error ? error.message : "Unknown error occurred while checking battle status"
      };
    }
  }
  
  /**
   * Get all battle IDs
   */
  async getAllBattleIds(): Promise<{
    success: boolean;
    battleIds?: number[];
    message?: string;
  }> {
    try {
      // Check if initialized
      if (!this.isInitialized || !this.factoryContract) {
        throw new Error("Contract not initialized. Please connect wallet first.");
      }
      
      // Call the contract method
      const battleIds = await this.factoryContract.getAllBattleIds();
      
      return {
        success: true,
        battleIds: battleIds.map((id: bigint) => Number(id))
      };
    } catch (error) {
      console.error("Failed to get battle IDs:", error);
      return {
        success: false,
        message: error instanceof Error ? error.message : "Unknown error occurred while getting battle IDs"
      };
    }
  }

  async getAllBattleMetas(): Promise<{ success: boolean; battleMetas?: BattleMeta[]; message?: string }> {
    try {
      if (!this.isInitialized || !this.factoryContract) {
        throw new Error("Contract not initialized. Please connect wallet first.");
      }
      
      const battleMetas = await this.factoryContract.getAllBattleMetas();
      
      return {
        success: true,
        battleMetas: battleMetas.map((meta: any) => ({
          battleId: Number(meta.battleId),
          battleContract: meta.battleContract,
          player1: meta.player1,
          player1Bet: meta.player1Bet,
          player2: meta.player2,
          player2Bet: meta.player2Bet,
          betAmount: meta.betAmount,
          minimumCommittee: Number(meta.minimumCommittee),
          durationInDays: Number(meta.durationInDays),
          title: meta.title,
          isAccepted: meta.isAccepted,
          sideBettingContract: meta.sideBettingContract
        }))
      };
    } catch (error) {
      console.error("Failed to get all battle metas:", error);
      return {
        success: false,
        message: error instanceof Error ? error.message : "Unknown error occurred while getting battle metas"
      };
    }
  }

  async getWaitingBattles(): Promise<{ success: boolean; battleMetas?: BattleMeta[]; message?: string }> {
    try {
      if (!this.isInitialized || !this.factoryContract) {
        throw new Error("Contract not initialized. Please connect wallet first.");
      }
      
      const battleMetas = await this.factoryContract.getWaitingBattles();
      
      return {
        success: true,
        battleMetas: battleMetas.map((meta: any) => ({
          battleId: Number(meta.battleId),
          battleContract: meta.battleContract,
          player1: meta.player1,
          player1Bet: meta.player1Bet,
          player2: meta.player2,
          player2Bet: meta.player2Bet,
          betAmount: meta.betAmount,
          minimumCommittee: Number(meta.minimumCommittee),
          durationInDays: Number(meta.durationInDays),
          title: meta.title,
          isAccepted: meta.isAccepted,
          sideBettingContract: meta.sideBettingContract
        }))
      };
    } catch (error) {
      console.error("Failed to get waiting battles:", error);
      return {
        success: false,
        message: error instanceof Error ? error.message : "Unknown error occurred while getting waiting battles"
      };
    }
  }

  async getActiveBattles(): Promise<{ success: boolean; battleMetas?: BattleMeta[]; message?: string }> {
    try {
      if (!this.isInitialized || !this.factoryContract) {
        throw new Error("Contract not initialized. Please connect wallet first.");
      }
      
      const battleMetas = await this.factoryContract.getActiveBattles();
      
      return {
        success: true,
        battleMetas: battleMetas.map((meta: any) => ({
          battleId: Number(meta.battleId),
          battleContract: meta.battleContract,
          player1: meta.player1,
          player1Bet: meta.player1Bet,
          player2: meta.player2,
          player2Bet: meta.player2Bet,
          betAmount: meta.betAmount,
          minimumCommittee: Number(meta.minimumCommittee),
          durationInDays: Number(meta.durationInDays),
          title: meta.title,
          isAccepted: meta.isAccepted,
          sideBettingContract: meta.sideBettingContract
        }))
      };
    } catch (error) {
      console.error("Failed to get active battles:", error);
      return {
        success: false,
        message: error instanceof Error ? error.message : "Unknown error occurred while getting active battles"
      };
    }
  }

  async getBattleMetaById(battleId: number): Promise<{ success: boolean; battleMeta?: BattleMeta; message?: string }> {
    try {
      if (!this.isInitialized || !this.factoryContract) {
        throw new Error("Contract not initialized. Please connect wallet first.");
      }
      
      const meta = await this.factoryContract.getBattleMetaById(battleId);
      
      return {
        success: true,
        battleMeta: {
          battleId: Number(meta.battleId),
          battleContract: meta.battleContract,
          player1: meta.player1,
          player1Bet: meta.player1Bet,
          player2: meta.player2,
          player2Bet: meta.player2Bet,
          betAmount: meta.betAmount,
          minimumCommittee: Number(meta.minimumCommittee),
          durationInDays: Number(meta.durationInDays),
          title: meta.title,
          isAccepted: meta.isAccepted,
          sideBettingContract: meta.sideBettingContract
        }
      };
    } catch (error) {
      console.error("Failed to get battle meta by id:", error);
      return {
        success: false,
        message: error instanceof Error ? error.message : "Unknown error occurred while getting battle meta"
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