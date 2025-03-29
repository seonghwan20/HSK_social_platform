import { useState, useEffect, useCallback } from 'react';
import { ethers } from 'ethers';
import { formatEther } from '../utils/ethers';

export function useWallet() {
  const [account, setAccount] = useState('');
  const [provider, setProvider] = useState<ethers.BrowserProvider | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [balance, setBalance] = useState('');
  const [networkName, setNetworkName] = useState('');
  const [isCorrectNetwork, setIsCorrectNetwork] = useState(false);
  
  // Create a memoized handleAccountsChanged function that won't change on rerenders
  const handleAccountsChanged = useCallback((accounts: string[]) => {
    if (accounts.length > 0) {
      setAccount(accounts[0]);
      setIsConnected(true);
      // Check network whenever account changes
      checkNetwork();
    } else {
      setAccount('');
      setBalance('');
      setIsConnected(false);
      setNetworkName('');
      setIsCorrectNetwork(false);
    }
  }, []);
  
  // Handle chain changes
  const handleChainChanged = useCallback((chainId: string) => {
    console.log("체인 변경 감지:", chainId);
    // 체인 ID가 변경되었을 때 새로 고침하지 않고 네트워크만 확인
    checkNetwork();
  }, []);
  
  // Set up ethereum event listeners
  const setupEventListeners = useCallback(() => {
    if (window.ethereum) {
      window.ethereum.on('accountsChanged', handleAccountsChanged);
      window.ethereum.on('chainChanged', handleChainChanged);
    }
    
    return () => {
      if (window.ethereum) {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
        window.ethereum.removeListener('chainChanged', handleChainChanged);
      }
    };
  }, [handleAccountsChanged, handleChainChanged]);
  
  useEffect(() => {
    // Check if wallet is already connected
    checkConnection();
    
    // Setup event listeners for wallet changes
    const cleanup = setupEventListeners();
    
    return cleanup;
  }, [setupEventListeners]);
  
  useEffect(() => {
    // Fetch balance when account changes
    if (isConnected && account && provider) {
      fetchBalance();
      checkNetwork();
    }
  }, [account, isConnected, provider]);
  
  // Check if connected to HashKey Testnet
  const checkNetwork = async () => {
    if (window.ethereum && provider) {
      try {
        const network = await provider.getNetwork();
        const chainId = Number(network.chainId);
        
        // HashKey Testnet chainId is 133
        const isHashKey = chainId === 133;
        setIsCorrectNetwork(isHashKey);
        
        if (isHashKey) {
          setNetworkName('HashKey Testnet');
        } else {
          setNetworkName(`Unknown (${chainId})`);
        }
        
        return isHashKey;
      } catch (error) {
        console.error("Network check error:", error);
        setNetworkName('Unknown');
        setIsCorrectNetwork(false);
        return false;
      }
    }
    return false;
  };
  
  // Switch to HashKey Testnet
  const switchToHashKeyNetwork = async () => {
    if (!window.ethereum) {
      alert("Please install MetaMask!");
      return false;
    }
    
    try {
      // HashKey Testnet chainId in hex
      const HASHKEY_CHAIN_ID = '0x85'; // 133 in hex
      
      try {
        // Try to switch to HashKey Testnet
        await window.ethereum.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: HASHKEY_CHAIN_ID }]
        });
      } catch (switchError: any) {
        // This error code indicates that the chain has not been added to MetaMask
        if (switchError.code === 4902) {
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [{
              chainId: HASHKEY_CHAIN_ID,
              chainName: 'HashKey Testnet',
              rpcUrls: ['https://hashkeychain-testnet.alt.technology'],
              nativeCurrency: {
                name: 'HSK',
                symbol: 'HSK',
                decimals: 18
              },
              blockExplorerUrls: ['https://hashkeychain-testnet-explorer.alt.technology']
            }]
          });
        } else {
          throw switchError;
        }
      }
      
      // Since we switched networks, we need to update our provider
      const web3Provider = new ethers.BrowserProvider(window.ethereum, {
        ensAddress: undefined // ENS 비활성화
      });
      setProvider(web3Provider);
      
      // Check if we switched successfully
      return await checkNetwork();
    } catch (error) {
      console.error("Network switch error:", error);
      alert("Failed to switch to HashKey Testnet. Please try manually in MetaMask.");
      return false;
    }
  };
  
  const fetchBalance = async () => {
    try {
      if (provider && account) {
        const rawBalance = await provider.getBalance(account);
        
        // 커스텀 formatEther 함수를 사용하여 gwei 단위로 포맷팅
        const formattedBalance = formatEther(rawBalance);
        
        // 포맷된 값 그대로 사용 (이미 적절히 반올림되어 있음)
        setBalance(formattedBalance);
      }
    } catch (error) {
      console.error("Failed to fetch balance:", error);
      setBalance('0');
    }
  };
  
  const checkConnection = async () => {
    if (window.ethereum) {
      try {
        // This will detect if MetaMask is already connected
        const web3Provider = new ethers.BrowserProvider(window.ethereum, {
          ensAddress: undefined // ENS 비활성화
        });
        const accounts = await web3Provider.listAccounts();
        
        if (accounts.length > 0) {
          setAccount(accounts[0].address);
          setProvider(web3Provider);
          setIsConnected(true);
        }
      } catch (error) {
        console.error("Connection check error:", error);
      }
    }
  };
  
  const connectWallet = async () => {
    if (window.ethereum) {
      try {
        // Switch to HashKey Testnet first
        await switchToHashKeyNetwork();
        
        // Request wallet permissions
        await window.ethereum.request({
          method: 'wallet_requestPermissions',
          params: [{
            eth_accounts: {}
          }]
        });
        
        // Request accounts after permission
        const accounts = await window.ethereum.request({ 
          method: 'eth_requestAccounts' 
        });
        
        const web3Provider = new ethers.BrowserProvider(window.ethereum, {
          ensAddress: undefined // ENS 비활성화
        });
        
        if (accounts.length > 0) {
          setAccount(accounts[0]);
          setProvider(web3Provider);
          setIsConnected(true);
          
          // Check network and fetch balance
          await checkNetwork();
          setTimeout(() => {
            fetchBalance();
          }, 100);
        }
      } catch (error) {
        console.error("Wallet connection error:", error);
      }
    } else {
      alert("Please install MetaMask!");
    }
  };
  
  const disconnectWallet = () => {
    setAccount('');
    setBalance('');
    setIsConnected(false);
    setNetworkName('');
    setIsCorrectNetwork(false);
    // Note: MetaMask doesn't support programmatic disconnection
    // This just resets the state in our app
  };
  
  return {
    account,
    provider,
    isConnected,
    balance,
    networkName,
    isCorrectNetwork,
    connectWallet,
    disconnectWallet,
    switchToHashKeyNetwork,
    checkNetwork
  };
}