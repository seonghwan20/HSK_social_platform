import { ethers } from 'ethers';

export const getProvider = () => {
  if (window.ethereum) {
    // ENS를 비활성화하여 HashKey Testnet에서 발생하는 ENS 관련 오류 방지
    return new ethers.BrowserProvider(window.ethereum, {
      ensAddress: undefined // ENS 비활성화
    });
  }
  throw new Error('MetaMask가 설치되어 있지 않습니다');
};

export const formatAddress = (address: string) => {
  if (!address) return '';
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
};

// 문자열 값을 gwei 단위로 변환 (UI 입력값 -> 컨트랙트 전송값)
export const parseEther = (value: string) => {
  // 입력값이 빈 문자열이거나 유효하지 않은 경우 0 반환
  if (!value || isNaN(Number(value))) return ethers.parseUnits('0', 'gwei');
  
  // 정확한 gwei 단위로 변환
  return ethers.parseUnits(value, 'gwei');
};

// 컨트랙트 값을 HSK 문자열로 포맷팅 (컨트랙트 반환값 -> UI 표시값)
export const formatEther = (value: string | bigint) => {
  try {
    // BigInt인 경우 문자열로 변환
    const valueStr = typeof value === 'bigint' ? value.toString() : value;
    
    // gwei 단위로 변환 (소수점 2자리까지 표시)
    const gweiValue = ethers.formatUnits(valueStr, 'gwei');
    const parsedValue = parseFloat(gweiValue);
    
    // 1000 이상이면 소수점 없이, 그 외에는 소수점 최대 2자리까지
    if (parsedValue >= 1000) {
      return Math.floor(parsedValue).toString();
    } else {
      return parsedValue.toFixed(2).replace(/\.00$/, '');
    }
  } catch (error) {
    console.error('포맷팅 오류:', error);
    return '0';
  }
};