import { BrowserProvider, ethers } from "ethers";
import { formatAddress } from '../../utils/ethers';

/**
 * Service for wallet-related functionality
 */
export class WalletService {
  private provider: BrowserProvider | null = null;
  private signer: any | null = null;
  
  constructor(provider?: BrowserProvider) {
    if (provider) {
      this.setProvider(provider);
    }
  }
  
  // Set provider and signer
  setProvider(provider: BrowserProvider) {
    this.provider = provider;
    this.signer = provider.getSigner();
  }
  
  // Connect wallet and get accounts
  async connect(): Promise<string> {
    if (!window.ethereum) {
      throw new Error('MetaMask is not installed');
    }
    
    try {
      const provider = new BrowserProvider(window.ethereum);
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      
      if (accounts.length === 0) {
        throw new Error('No accounts found');
      }
      
      this.setProvider(provider);
      return accounts[0];
    } catch (error) {
      console.error('Error connecting wallet:', error);
      throw error;
    }
  }
  
  // Check if wallet is already connected
  async checkConnection(): Promise<string | null> {
    if (!window.ethereum) {
      return null;
    }
    
    try {
      const provider = new BrowserProvider(window.ethereum);
      const accounts = await provider.listAccounts();
      
      if (accounts.length > 0) {
        this.setProvider(provider);
        return accounts[0].address;
      }
      
      return null;
    } catch (error) {
      console.error('Error checking wallet connection:', error);
      return null;
    }
  }
  
  // Get ETH balance
  async getBalance(address: string): Promise<string> {
    if (!this.provider) {
      throw new Error('Provider not set');
    }
    
    try {
      const balance = await this.provider.getBalance(address);
      return ethers.formatEther(balance);
    } catch (error) {
      console.error('Error getting balance:', error);
      throw error;
    }
  }
  
  // Format address for display
  formatAddress(address: string): string {
    return formatAddress(address);
  }
  
  // Get provider
  getProvider(): BrowserProvider | null {
    return this.provider;
  }
  
  // Get signer
  getSigner(): any | null {
    return this.signer;
  }
}

// Create singleton instance
export const walletService = new WalletService();