import { useEffect, useState } from 'react';
import { useBattleLogic } from '../hooks/useBattleLogic';

export default function WalletConnect() {
  const { account, isConnected, connectWallet, disconnectWallet } = useBattleLogic();
  const [displayBalance, setDisplayBalance] = useState("0.0000");
  const [showDisconnectWarning, setShowDisconnectWarning] = useState(false);
  
  // Handle disconnect click to show warning
  const handleDisconnectClick = () => {
    setShowDisconnectWarning(true);
  };
  
  // Confirm disconnect
  const confirmDisconnect = () => {
    disconnectWallet();
    setShowDisconnectWarning(false);
  };
  
  // Get updated balance from provider
  useEffect(() => {
    const getBalance = async () => {
      if (typeof window !== 'undefined' && (window as any).ethereum && isConnected && account) {
        try {
          // This is a simple way to get balance - in a real app, you'd use your wallet service
          const balance = await (window as any).ethereum.request({
            method: 'eth_getBalance',
            params: [account, 'latest']
          });
          
          // Convert from wei to ETH
          const ethBalance = parseInt(balance, 16) / 1e18;
          setDisplayBalance(ethBalance.toFixed(4));
        } catch (error) {
          console.error("Error getting balance:", error);
          setDisplayBalance("0.0000");
        }
      }
    };
    
    getBalance();
  }, [account, isConnected]);
  
  return (
    <div className="wallet-connect relative">
      {isConnected ? (
        <div className="flex flex-col space-y-2">
          <div className="text-sm">
            <span className="text-gray-400">Connected: </span>
            <span className="font-medium">{account.substring(0, 6)}...{account.substring(account.length - 4)}</span>
          </div>
          <div className="text-sm">
            <span className="text-gray-400">Balance: </span>
            <span className="font-medium">{displayBalance} ETH</span>
          </div>
          <button 
            onClick={handleDisconnectClick}
            className="text-xs text-red-400 hover:text-red-300 mt-1"
          >
            Disconnect
          </button>
        </div>
      ) : (
        <button 
          onClick={connectWallet}
          className="bg-blue-600 hover:bg-blue-700 text-white rounded-md px-4 py-2 text-sm font-medium"
        >
          Connect Wallet
        </button>
      )}
      
      {/* Disconnect Warning Modal */}
      {showDisconnectWarning && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50" onClick={() => setShowDisconnectWarning(false)}>
          <div className="bg-gray-800 border-2 border-red-500 rounded-lg p-5 max-w-sm w-full shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center mb-4">
              <div className="bg-red-500 rounded-full p-2 mr-3">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-white">Disconnect Wallet</h3>
            </div>
            
            <p className="text-gray-300 mb-6">
              Are you sure you want to disconnect your wallet? You'll need to reconnect to continue using the app.
            </p>
            
            <div className="flex justify-end space-x-3">
              <button 
                onClick={() => setShowDisconnectWarning(false)}
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-md text-sm"
              >
                Cancel
              </button>
              <button 
                onClick={confirmDisconnect}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md text-sm font-medium"
              >
                Disconnect
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}