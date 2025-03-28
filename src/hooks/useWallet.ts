import { useState, useEffect, useCallback } from 'react';
import { ethers } from 'ethers';

export function useWallet() {
  const [account, setAccount] = useState('');
  const [provider, setProvider] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [balance, setBalance] = useState('');
  const [networkName, setNetworkName] = useState('');
  const [isCorrectNetwork, setIsCorrectNetwork] = useState(false);
  
  // Create a memoized handleAccountsChanged function that won't change on rerenders
  const handleAccountsChanged = useCallback((accounts) => {
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
  const handleChainChanged = useCallback(() => {
    // We'll check the network after reload
    window.location.reload();
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
  
  // Check if connected to Sepolia testnet
  const checkNetwork = async () => {
    if (window.ethereum && provider) {
      try {
        const network = await provider.getNetwork();
        const chainId = network.chainId;
        
        // Sepolia chainId is 11155111
        const isSepolia = chainId === 11155111;
        setIsCorrectNetwork(isSepolia);
        
        if (isSepolia) {
          setNetworkName('Sepolia');
        } else {
          setNetworkName(`Unknown (${chainId})`);
        }
        
        return isSepolia;
      } catch (error) {
        console.error("Network check error:", error);
        setNetworkName('Unknown');
        setIsCorrectNetwork(false);
        return false;
      }
    }
    return false;
  };
  
  // Switch to Sepolia testnet
  const switchToSepoliaNetwork = async () => {
    if (!window.ethereum) {
      alert("Please install MetaMask!");
      return false;
    }
    
    try {
      // Sepolia chainId in hex
      const SEPOLIA_CHAIN_ID = '0xaa36a7'; // 11155111 in hex
      
      try {
        // Try to switch to Sepolia
        await window.ethereum.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: SEPOLIA_CHAIN_ID }]
        });
      } catch (switchError) {
        // This error code indicates that the chain has not been added to MetaMask
        if (switchError.code === 4902) {
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [{
              chainId: SEPOLIA_CHAIN_ID,
              chainName: 'Sepolia Test Network',
              rpcUrls: ['https://sepolia.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161'],
              nativeCurrency: {
                name: 'Sepolia ETH',
                symbol: 'ETH',
                decimals: 18
              },
              blockExplorerUrls: ['https://sepolia.etherscan.io']
            }]
          });
        } else {
          throw switchError;
        }
      }
      
      // Since we switched networks, we need to update our provider
      const web3Provider = new ethers.BrowserProvider(window.ethereum);
      setProvider(web3Provider);
      
      // Check if we switched successfully
      return await checkNetwork();
    } catch (error) {
      console.error("Network switch error:", error);
      alert("Failed to switch to Sepolia network. Please try manually in MetaMask.");
      return false;
    }
  };
  
  const fetchBalance = async () => {
    try {
      if (provider && account) {
        const rawBalance = await provider.getBalance(account);
        const formattedBalance = ethers.formatEther(rawBalance);
        // Format to 4 decimal places
        setBalance(parseFloat(formattedBalance).toFixed(4));
      }
    } catch (error) {
      console.error("Failed to fetch balance:", error);
      setBalance('0.0000');
    }
  };
  
  const checkConnection = async () => {
    if (window.ethereum) {
      try {
        // This will detect if MetaMask is already connected
        const web3Provider = new ethers.BrowserProvider(window.ethereum);
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
        
        const web3Provider = new ethers.BrowserProvider(window.ethereum);
        
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
    switchToSepoliaNetwork,
    checkNetwork
  };
}