import { useState, useEffect, useCallback } from 'react';
import { ethers } from 'ethers';

export function useWallet() {
  const [account, setAccount] = useState('');
  const [provider, setProvider] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [balance, setBalance] = useState('');
  
  // Create a memoized handleAccountsChanged function that won't change on rerenders
  const handleAccountsChanged = useCallback((accounts) => {
    if (accounts.length > 0) {
      setAccount(accounts[0]);
      setIsConnected(true);
    } else {
      setAccount('');
      setBalance('');
      setIsConnected(false);
    }
  }, []);
  
  // Set up ethereum event listeners
  const setupEventListeners = useCallback(() => {
    if (window.ethereum) {
      window.ethereum.on('accountsChanged', handleAccountsChanged);
      window.ethereum.on('chainChanged', () => {
        // Reload when chain changes
        window.location.reload();
      });
    }
    
    return () => {
      if (window.ethereum) {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
        window.ethereum.removeListener('chainChanged', () => {
          window.location.reload();
        });
      }
    };
  }, [handleAccountsChanged]);
  
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
    }
  }, [account, isConnected, provider]);
  
  const fetchBalance = async () => {
    try {
      if (provider && account) {
        const rawBalance = await provider.getBalance(account);
        const formattedBalance = ethers.utils.formatEther(rawBalance);
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
        const web3Provider = new ethers.providers.Web3Provider(window.ethereum);
        const accounts = await web3Provider.listAccounts();
        
        if (accounts.length > 0) {
          setAccount(accounts[0]);
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
        // Request accounts access
        const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
        const web3Provider = new ethers.providers.Web3Provider(window.ethereum);
        
        if (accounts.length > 0) {
          setAccount(accounts[0]);
          setProvider(web3Provider);
          setIsConnected(true);
          
          // Fetch balance immediately after connection
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
    // Note: MetaMask doesn't support programmatic disconnection
    // This just resets the state in our app
  };
  
  return {
    account,
    provider,
    isConnected,
    balance,
    connectWallet,
    disconnectWallet
  };
}