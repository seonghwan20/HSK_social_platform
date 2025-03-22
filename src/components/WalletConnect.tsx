import { useWallet } from '../hooks/useWallet';
import { useBattleLogic } from '../hooks/useBattleLogic';

export default function WalletConnect() {
  const { account, isConnected, connectWallet } = useBattleLogic();
  const balance = "0.5482"; // You can get this from useBattleLogic later
  
  // Use this function to disconnect - should be added to useBattleLogic
  const disconnectWallet = () => {
    console.log("Disconnect not implemented");
  };
  
  return (
    <div className="wallet-connect">
      {isConnected ? (
        <div className="flex flex-col space-y-2">
          <div className="text-sm">
            <span className="text-gray-400">Connected: </span>
            <span className="font-medium">{account.substring(0, 6)}...{account.substring(account.length - 4)}</span>
          </div>
          <div className="text-sm">
            <span className="text-gray-400">Balance: </span>
            <span className="font-medium">{balance} ETH</span>
          </div>
          <button 
            onClick={disconnectWallet}
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
    </div>
  );
}