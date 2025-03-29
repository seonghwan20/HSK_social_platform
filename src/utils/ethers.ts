import { ethers } from 'ethers';

export const getProvider = () => {
  if (window.ethereum) {
    return new ethers.BrowserProvider(window.ethereum);
  }
  throw new Error('MetaMask가 설치되어 있지 않습니다');
};

export const formatAddress = (address: string) => {
  if (!address) return '';
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
};

export const parseEther = (value: string) => {
  return ethers.parseEther(value);
};

export const formatEther = (value: string) => {
  return ethers.formatEther(value);
};