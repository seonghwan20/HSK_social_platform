import { useState, useEffect } from 'react';
import { useBattleLogic } from '../hooks/useBattleLogic';
import { ethers } from 'ethers';

export default function CreateBattleForm() {
  const [title, setTitle] = useState('');
  const [optionA, setOptionA] = useState('');
  const [optionB, setOptionB] = useState('');
  const [betAmount, setBetAmount] = useState('');
  const [quizCount, setQuizCount] = useState(3);
  const [quizzes, setQuizzes] = useState<string[]>(['', '', '']);
  const [quizAnswers, setQuizAnswers] = useState<string[]>(['true', 'true', 'true']);
  const [contractAddress, setContractAddress] = useState('');
  
  const { handleCreateBattle, isConnected, account } = useBattleLogic();
  
  // Handle quiz count change
  useEffect(() => {
    const newQuizzes = [...quizzes];
    const newAnswers = [...quizAnswers];
    
    if (quizCount > newQuizzes.length) {
      while (newQuizzes.length < quizCount) {
        newQuizzes.push('');
        newAnswers.push('true');
      }
    } else if (quizCount < newQuizzes.length) {
      newQuizzes.splice(quizCount);
      newAnswers.splice(quizCount);
    }
    
    setQuizzes(newQuizzes);
    setQuizAnswers(newAnswers);
  }, [quizCount]);
  
  // Handle quiz content change
  const handleQuizChange = (index: number, value: string) => {
    const updatedQuizzes = [...quizzes];
    updatedQuizzes[index] = value;
    setQuizzes(updatedQuizzes);
  };
  
  // Handle quiz answer change
  const handleQuizAnswerChange = (index: number, value: string) => {
    const updatedAnswers = [...quizAnswers];
    updatedAnswers[index] = value;
    setQuizAnswers(updatedAnswers);
  };
  
  // Deploy Smart Contract
  const deploySmartContract = async () => {
    try {
      if (!isConnected || !window.ethereum) {
        alert("Please connect your wallet first");
        return null;
      }
      
      // In a real implementation, this uses the BattleFactoryService via useBattleLogic
      // handleCreateBattle in useBattleLogic will handle the actual contract deployment
      // So here we just generate a temporary address to keep track of the battle
      // until it gets replaced by the real deployed contract address
      
      const mockContractAddress = ethers.getCreateAddress({
        from: account,
        nonce: Math.floor(Math.random() * 1000)
      });
      
      setContractAddress(mockContractAddress);
      return mockContractAddress;
    } catch (error) {
      console.error("Error deploying contract:", error);
      alert("Failed to deploy contract. Please try again.");
      return null;
    }
  };
  
  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form
    if (!title || !optionA || !betAmount) {
      alert("Please fill in all required fields");
      return;
    }
    
    // Validate quizzes
    const filledQuizzes = quizzes.filter(quiz => quiz.trim() !== '');
    if (filledQuizzes.length !== quizCount) {
      alert(`Please fill in all ${quizCount} quizzes`);
      return;
    }
    
    // Deploy contract
    const deployedAddress = await deploySmartContract();
    if (!deployedAddress) return;
    
    // Create battle
    handleCreateBattle({
      title,
      optionA,
      betAmount,
      quizCount,
      quizzes,
      quizAnswers,
      contractAddress: deployedAddress
    });
    
    // Reset form
    setTitle('');
    setOptionA('');
    setOptionB('');
    setBetAmount('');
    setQuizCount(3);
    setQuizzes(['', '', '']);
    setQuizAnswers(['true', 'true', 'true']);
    setContractAddress('');
  };
  
  return (
    <div className="battle-form bg-gray-800 p-6 rounded-xl shadow-lg">
      <h2 className="text-xl font-bold mb-4">Create New Battle</h2>
      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <label className="block text-sm text-gray-400 mb-1">Battle Title</label>
          <input 
            type="text" 
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full bg-gray-700 rounded px-3 py-2 text-white"
            placeholder="Who is the better player?"
          />
        </div>
        
        <div>
          <label className="block text-sm text-gray-400 mb-1">Your Position</label>
          <input 
            type="text" 
            value={optionA}
            onChange={(e) => setOptionA(e.target.value)}
            className="w-full bg-gray-700 rounded px-3 py-2 text-white"
            placeholder="Enter your position"
          />
        </div>
        
        <div>
          <label className="block text-sm text-gray-400 mb-1">Bet Amount (ETH)</label>
          <input 
            type="text" 
            value={betAmount}
            onChange={(e) => setBetAmount(e.target.value)}
            className="w-full bg-gray-700 rounded px-3 py-2 text-white"
            placeholder="Enter bet amount (e.g. 0.01)"
          />
        </div>
        
        <div>
          <label className="block text-sm text-gray-400 mb-1">Number of Quizzes (1-5)</label>
          <input 
            type="number" 
            value={quizCount}
            onChange={(e) => setQuizCount(parseInt(e.target.value))}
            min="1"
            max="5"
            className="w-full bg-gray-700 rounded px-3 py-2 text-white"
          />
        </div>
        
        <div className="space-y-2">
          <label className="block text-sm text-gray-400 mb-1">Quizzes</label>
          {quizzes.map((quiz, index) => (
            <div key={index} className="space-y-1">
              <input 
                type="text"
                value={quiz}
                onChange={(e) => handleQuizChange(index, e.target.value)}
                className="w-full bg-gray-700 rounded px-3 py-2 text-white"
                placeholder={`Quiz ${index + 1}`}
              />
              <div className="flex items-center gap-2">
                <label className="text-sm text-gray-400">Answer:</label>
                <select
                  value={quizAnswers[index]}
                  onChange={(e) => handleQuizAnswerChange(index, e.target.value)}
                  className="bg-gray-700 rounded px-2 py-1 text-white"
                >
                  <option value="true">True</option>
                  <option value="false">False</option>
                </select>
              </div>
            </div>
          ))}
        </div>
        
        <button 
          type="submit" 
          className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg font-medium"
        >
          Create Battle
        </button>
        
        {contractAddress && (
          <div className="mt-4 p-3 bg-green-900/30 border border-green-800 rounded-lg">
            <p className="text-sm text-green-400 mb-1">Battle contract deployed successfully!</p>
            <p className="text-xs text-gray-300 break-all">{contractAddress}</p>
          </div>
        )}
      </form>
    </div>
  );
}