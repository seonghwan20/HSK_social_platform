import { useEffect, useState } from 'react';
import { useBattleLogic } from '../hooks/useBattleLogic';

export default function WalletConnect() {
  const { account, isConnected, connectWallet, disconnectWallet } = useBattleLogic();
  const [displayBalance, setDisplayBalance] = useState("0.0000");
  const [showDisconnectWarning, setShowDisconnectWarning] = useState(false);
  const [networkName, setNetworkName] = useState("");
  const [isHashKeyNetwork, setIsHashKeyNetwork] = useState(false);

  const HASHKEY_CHAIN_ID = '0x85'; // 133 in hex
  const HASHKEY_RPC_URL = 'https://hashkeychain-testnet.alt.technology';

  const handleDisconnectClick = () => setShowDisconnectWarning(true);
  const confirmDisconnect = () => {
    disconnectWallet();
    setShowDisconnectWarning(false);
  };

  const switchToHashKeyTestnet = async () => {
    if (typeof window !== 'undefined' && (window as any).ethereum) {
      try {
        await (window as any).ethereum.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: HASHKEY_CHAIN_ID }]
        });
      } catch (switchError: any) {
        if (switchError.code === 4902) {
          // Network not added → add it
          await (window as any).ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [{
              chainId: HASHKEY_CHAIN_ID,
              chainName: 'HashKey Testnet',
              rpcUrls: [HASHKEY_RPC_URL],
              nativeCurrency: {
                name: 'HSK',
                symbol: 'HSK',
                decimals: 18
              },
              blockExplorerUrls: ['https://hashkeychain-testnet-explorer.alt.technology']
            }]
          });
        } else {
          console.error("Switch error:", switchError);
        }
      }
    }
  };

  // 🟡 자동 전환 유도
  useEffect(() => {
    if (isConnected && !isHashKeyNetwork) {
      switchToHashKeyTestnet();
    }
  }, [isConnected, isHashKeyNetwork]);

  // 🔄 네트워크 변경 감지 시 새로고침
  useEffect(() => {
    if (typeof window !== 'undefined' && (window as any).ethereum) {
      const handleChainChanged = () => {
        window.location.reload();
      };
      (window as any).ethereum.on('chainChanged', handleChainChanged);
      return () => {
        (window as any).ethereum.removeListener('chainChanged', handleChainChanged);
      };
    }
  }, []);

  // 💰 잔액 및 네트워크 이름
  useEffect(() => {
    const getWalletInfo = async () => {
      if (typeof window !== 'undefined' && (window as any).ethereum && isConnected && account) {
        try {
          const balance = await (window as any).ethereum.request({
            method: 'eth_getBalance',
            params: [account, 'latest']
          });
          const ethBalance = parseInt(balance, 16) / 1e18;
          setDisplayBalance(ethBalance.toFixed(4));

          const chainId = await (window as any).ethereum.request({ method: 'eth_chainId' });
          const isHashKey = chainId === HASHKEY_CHAIN_ID;
          setIsHashKeyNetwork(isHashKey);
          setNetworkName(isHashKey ? 'HashKey Testnet' : `Chain ID: ${chainId}`);
          console.log('Chain ID:', chainId);
        } catch (error) {
          console.error("Wallet info error:", error);
          setDisplayBalance("0.0000");
          setNetworkName("Unknown");
          setIsHashKeyNetwork(false);
        }
      }
    };
    getWalletInfo();
  }, [account, isConnected]);

  return (
    <div className="wallet-connect relative">
      {isConnected ? (
        <div className="flex flex-col space-y-2">
          <div className="text-sm text-gray-300">Connected: <span className="font-medium">{account.slice(0, 6)}...{account.slice(-4)}</span></div>
          <div className="text-sm text-gray-300">Balance: <span className="font-medium">{displayBalance} HSK</span></div>
          <div className="text-sm text-gray-300">
            Network:{" "}
            <span className={`font-medium ${isHashKeyNetwork ? 'text-green-400' : 'text-red-400'}`}>
              {networkName}
            </span>
            {!isHashKeyNetwork && (
              <button onClick={switchToHashKeyTestnet} className="ml-2 text-xs bg-yellow-600 hover:bg-yellow-700 text-white px-2 py-1 rounded">
                Switch
              </button>
            )}
          </div>
          <button onClick={handleDisconnectClick} className="text-xs text-red-400 hover:text-red-300 mt-1">Disconnect</button>
        </div>
      ) : (
        <button onClick={connectWallet} className="bg-blue-600 hover:bg-blue-700 text-white rounded-md px-4 py-2 text-sm font-medium">
          Connect Wallet
        </button>
      )}

      {/* Disconnect Modal */}
      {showDisconnectWarning && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50" onClick={() => setShowDisconnectWarning(false)}>
          <div className="bg-gray-800 border-2 border-red-500 rounded-lg p-5 max-w-sm w-full shadow-2xl" onClick={e => e.stopPropagation()}>
            <h3 className="text-xl font-bold text-white mb-4">Disconnect Wallet</h3>
            <p className="text-gray-300 mb-6">Are you sure you want to disconnect your wallet?</p>
            <div className="flex justify-end space-x-3">
              <button onClick={() => setShowDisconnectWarning(false)} className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-md text-sm">Cancel</button>
              <button onClick={confirmDisconnect} className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md text-sm font-medium">Disconnect</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
