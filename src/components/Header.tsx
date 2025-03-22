import Link from 'next/link';
import { useWallet } from '../hooks/useWallet';
import WalletConnect from './WalletConnect';
import { useBattleLogic } from '../hooks/useBattleLogic';

export default function Header() {
  const { account, isConnected, connectWallet } = useBattleLogic();
  const balance = "0.5482"; // You can connect this with the real balance from useBattleLogic later
  
  return (
    <header className="fixed top-0 left-0 right-0 bg-gray-900 border-b border-gray-800 z-50 py-4 px-6">
      <div className="container mx-auto flex justify-between items-center">
        {/* Logo */}
        <Link href="/" className="text-2xl font-bold text-white">
          BATTLEBEATLE
        </Link>
        
        {/* Navigation Menu */}
        <nav className="hidden md:flex space-x-8">
          <Link href="/" className="font-medium text-blue-400 hover:text-blue-300 transition-colors border-b-2 border-blue-400 pb-1">
            Home
          </Link>
          <Link href="/trending" className="font-medium text-gray-400 hover:text-white transition-colors">
            Trending
          </Link>
          <Link href="/my-battles" className="font-medium text-gray-400 hover:text-white transition-colors">
            My Battles
          </Link>
          <Link href="/leaderboard" className="font-medium text-gray-400 hover:text-white transition-colors">
            Leaderboard
          </Link>
        </nav>
        
        {/* User Profile and Balance */}
        <div className="flex items-center space-x-4">
          {isConnected && (
            <div className="hidden md:block text-sm font-medium text-white">
              <span className="text-gray-400">Balance:</span>
              <span className="ml-1">{balance || '0.00'} ETH</span>
            </div>
          )}
          
          <div className="relative group">
            <button className="flex items-center space-x-2 focus:outline-none">
              <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center">
                {isConnected ? (
                  <span className="text-xs text-white">
                    {account?.substring(0, 2)}
                  </span>
                ) : (
                  <span className="text-xs text-gray-300">?</span>
                )}
              </div>
              <span className="hidden md:inline-block text-gray-300">
                {isConnected ? 
                  `${account?.substring(0, 6)}...${account?.substring(account.length - 4)}` : 
                  'Connect Wallet'
                }
              </span>
            </button>
            
            {/* Dropdown Menu */}
            <div className="absolute right-0 mt-2 w-48 bg-gray-800 rounded-md shadow-lg py-1 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
              {isConnected ? (
                <>
                  <Link href="/profile" className="block px-4 py-2 text-sm text-gray-300 hover:bg-gray-700">
                    My Profile
                  </Link>
                  <Link href="/settings" className="block px-4 py-2 text-sm text-gray-300 hover:bg-gray-700">
                    Settings
                  </Link>
                  <hr className="border-gray-700 my-1" />
                  <div className="px-4 py-2">
                    <WalletConnect />
                  </div>
                </>
              ) : (
                <div className="px-4 py-2">
                  <WalletConnect />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}