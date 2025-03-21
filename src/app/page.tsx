"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";


export default function Home() {
  // Featured battle data
  const featuredBattle = {
    id: 0,
    title: "Who is better at soccer?",
    optionA: "Neymar",
    optionB: "Ronaldinho", 
    betAmount: "50,000",
    participants: 1842,
    thumbnail: "/battle-thumbnail.jpg"
  };
  
  // State for battles
  const [hotBattles, setHotBattles] = useState([
    { 
      id: 1, 
      title: "Who is the better soccer player?", 
      optionA: "Neymar", 
      optionB: "Ronaldinho", 
      betAmount: "5,000", 
      participants: 128,
      quizzesA: [
        "Neymar has won more international trophies than Ronaldinho.",
        "Neymar's goal scoring record at club level is better than Ronaldinho's was."
      ],
      quizzesB: [
        "Ronaldinho won the Ballon d'Or, which Neymar has never won.",
        "Ronaldinho had a greater impact on world football than Neymar."
      ]
    },
    { id: 2, title: "Which food is more delicious?", optionA: "Pizza", optionB: "Chicken", betAmount: "3,000", participants: 87 },
    { id: 3, title: "Which game is more fun?", optionA: "League of Legends", optionB: "PUBG", betAmount: "10,000", participants: 256 },
    { id: 4, title: "Which movie is better?", optionA: "Interstellar", optionB: "Inception", betAmount: "2,000", participants: 64 }
  ]);
  
  const [waitingBattles, setWaitingBattles] = useState([
    { id: 5, title: "Which programming language is better?", optionA: "JavaScript", optionB: "Open for challenge", betAmount: "8,000", waiting: true },
    { id: 6, title: "Which operating system is better?", optionA: "Windows", optionB: "Open for challenge", betAmount: "7,000", waiting: true },
    { id: 7, title: "Which smartphone has better performance?", optionA: "iPhone", optionB: "Open for challenge", betAmount: "15,000", waiting: true },
    { id: 8, title: "Which dessert tastes better?", optionA: "Ice Cream", optionB: "Open for challenge", betAmount: "1,000", waiting: true }
  ]);
  
  const [myBattles, setMyBattles] = useState([
    { id: 9, title: "Which travel destination is better?", optionA: "Europe", optionB: "Southeast Asia", betAmount: "12,000", myChoice: "optionA" },
    { id: 10, title: "Which cafe is better?", optionA: "Starbucks", optionB: "Twosome Place", betAmount: "3,500", myChoice: "optionB" },
    { id: 11, title: "Which sport is more fun?", optionA: "Football", optionB: "Basketball", betAmount: "5,000", myChoice: "optionA" },
    { id: 12, title: "Which fast food tastes better?", optionA: "McDonald's", optionB: "Burger King", betAmount: "2,500", myChoice: "optionB" }
  ]);
  
  // Form state for creating a new battle
  const [newBattle, setNewBattle] = useState({
    title: '',
    optionA: '',
    betAmount: '',
    category: 'sports',
    photoA: null,
    quizCount: 1,
    quizzes: [''],
    quizAnswers: ['true'] // Default answers for quizzes (O=true, X=false)
  });
  
  // State for accepting a challenge
  const [selectedChallenge, setSelectedChallenge] = useState(null);
  const [challengeResponse, setChallengeResponse] = useState('');
  const [responsePhoto, setResponsePhoto] = useState(null);
  const [challengerQuizzes, setChallengerQuizzes] = useState([]);
  const [challengerQuizAnswers, setChallengerQuizAnswers] = useState([]);
  
  // State for viewing battle details
  const [selectedBattleDetails, setSelectedBattleDetails] = useState(null);
  const [showSideBetOptions, setShowSideBetOptions] = useState(false);
  
  // State for committee quiz solving
  const [isCommitteeMode, setIsCommitteeMode] = useState(false);
  const [committeeQuizzes, setCommitteeQuizzes] = useState([]);
  const [currentQuizIndex, setCurrentQuizIndex] = useState(0);
  const [quizTimer, setQuizTimer] = useState(3); // 3 second timer
  const [timerActive, setTimerActive] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState(null); // null, 'true', or 'false'
  const [committeeAnswers, setCommitteeAnswers] = useState([]);
  const [showVotingPopup, setShowVotingPopup] = useState(false);
  const [selectedVote, setSelectedVote] = useState(null); // 'A' or 'B'
  const [allAnswersCorrect, setAllAnswersCorrect] = useState(false);
  
  // Helper function for file uploads (simulated)
  const handleFileUpload = (setter, event) => {
    const file = event.target.files[0];
    if (file) {
      // In a real application, you would upload this to a server
      // For demo purposes, we'll just create a local URL
      const imageUrl = URL.createObjectURL(file);
      setter(imageUrl);
    }
  };
  
  // Open battle details popup
  const handleViewBattleDetails = (battle) => {
    setSelectedBattleDetails(battle);
    const popup = document.getElementById('battleDetailsPopup');
    if (popup) popup.classList.remove('hidden');
  };
  
  // Handle join committee button click
  const handleJoinCommittee = (battle) => {
    // Check if the battle has quizzes from both players
    if (!battle.quizzesA || !battle.quizzesB || battle.quizzesA.length === 0 || battle.quizzesB.length === 0) {
      alert("This battle doesn't have quizzes to solve.");
      return;
    }
    
    // Check if answers are available
    if (!battle.quizzesAAnswers || !battle.quizzesBAnswers) {
      alert("Answer data is missing for this battle.");
      console.error("Missing answer data:", battle);
      return;
    }
    
    // Save the current battle for voting popup
    setSelectedBattleDetails(battle);
    
    // Add logging to check the battle data
    console.log("Battle data:", battle);
    console.log("Quiz A Answers:", battle.quizzesAAnswers);
    console.log("Quiz B Answers:", battle.quizzesBAnswers);
    
    // Combine both players' quizzes for the committee to solve
    setCommitteeQuizzes([
      ...battle.quizzesA.map(quiz => ({ question: quiz, player: 'A' })),
      ...battle.quizzesB.map(quiz => ({ question: quiz, player: 'B' }))
    ]);
    
    // Initialize empty answers array
    setCommitteeAnswers(Array(battle.quizzesA.length + battle.quizzesB.length).fill(null));
    
    // Hide battle details popup
    const detailsPopup = document.getElementById('battleDetailsPopup');
    if (detailsPopup) detailsPopup.classList.add('hidden');
    
    // Show committee quiz popup
    const quizPopup = document.getElementById('committeeQuizPopup');
    if (quizPopup) quizPopup.classList.remove('hidden');
    
    // Set up quiz state - do this after popup is shown to prevent timing issues
    setIsCommitteeMode(true);
    setCurrentQuizIndex(0);
    setSelectedAnswer(null);
    
    // Important: Set timer to 3 and activate immediately to start countdown
    setQuizTimer(3);
    
    // Use setTimeout with 0 delay to ensure DOM updates before timer starts
    setTimeout(() => {
      setTimerActive(true);
    }, 0);
  };
  
  // Handle committee quiz submission
  const handleCommitteeQuizSubmit = (answer) => {
    // Get the current quiz and its correct answer
    const currentQuiz = committeeQuizzes[currentQuizIndex];
    
    // Get the correct answer from the battle data
    let correctAnswer;
    if (currentQuiz.player === 'A') {
      // This is a player A quiz, get the correct answer from quizzesAAnswers
      const quizIndex = selectedBattleDetails.quizzesA.findIndex(q => q === currentQuiz.question);
      correctAnswer = selectedBattleDetails.quizzesAAnswers[quizIndex];
    } else {
      // This is a player B quiz, get the correct answer from quizzesBAnswers
      const quizIndex = selectedBattleDetails.quizzesB.findIndex(q => q === currentQuiz.question);
      correctAnswer = selectedBattleDetails.quizzesBAnswers[quizIndex];
    }
    
    // Check if the answer is correct
    const isCorrect = answer.answer === correctAnswer;
    
    if (!isCorrect) {
      // Wrong answer - close quiz popup
      const quizPopup = document.getElementById('committeeQuizPopup');
      if (quizPopup) quizPopup.classList.add('hidden');
      
      // Finish committee mode
      setIsCommitteeMode(false);
      setCommitteeQuizzes([]);
      setCurrentQuizIndex(0);
      setTimerActive(false);
      
      alert("Sorry, that's incorrect. You can't continue as a committee member.");
      return;
    }
    
    // Save the answer
    const updatedAnswers = [...committeeAnswers];
    updatedAnswers[currentQuizIndex] = answer;
    setCommitteeAnswers(updatedAnswers);
    
    // Reset timer and selection for next quiz
    setQuizTimer(3);
    setTimerActive(true);
    setSelectedAnswer(null);
    
    // Move to next quiz or finish if all quizzes are answered
    if (currentQuizIndex < committeeQuizzes.length - 1) {
      setCurrentQuizIndex(currentQuizIndex + 1);
    } else {
      // All quizzes answered correctly
      processCommitteeResults();
      
      // Set allAnswersCorrect to show voting popup
      setAllAnswersCorrect(true);
      
      // Finish committee mode
      setIsCommitteeMode(false);
      setCommitteeQuizzes([]);
      setCurrentQuizIndex(0);
      setTimerActive(false);
      
      // Close committee quiz popup
      const quizPopup = document.getElementById('committeeQuizPopup');
      if (quizPopup) quizPopup.classList.add('hidden');
      
      // Show voting popup
      setShowVotingPopup(true);
    }
  };
  
  // Handle select answer for committee quizzes
  const handleSelectAnswer = (value) => {
    setSelectedAnswer(value);
    handleCommitteeQuizSubmit({
      answer: value,
      quizIndex: currentQuizIndex
    });
  };
  
  // Process committee results
  const processCommitteeResults = () => {
    // Count votes for each player
    let playerAScore = 0;
    let playerBScore = 0;
    
    committeeAnswers.forEach((answer, index) => {
      if (!answer) return; // Skip if no answer
      
      const player = committeeQuizzes[index].player;
      
      if (player === 'A') {
        // For player A, "true" answers increase their score
        if (answer.answer === 'true') playerAScore++;
        // "false" answers decrease their score, neutral has no effect
        else if (answer.answer === 'false') playerAScore--;
      } else if (player === 'B') {
        // For player B, "true" answers increase their score
        if (answer.answer === 'true') playerBScore++;
        // "false" answers decrease their score, neutral has no effect
        else if (answer.answer === 'false') playerBScore--;
      }
    });
    
    // In a real app, you would update the battle's state with these results
    console.log(`Committee voting results - Player A: ${playerAScore}, Player B: ${playerBScore}`);
    
    // You would then update the battle in your database and UI
    // For demo purposes, we'll just log it
  };
  
  // Handle selecting a vote option
  const handleSelectVote = (option) => {
    setSelectedVote(option);
  };
  
  // Handle submitting the final vote
  const handleSubmitVote = () => {
    if (!selectedVote) {
      alert("Please select either option A or option B to vote.");
      return;
    }
    
    // Get the player name based on selected vote
    const playerName = selectedVote === 'A' 
      ? selectedBattleDetails?.optionA || "Player A"
      : selectedBattleDetails?.optionB || "Player B";
    
    // In a real app, you would submit this vote to your database
    console.log(`Vote submitted for ${playerName} (option ${selectedVote})`);
    
    // Close the voting popup
    setShowVotingPopup(false);
    
    // Reset selection
    setSelectedVote(null);
    setAllAnswersCorrect(false);
    
    // Thank the user
    alert(`Thank you for voting for ${playerName}! Your vote has been recorded.`);
  };
  
  // Handle quiz timer failure
  const handleTimerFailure = () => {
    // Close quiz popup immediately when time expires
    const quizPopup = document.getElementById('committeeQuizPopup');
    if (quizPopup) quizPopup.classList.add('hidden');
    
    // Finish committee mode
    setIsCommitteeMode(false);
    setCommitteeQuizzes([]);
    setCurrentQuizIndex(0);
    setTimerActive(false);
    
    // Alert the user
    alert("Time's up! You couldn't answer in time. Please try again.");
  };
  
  // Timer effect
  useEffect(() => {
    let timerId, failureTimerId;
    
    if (timerActive) {
      if (quizTimer > 0) {
        // For seconds 3 and 2, use a simple 1-second countdown
        if (quizTimer > 1) {
          timerId = setTimeout(() => {
            setQuizTimer(prevTimer => prevTimer - 1);
          }, 1000);
        } 
        // For the final second, use a more precise approach with smaller intervals
        else if (quizTimer === 1) {
          // Set up multiple timeouts for smoother transition
          timerId = setTimeout(() => {
            // Start decreasing smoothly to create a more natural disappearing effect
            setQuizTimer(0.75);
            
            setTimeout(() => {
              setQuizTimer(0.5);
              
              setTimeout(() => {
                setQuizTimer(0.25);
                
                setTimeout(() => {
                  setQuizTimer(0);
                  setTimerActive(false);
                  
                  // Schedule the failure handling after UI has updated
                  failureTimerId = setTimeout(() => {
                    handleTimerFailure();
                  }, 100);
                }, 250);
              }, 250);
            }, 250);
          }, 250);
        }
      } else {
        // Time's up! Ensure gauge is empty
        setQuizTimer(0);
        setTimerActive(false);
        
        // Schedule the failure handling after UI has updated
        failureTimerId = setTimeout(() => {
          handleTimerFailure();
        }, 200);
      }
    }
    
    return () => {
      // Cleanup all timers on component unmount or when dependencies change
      if (timerId) clearTimeout(timerId);
      if (failureTimerId) clearTimeout(failureTimerId);
    };
  }, [timerActive, quizTimer, currentQuizIndex, committeeQuizzes.length]);

  // Handle input changes for new battle
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    // Special handling for quiz count
    if (name === 'quizCount') {
      const count = parseInt(value);
      if (count >= 1 && count <= 5) {
        // Update quizzes array length
        const newQuizzes = [...(newBattle.quizzes || [''])];
        const newAnswers = [...(newBattle.quizAnswers || ['true'])];
        
        if (count > newQuizzes.length) {
          // Add empty quizzes with default answers
          while (newQuizzes.length < count) {
            newQuizzes.push('');
            newAnswers.push('true'); // Default answer is O (true)
          }
        } else if (count < newQuizzes.length) {
          // Remove extra quizzes and answers
          newQuizzes.splice(count);
          newAnswers.splice(count);
        }
        
        setNewBattle(prev => ({
          ...prev,
          quizCount: count,
          quizzes: newQuizzes,
          quizAnswers: newAnswers
        }));
      }
    } else {
      setNewBattle(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };
  
  // Handle quiz input changes
  const handleQuizChange = (index, value) => {
    const updatedQuizzes = [...newBattle.quizzes];
    updatedQuizzes[index] = value;
    setNewBattle(prev => ({
      ...prev,
      quizzes: updatedQuizzes
    }));
  };
  
  // Handle quiz answer changes (O/X)
  const handleQuizAnswerChange = (index, value) => {
    const updatedAnswers = [...(newBattle.quizAnswers || [])];
    // Ensure the array has the correct length
    while (updatedAnswers.length <= index) {
      updatedAnswers.push('true');
    }
    updatedAnswers[index] = value;
    setNewBattle(prev => ({
      ...prev,
      quizAnswers: updatedAnswers
    }));
  };
  
  // Handle challenger quiz answer changes (O/X)
  const handleChallengerQuizAnswerChange = (index, value) => {
    const updatedAnswers = [...(challengerQuizAnswers || [])];
    // Ensure the array has the correct length
    while (updatedAnswers.length <= index) {
      updatedAnswers.push('true');
    }
    updatedAnswers[index] = value;
    setChallengerQuizAnswers(updatedAnswers);
  };
  
  // Handle form submission to create a new battle
  const handleCreateBattle = () => {
    if (!newBattle.title || !newBattle.optionA || !newBattle.betAmount) {
      alert('Please fill in all required fields');
      return;
    }
    
    // Validate quizzes
    const filledQuizzes = newBattle.quizzes.filter(quiz => quiz.trim() !== '');
    if (filledQuizzes.length !== newBattle.quizCount) {
      alert(`Please fill in all ${newBattle.quizCount} quizzes`);
      return;
    }
    
    // Create a new waiting battle
    const newWaitingBattle = {
      id: Math.max(...waitingBattles.map(battle => battle.id), 0) + 1,
      title: newBattle.title,
      optionA: newBattle.optionA,
      optionB: "Open for challenge",
      betAmount: newBattle.betAmount,
      waiting: true,
      photoA: newBattle.photoA,
      photoB: null,
      quizCount: newBattle.quizCount,
      quizzesA: newBattle.quizzes,
      quizzesAAnswers: newBattle.quizAnswers,
      quizzesB: Array(newBattle.quizCount).fill(''), // Empty quizzes for challenger
      quizzesBAnswers: Array(newBattle.quizCount).fill('true') // Default answers for challenger quizzes
    };
    
    // Add to waiting battles
    setWaitingBattles(prev => [newWaitingBattle, ...prev]);
    
    // Reset the form
    setNewBattle({
      title: '',
      optionA: '',
      betAmount: '',
      category: 'sports',
      photoA: null,
      quizCount: 1,
      quizzes: ['']
    });
    
    // Close the popup
    const popup = document.getElementById('newBattlePopup');
    if (popup) popup.classList.add('hidden');
  };
  
  // Open the accept challenge popup
  const handleOpenChallenge = (battle) => {
    setSelectedChallenge(battle);
    setChallengeResponse('');
    setResponsePhoto(null);
    
    // Initialize challenger quizzes array based on the battle's quiz count
    if (battle.quizCount) {
      setChallengerQuizzes(Array(battle.quizCount).fill(''));
      // Initialize all challenger quiz answers to true (O) by default
      setChallengerQuizAnswers(Array(battle.quizCount).fill('true'));
    } else {
      setChallengerQuizzes([]);
      setChallengerQuizAnswers([]);
    }
    
    const popup = document.getElementById('acceptChallengePopup');
    if (popup) popup.classList.remove('hidden');
  };
  
  // Handle challenger quiz change
  const handleChallengerQuizChange = (index, value) => {
    const updatedQuizzes = [...challengerQuizzes];
    updatedQuizzes[index] = value;
    setChallengerQuizzes(updatedQuizzes);
  };
  
  // Handle accepting a challenge
  const handleAcceptChallenge = () => {
    if (!challengeResponse || !selectedChallenge) {
      alert('Please enter your position');
      return;
    }
    
    // Check if all quizzes are filled
    if (selectedChallenge.quizCount) {
      const filledQuizzes = challengerQuizzes.filter(quiz => quiz.trim() !== '');
      if (filledQuizzes.length !== selectedChallenge.quizCount) {
        alert(`Please fill in all ${selectedChallenge.quizCount} quizzes`);
        return;
      }
    }
    
    // Move the battle from waiting to hot battles
    const updatedBattle = {
      ...selectedChallenge,
      id: Math.max(...hotBattles.map(battle => battle.id), 0) + 1,
      optionB: challengeResponse,
      participants: 2,
      waiting: false,
      photoB: responsePhoto,
      quizzesB: challengerQuizzes,
      quizzesBAnswers: challengerQuizAnswers,
      quizResults: [] // Will store quiz results when committee votes
    };
    
    // Add to hot battles
    setHotBattles(prev => [updatedBattle, ...prev]);
    
    // Remove from waiting battles
    setWaitingBattles(prev => prev.filter(battle => battle.id !== selectedChallenge.id));
    
    // Add to my battles
    const myBattle = {
      ...updatedBattle,
      id: Math.max(...myBattles.map(battle => battle.id), 0) + 1,
      myChoice: 'optionB'
    };
    setMyBattles(prev => [myBattle, ...prev]);
    
    // Reset and close popup
    setSelectedChallenge(null);
    setChallengeResponse('');
    setResponsePhoto(null);
    setChallengerQuizzes([]);
    const popup = document.getElementById('acceptChallengePopup');
    if (popup) popup.classList.add('hidden');
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#0e0e10] text-white overflow-x-hidden relative">
      {/* Cyberpunk Grid Background */}
      <div className="fixed inset-0 neo-grid opacity-10 pointer-events-none z-0"></div>
      
      {/* Scanline Effect */}
      <div className="fixed inset-0 z-10 pointer-events-none overflow-hidden">
        <div className="scanline w-full h-[2px] bg-[#e50914] opacity-20"></div>
      </div>
      
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-50 bg-gradient-to-b from-black to-transparent py-4 px-6">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-6">
            {/* Logo */}
            <h1 className="text-3xl font-bold tracking-tight text-[#e50914] text-glitch">BATTLE<span className="text-white">BATTLE</span></h1>
            
            {/* Navigation Links */}
            <nav className="hidden md:flex space-x-6">
              <a href="#" className="text-sm font-medium hover:text-[#e50914] transition duration-200">Home</a>
              <a href="#" className="text-sm font-medium hover:text-[#e50914] transition duration-200">Trending</a>
              <a href="#" className="text-sm font-medium hover:text-[#e50914] transition duration-200">My Battles</a>
              <a href="#" className="text-sm font-medium hover:text-[#e50914] transition duration-200">Leaderboard</a>
            </nav>
          </div>
          
          <div className="flex items-center gap-4">
            {/* Search Icon */}
            <div className="relative group">
              <button className="p-2 hover:text-[#e50914] transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                </svg>
              </button>
              
              {/* Search Dropdown */}
              <div className="absolute right-0 top-full mt-2 w-72 bg-[#0e0e10] border border-[#e50914]/30 rounded-md shadow-lg hidden group-hover:block">
                <input
                  type="text"
                  placeholder="Search battles..."
                  className="w-full p-3 bg-black/50 border-b border-[#e50914]/20 text-white focus:outline-none"
                />
              </div>
            </div>
            
            {/* Notifications */}
            <button className="p-2 hover:text-[#e50914] transition-colors relative">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"></path>
              </svg>
              <span className="absolute top-0 right-0 w-2 h-2 bg-[#e50914] rounded-full"></span>
            </button>
            
            {/* Balance */}
            <div className="hidden sm:flex items-center gap-1.5 p-1.5 bg-[#1f1f23] rounded-md">
              <svg className="w-4 h-4 text-[#e50914]" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z"></path>
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" clipRule="evenodd"></path>
              </svg>
              <span className="text-xs font-medium">100,000</span>
            </div>
            
            {/* Profile */}
            <div className="relative group">
              <button className="flex items-center gap-2 hover:opacity-80 transition-opacity">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#e50914] to-[#6d1cb4] flex items-center justify-center text-white font-bold text-sm">
                  U
                </div>
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                </svg>
              </button>
              
              {/* Profile Dropdown */}
              <div className="absolute right-0 top-full mt-2 w-48 bg-[#1f1f23] border border-[#e50914]/30 rounded-md shadow-lg hidden group-hover:block divide-y divide-gray-800">
                <div className="p-3">
                  <p className="text-sm font-medium">User123</p>
                  <p className="text-xs text-gray-400">user@example.com</p>
                </div>
                <div className="py-1">
                  <a href="#" className="block px-4 py-2 text-sm hover:bg-[#e50914] hover:text-white transition-colors">Profile</a>
                  <a href="#" className="block px-4 py-2 text-sm hover:bg-[#e50914] hover:text-white transition-colors">Settings</a>
                  <a href="#" className="block px-4 py-2 text-sm hover:bg-[#e50914] hover:text-white transition-colors">My Battles</a>
                  <a href="#" className="block px-4 py-2 text-sm hover:bg-[#e50914] hover:text-white transition-colors">Wallet</a>
                </div>
                <div className="py-1">
                  <a href="#" className="block px-4 py-2 text-sm hover:bg-[#e50914] hover:text-white transition-colors">Logout</a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow">
        {/* Hero Banner - Featured Battle */}
        <section className="relative w-full h-[60vh] overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/40 to-[#0e0e10] z-10"></div>
          
          {/* Fallback gradient since we don't have an actual image */}
          <div className="absolute inset-0 bg-gradient-to-r from-[#6d1cb4] to-[#e50914] z-0"></div>
          
          <div className="absolute inset-0 flex items-center z-20 px-8 lg:px-16">
            <div className="max-w-3xl">
              <span className="inline-block px-3 py-1 bg-[#e50914] text-white text-xs font-bold rounded-sm mb-3">
                FEATURED BATTLE
              </span>
              <h2 className="text-4xl md:text-6xl font-bold mb-4 drop-shadow-lg">{featuredBattle.title}</h2>
              <div className="flex gap-4 mb-4 items-center">
                <div className="flex-1">
                  <div className="relative">
                    <div className="h-2 w-full bg-white/20 rounded-full overflow-hidden">
                      <div className="h-full bg-blue-500 rounded-full" style={{ width: '65%' }}></div>
                    </div>
                    <span className="absolute -top-6 left-[65%] transform -translate-x-1/2 text-sm font-medium">65%</span>
                  </div>
                  <span className="block mt-3 text-center font-bold">{featuredBattle.optionA}</span>
                </div>
                <div className="w-12 h-12 rounded-full bg-[#e50914] flex items-center justify-center text-white font-bold text-xl">VS</div>
                <div className="flex-1">
                  <div className="relative">
                    <div className="h-2 w-full bg-white/20 rounded-full overflow-hidden">
                      <div className="h-full bg-[#e50914] rounded-full" style={{ width: '35%' }}></div>
                    </div>
                    <span className="absolute -top-6 left-[35%] transform -translate-x-1/2 text-sm font-medium">35%</span>
                  </div>
                  <span className="block mt-3 text-center font-bold">{featuredBattle.optionB}</span>
                </div>
              </div>
              <div className="flex gap-4 items-center">
                <span className="text-sm text-gray-300">Bet Amount: {featuredBattle.betAmount}₩</span>
                <span className="text-sm text-gray-300">Participants: {featuredBattle.participants.toLocaleString()}</span>
                <span className="text-sm text-gray-300">Ending in: 2d 14h 35m</span>
              </div>
              <div className="mt-8 flex gap-4">
                <button className="battle-btn px-6 py-3 bg-[#e50914] text-white font-bold rounded-sm hover:bg-[#b80710] transition-colors flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"></path>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                  </svg>
                  Join Battle
                </button>
                <button className="battle-btn px-6 py-3 bg-white/10 text-white font-bold rounded-sm hover:bg-white/20 backdrop-blur-sm transition-colors flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"></path>
                  </svg>
                  Share
                </button>
              </div>
            </div>
          </div>
        </section>
        
        {/* Category Navigation */}
        <div className="px-6 py-3 overflow-x-auto scrollbar-hide">
          <div className="flex space-x-4 min-w-max">
            <button className="whitespace-nowrap px-4 py-1.5 bg-[#e50914] text-white text-sm font-medium rounded-sm">All Battles</button>
            <button className="whitespace-nowrap px-4 py-1.5 bg-[#1f1f23] text-white text-sm font-medium rounded-sm hover:bg-[#e50914]/20 transition-colors">Sports</button>
            <button className="whitespace-nowrap px-4 py-1.5 bg-[#1f1f23] text-white text-sm font-medium rounded-sm hover:bg-[#e50914]/20 transition-colors">Entertainment</button>
            <button className="whitespace-nowrap px-4 py-1.5 bg-[#1f1f23] text-white text-sm font-medium rounded-sm hover:bg-[#e50914]/20 transition-colors">Food</button>
            <button className="whitespace-nowrap px-4 py-1.5 bg-[#1f1f23] text-white text-sm font-medium rounded-sm hover:bg-[#e50914]/20 transition-colors">Technology</button>
            <button className="whitespace-nowrap px-4 py-1.5 bg-[#1f1f23] text-white text-sm font-medium rounded-sm hover:bg-[#e50914]/20 transition-colors">Music</button>
            <button className="whitespace-nowrap px-4 py-1.5 bg-[#1f1f23] text-white text-sm font-medium rounded-sm hover:bg-[#e50914]/20 transition-colors">Movies</button>
            <button className="whitespace-nowrap px-4 py-1.5 bg-[#1f1f23] text-white text-sm font-medium rounded-sm hover:bg-[#e50914]/20 transition-colors">Politics</button>
          </div>
        </div>
        
        {/* Hot Battles Section */}
        <section className="px-6 py-8">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <svg className="w-5 h-5 text-[#e50914]" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                <path fillRule="evenodd" d="M12.395 2.553a1 1 0 00-1.45-.385c-.345.23-.614.558-.822.88-.214.33-.403.713-.57 1.116-.334.804-.614 1.768-.84 2.734a31.365 31.365 0 00-.613 3.58 2.64 2.64 0 01-.945-1.067c-.328-.68-.398-1.534-.398-2.654A1 1 0 005.05 6.05 6.981 6.981 0 003 11a7 7 0 1011.95-4.95c-.592-.591-.98-.985-1.348-1.467-.363-.476-.724-1.063-1.207-2.03zM12.12 15.12A3 3 0 017 13s.879.5 2.5.5c0-1 .5-4 1.25-4.5.5 1 .786 1.293 1.371 1.879A2.99 2.99 0 0113 13a2.99 2.99 0 01-.879 2.121z" clipRule="evenodd"></path>
              </svg>
              Trending Battles
            </h2>
            <button className="text-sm text-gray-400 hover:text-white transition-colors">View All</button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {hotBattles.map((battle) => (
              <div 
                key={battle.id} 
                className="battle-card bg-[#1f1f23] rounded-md overflow-hidden border border-[#e50914]/10 cursor-pointer"
                onClick={() => handleViewBattleDetails(battle)}
              >
                <div className="h-1 bg-gradient-to-r from-blue-500 via-[#e50914] to-blue-500"></div>
                <div className="p-4">
                  <h3 className="font-bold mb-3 line-clamp-1">{battle.title}</h3>
                  <div className="flex justify-between items-center mb-4">
                    <div className="px-3 py-1 bg-blue-600 text-white text-xs rounded-sm">{battle.optionA}</div>
                    <div className="w-6 h-6 rounded-full bg-[#e50914] flex items-center justify-center text-white text-xs font-bold flicker">VS</div>
                    <div className="px-3 py-1 bg-[#e50914] text-white text-xs rounded-sm">{battle.optionB}</div>
                  </div>
                  <div className="flex justify-between text-xs text-gray-400">
                    <span>Bet: {battle.betAmount}₩</span>
                    <span>{battle.participants} participants</span>
                  </div>
                  <button 
                    className="w-full mt-3 py-2 text-xs font-medium bg-[#1f1f23] border border-[#e50914]/50 text-[#e50914] rounded-sm hover:bg-[#e50914] hover:text-white transition-colors"
                    onClick={(e) => {
                      e.stopPropagation(); // Prevent parent onClick from triggering
                      handleViewBattleDetails(battle);
                    }}
                  >
                    View Details
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
        
        {/* Waiting for Opponent Section */}
        <section className="px-6 py-8 bg-[#0a0a0c]">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <svg className="w-5 h-5 text-[#e50914]" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd"></path>
              </svg>
              Waiting for Opponents
            </h2>
            <button className="text-sm text-gray-400 hover:text-white transition-colors">View All</button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {waitingBattles.map((battle) => (
              <div key={battle.id} className="battle-card bg-[#1f1f23] rounded-md overflow-hidden border border-[#e50914]/10">
                <div className="h-1 bg-gradient-to-r from-[#e50914] to-[#6d1cb4]"></div>
                <div className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-bold line-clamp-1 flex-1">{battle.title}</h3>
                    <span className="px-2 py-0.5 bg-green-500/20 text-green-400 text-[10px] rounded-sm">OPEN</span>
                  </div>
                  <div className="flex justify-between items-center mb-4">
                    <div className="px-3 py-1 bg-blue-600 text-white text-xs rounded-sm">{battle.optionA}</div>
                    <div className="w-6 h-6 rounded-full bg-[#e50914] flex items-center justify-center text-white text-xs font-bold">VS</div>
                    <div className="px-3 py-1 bg-[#e50914] text-white text-xs rounded-sm">{battle.optionB}</div>
                  </div>
                  <div className="flex justify-between text-xs text-gray-400 mb-3">
                    <span>Bet: {battle.betAmount}₩</span>
                    <span className="flex items-center gap-1 text-green-400">
                      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path>
                      </svg>
                      Join Now
                    </span>
                  </div>
                  <button 
                    onClick={() => handleOpenChallenge(battle)}
                    className="w-full py-2 text-xs font-medium bg-[#e50914] text-white rounded-sm hover:bg-[#b80710] transition-colors battle-btn"
                  >
                    Accept Challenge
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
        
        {/* My Battles Section */}
        <section className="px-6 py-8">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <svg className="w-5 h-5 text-[#e50914]" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd"></path>
              </svg>
              My Active Battles
            </h2>
            <button className="text-sm text-gray-400 hover:text-white transition-colors">View All</button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {myBattles.map((battle) => (
              <div key={battle.id} className="battle-card bg-[#1f1f23] rounded-md overflow-hidden border border-[#e50914]/10">
                <div className="h-1 bg-gradient-to-r from-[#6d1cb4] to-[#e50914]"></div>
                <div className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-bold line-clamp-1 flex-1">{battle.title}</h3>
                    <span className="px-2 py-0.5 bg-blue-500/20 text-blue-400 text-[10px] rounded-sm">ACTIVE</span>
                  </div>
                  <div className="flex justify-between items-center mb-4">
                    <div className={`px-3 py-1 text-white text-xs rounded-sm ${battle.myChoice === 'optionA' ? 'bg-blue-600 ring-1 ring-blue-300' : 'bg-blue-600/60'}`}>
                      {battle.optionA}
                    </div>
                    <div className="w-6 h-6 rounded-full bg-[#e50914] flex items-center justify-center text-white text-xs font-bold">VS</div>
                    <div className={`px-3 py-1 text-white text-xs rounded-sm ${battle.myChoice === 'optionB' ? 'bg-[#e50914] ring-1 ring-red-300' : 'bg-[#e50914]/60'}`}>
                      {battle.optionB}
                    </div>
                  </div>
                  <div className="flex justify-between text-xs text-gray-400 mb-3">
                    <span>Bet: {battle.betAmount}₩</span>
                    <span className="text-yellow-400 flex items-center gap-1">
                      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.707l-3-3a1 1 0 00-1.414 0l-3 3a1 1 0 001.414 1.414L9 9.414V13a1 1 0 102 0V9.414l1.293 1.293a1 1 0 001.414-1.414z" clipRule="evenodd"></path>
                      </svg>
                      Your Pick
                    </span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-1.5 mb-3">
                    <div className="bg-gradient-to-r from-blue-500 to-[#e50914] h-1.5 rounded-full" style={{ width: battle.myChoice === 'optionA' ? '65%' : '35%' }}></div>
                  </div>
                  <button className="w-full py-2 text-xs font-medium bg-[#1f1f23] border border-[#e50914]/50 text-[#e50914] rounded-sm hover:bg-[#e50914]/10 transition-colors">View Details</button>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>

      {/* Create New Battle Button */}
      <div className="fixed bottom-8 right-8 z-40">
        <button
          className="battle-btn w-14 h-14 rounded-full bg-[#e50914] text-white flex items-center justify-center shadow-lg hover:bg-[#b80710] transition-colors duration-300 focus:outline-none pulse"
          onClick={() => {
            const popup = document.getElementById('newBattlePopup');
            if (popup) popup.classList.remove('hidden');
          }}
        >
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
          </svg>
        </button>
      </div>

      {/* Create New Battle Popup */}
      <div id="newBattlePopup" className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 hidden overflow-y-auto">
        <div className="bg-[#1f1f23] rounded-md p-6 w-full max-w-md mx-4 my-8 border border-[#e50914]/30 animate-fadeIn max-h-[90vh] overflow-y-auto">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-bold text-white flex items-center gap-2">
              <svg className="w-5 h-5 text-[#e50914]" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd"></path>
              </svg>
              Create New Battle
            </h3>
            <button 
              className="text-gray-400 hover:text-white transition-colors"
              onClick={() => {
                const popup = document.getElementById('newBattlePopup');
                if (popup) popup.classList.add('hidden');
              }}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
              </svg>
            </button>
          </div>
          
          <form className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Battle Topic</label>
              <input 
                type="text" 
                name="title"
                value={newBattle.title}
                onChange={handleInputChange}
                placeholder="Who is better at soccer?" 
                className="w-full px-4 py-3 bg-[#0a0a0c] border border-[#e50914]/30 rounded-sm text-white focus:outline-none focus:ring-2 focus:ring-[#e50914]/50 focus:border-transparent" 
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Your Position</label>
              <div className="flex gap-2">
                <div className="flex-1">
                  <input 
                    type="text" 
                    name="optionA"
                    value={newBattle.optionA}
                    onChange={handleInputChange}
                    placeholder="Neymar" 
                    className="w-full px-4 py-3 bg-[#0a0a0c] border border-blue-600/30 rounded-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent" 
                  />
                </div>
                <div className="relative">
                  <input
                    type="file"
                    id="photoA-upload"
                    accept="image/*"
                    onChange={(e) => handleFileUpload((photo) => setNewBattle({...newBattle, photoA: photo}), e)}
                    className="hidden"
                  />
                  <label
                    htmlFor="photoA-upload"
                    className="cursor-pointer h-[46px] px-3 bg-[#0a0a0c] border border-blue-600/30 rounded-sm text-white flex items-center justify-center hover:bg-blue-600/10 transition-colors"
                  >
                    {newBattle.photoA ? (
                      <div className="w-6 h-6 rounded-full overflow-hidden">
                        <Image 
                          src={newBattle.photoA}
                          alt="Your photo"
                          width={24}
                          height={24}
                          className="object-cover w-full h-full"
                        />
                      </div>
                    ) : (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                      </svg>
                    )}
                  </label>
                </div>
              </div>
              <p className="mt-1 text-xs text-gray-400">Other users will be able to challenge your position. Upload your photo to show alongside your position.</p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Betting Amount (₩)</label>
              <input 
                type="number" 
                name="betAmount"
                value={newBattle.betAmount}
                onChange={handleInputChange}
                placeholder="5000" 
                className="w-full px-4 py-3 bg-[#0a0a0c] border border-[#e50914]/30 rounded-sm text-white focus:outline-none focus:ring-2 focus:ring-[#e50914]/50 focus:border-transparent" 
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Category</label>
              <select 
                name="category"
                value={newBattle.category}
                onChange={handleInputChange}
                className="w-full px-4 py-3 bg-[#0a0a0c] border border-[#e50914]/30 rounded-sm text-white focus:outline-none focus:ring-2 focus:ring-[#e50914]/50 focus:border-transparent appearance-none"
              >
                <option value="sports">Sports</option>
                <option value="entertainment">Entertainment</option>
                <option value="food">Food</option>
                <option value="technology">Technology</option>
                <option value="music">Music</option>
                <option value="movies">Movies</option>
                <option value="other">Other</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Number of Statements (1-5)</label>
              <div className="flex items-center">
                <input 
                  type="range" 
                  min="1" 
                  max="5" 
                  name="quizCount"
                  value={newBattle.quizCount}
                  onChange={handleInputChange}
                  className="w-full h-2 bg-[#0a0a0c] rounded-full appearance-none cursor-pointer accent-[#e50914]"
                />
                <span className="ml-3 font-bold text-white">{newBattle.quizCount}</span>
              </div>
              <p className="mt-1 text-xs text-gray-400">Create statements about your position. Your opponent will also create statements. Committee members will vote on all statements with O or X.</p>
            </div>
            
            {/* Quiz inputs */}
            {newBattle.quizzes.map((quiz, index) => (
              <div key={index} className="mb-5 bg-[#0a0a0c] p-3 rounded-md border border-gray-800">
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Statement {index + 1}: Create a statement that supports your position
                </label>
                <input 
                  type="text" 
                  value={quiz}
                  onChange={(e) => handleQuizChange(index, e.target.value)}
                  placeholder={`${newBattle.optionA || 'Your position'} is better because...`}
                  className="w-full px-4 py-3 bg-black/30 border border-[#e50914]/30 rounded-sm text-white focus:outline-none focus:ring-2 focus:ring-[#e50914]/50 focus:border-transparent mb-3" 
                />
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-400">Correct answer:</span>
                  <div className="flex items-center gap-2">
                    <label className="flex items-center cursor-pointer">
                      <input 
                        type="radio" 
                        name={`creator-quiz-answer-${index}`} 
                        value="true" 
                        checked={(newBattle.quizAnswers && newBattle.quizAnswers[index]) === 'true'}
                        onChange={() => handleQuizAnswerChange(index, 'true')}
                        className="hidden"
                      />
                      <span className={`w-8 h-8 flex items-center justify-center font-bold rounded-full transition-colors 
                        ${(newBattle.quizAnswers && newBattle.quizAnswers[index]) === 'true' 
                          ? 'bg-green-600 text-white border-2 border-white' 
                          : 'bg-green-600/20 text-green-500 border border-green-600/30 hover:bg-green-600/30'}`}>
                        O
                      </span>
                    </label>
                    <label className="flex items-center cursor-pointer">
                      <input 
                        type="radio" 
                        name={`creator-quiz-answer-${index}`} 
                        value="false"
                        checked={(newBattle.quizAnswers && newBattle.quizAnswers[index]) === 'false'}
                        onChange={() => handleQuizAnswerChange(index, 'false')}
                        className="hidden"
                      />
                      <span className={`w-8 h-8 flex items-center justify-center font-bold rounded-full transition-colors 
                        ${(newBattle.quizAnswers && newBattle.quizAnswers[index]) === 'false' 
                          ? 'bg-red-600 text-white border-2 border-white' 
                          : 'bg-red-600/20 text-red-500 border border-red-600/30 hover:bg-red-600/30'}`}>
                        X
                      </span>
                    </label>
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-1">Select the correct answer for your statement</p>
              </div>
            ))}
            
            <button 
              type="button" 
              onClick={handleCreateBattle}
              className="battle-btn w-full py-3 mt-6 bg-gradient-to-r from-[#e50914] to-[#6d1cb4] text-white rounded-sm font-medium hover:opacity-90 transition-opacity flex items-center justify-center gap-2 relative overflow-hidden"
            >
              <span className="relative z-10 flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
                </svg>
                Create Battle
              </span>
            </button>
          </form>
        </div>
      </div>

      {/* Accept Challenge Popup */}
      <div id="acceptChallengePopup" className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 hidden overflow-y-auto">
        <div className="bg-[#1f1f23] rounded-md p-6 w-full max-w-md mx-4 my-8 border border-[#e50914]/30 animate-fadeIn max-h-[90vh] overflow-y-auto">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-bold text-white flex items-center gap-2">
              <svg className="w-5 h-5 text-[#e50914]" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                <path fillRule="evenodd" d="M5 2a1 1 0 011 1v1h1a1 1 0 010 2H6v1a1 1 0 01-2 0V6H3a1 1 0 010-2h1V3a1 1 0 011-1zm0 10a1 1 0 011 1v1h1a1 1 0 110 2H6v1a1 1 0 11-2 0v-1H3a1 1 0 110-2h1v-1a1 1 0 011-1zM12 2a1 1 0 01.967.744L14.146 7.2 17.5 9.134a1 1 0 010 1.732l-3.354 1.935-1.18 4.455a1 1 0 01-1.933 0L9.854 12.8 6.5 10.866a1 1 0 010-1.732l3.354-1.935 1.18-4.455A1 1 0 0112 2z" clipRule="evenodd"></path>
              </svg>
              Accept Challenge
            </h3>
            <button 
              className="text-gray-400 hover:text-white transition-colors"
              onClick={() => {
                const popup = document.getElementById('acceptChallengePopup');
                if (popup) popup.classList.add('hidden');
                setSelectedChallenge(null);
              }}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
              </svg>
            </button>
          </div>
          
          {selectedChallenge && (
            <div className="space-y-4">
              <div className="p-4 bg-[#0a0a0c]/50 rounded-sm">
                <h4 className="font-bold mb-2 text-center">{selectedChallenge.title}</h4>
                <div className="flex justify-between items-center mb-4">
                  <div className="px-3 py-1 bg-blue-600 text-white text-xs rounded-sm">
                    {selectedChallenge.optionA}
                  </div>
                  <span className="text-sm">VS</span>
                  <div className="px-3 py-1 bg-[#e50914] text-white text-xs rounded-sm opacity-50">
                    Your position
                  </div>
                </div>
                <div className="text-xs text-gray-400 text-center">
                  Betting Amount: {selectedChallenge.betAmount}₩
                </div>
                {selectedChallenge.quizCount && (
                  <div className="mt-2 text-xs text-center text-yellow-400 flex items-center justify-center gap-1">
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd"></path>
                    </svg>
                    This battle requires {selectedChallenge.quizCount} quiz answers
                  </div>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Your Position</label>
                <div className="flex gap-2">
                  <div className="flex-1">
                    <input 
                      type="text" 
                      value={challengeResponse}
                      onChange={(e) => setChallengeResponse(e.target.value)}
                      placeholder="Ronaldinho" 
                      className="w-full px-4 py-3 bg-[#0a0a0c] border border-[#e50914]/30 rounded-sm text-white focus:outline-none focus:ring-2 focus:ring-[#e50914]/50 focus:border-transparent" 
                    />
                  </div>
                  <div className="relative">
                    <input
                      type="file"
                      id="photoB-upload"
                      accept="image/*"
                      onChange={(e) => handleFileUpload(setResponsePhoto, e)}
                      className="hidden"
                    />
                    <label
                      htmlFor="photoB-upload"
                      className="cursor-pointer h-[46px] px-3 bg-[#0a0a0c] border border-[#e50914]/30 rounded-sm text-white flex items-center justify-center hover:bg-[#e50914]/10 transition-colors"
                    >
                      {responsePhoto ? (
                        <div className="w-6 h-6 rounded-full overflow-hidden">
                          <Image 
                            src={responsePhoto}
                            alt="Your photo"
                            width={24}
                            height={24}
                            className="object-cover w-full h-full"
                          />
                        </div>
                      ) : (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                        </svg>
                      )}
                    </label>
                  </div>
                </div>
                <p className="mt-1 text-xs text-gray-400">Enter your position to challenge "{selectedChallenge.optionA}". Upload your photo to show alongside your position.</p>
              </div>
              
              {/* Challenger Quiz Section */}
              {selectedChallenge.quizCount > 0 && (
                <div className="border border-[#e50914]/20 rounded-md p-4 bg-[#0a0a0c]/50">
                  <h4 className="font-bold text-sm mb-3 flex items-center gap-1 text-white">
                    <svg className="w-4 h-4 text-[#e50914]" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                      <path d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z"></path>
                    </svg>
                    Create Your Quiz Statements ({selectedChallenge.quizCount})
                  </h4>
                  <p className="text-xs text-gray-400 mb-4">
                    Create your own true/false statements about your position. Committee members will vote on both players' statements.
                  </p>
                  
                  {challengerQuizzes.map((quiz, index) => (
                    <div key={index} className="mb-5 bg-[#0e0e10] p-3 rounded-md border border-gray-800">
                      <label className="block text-xs font-medium text-gray-300 mb-2">
                        Statement {index + 1}: Create a statement that supports your position
                      </label>
                      <input 
                        type="text" 
                        value={quiz}
                        onChange={(e) => handleChallengerQuizChange(index, e.target.value)}
                        placeholder={`${challengeResponse || 'Your position'} is better than ${selectedChallenge.optionA} because...`}
                        className="w-full px-4 py-3 bg-black/30 border border-[#e50914]/30 rounded-sm text-white focus:outline-none focus:ring-2 focus:ring-[#e50914]/50 focus:border-transparent text-sm mb-3" 
                      />
                      
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-400">Correct answer:</span>
                        <div className="flex items-center gap-2">
                          <label className="flex items-center cursor-pointer">
                            <input 
                              type="radio" 
                              name={`quiz-answer-${index}`} 
                              value="true" 
                              checked={(challengerQuizAnswers && challengerQuizAnswers[index]) === 'true'}
                              onChange={() => handleChallengerQuizAnswerChange(index, 'true')}
                              className="hidden"
                            />
                            <span className={`w-8 h-8 flex items-center justify-center font-bold rounded-full transition-colors 
                              ${(challengerQuizAnswers && challengerQuizAnswers[index]) === 'true' 
                                ? 'bg-green-600 text-white border-2 border-white' 
                                : 'bg-green-600/20 text-green-500 border border-green-600/30 hover:bg-green-600/30'}`}>
                              O
                            </span>
                          </label>
                          <label className="flex items-center cursor-pointer">
                            <input 
                              type="radio" 
                              name={`quiz-answer-${index}`} 
                              value="false"
                              checked={(challengerQuizAnswers && challengerQuizAnswers[index]) === 'false'}
                              onChange={() => handleChallengerQuizAnswerChange(index, 'false')}
                              className="hidden"
                            />
                            <span className={`w-8 h-8 flex items-center justify-center font-bold rounded-full transition-colors 
                              ${(challengerQuizAnswers && challengerQuizAnswers[index]) === 'false' 
                                ? 'bg-red-600 text-white border-2 border-white' 
                                : 'bg-red-600/20 text-red-500 border border-red-600/30 hover:bg-red-600/30'}`}>
                              X
                            </span>
                          </label>
                        </div>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">Select the correct answer for your statement</p>
                    </div>
                  ))}
                </div>
              )}
              
              <div className="p-3 bg-[#0a0a0c]/50 rounded-sm">
                <p className="text-sm text-gray-400">
                  By accepting this challenge:
                </p>
                <ul className="text-xs text-gray-400 list-disc pl-5 mt-1 space-y-1">
                  <li>{selectedChallenge.betAmount}₩ will be deducted from your account</li>
                  <li>The battle will move to active battles</li>
                  <li>Both players' quizzes will be evaluated by committee members</li>
                  <li>Judges will vote on the winner</li>
                </ul>
              </div>
              
              <button 
                type="button" 
                onClick={handleAcceptChallenge}
                className="battle-btn w-full py-3 mt-2 bg-[#e50914] text-white rounded-sm font-medium hover:bg-[#b80710] transition-colors flex items-center justify-center gap-2"
              >
                <span className="flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                  </svg>
                  Accept and Place Bet
                </span>
              </button>
            </div>
          )}
        </div>
      </div>
      
      {/* Battle Details Popup */}
      <div id="battleDetailsPopup" className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 hidden overflow-y-auto">
        <div className="bg-[#1f1f23] rounded-md overflow-hidden w-full max-w-3xl mx-4 my-8 border border-[#e50914]/30 animate-fadeIn max-h-[90vh] overflow-y-auto">
          {selectedBattleDetails && (
            <>
              {/* Header with close button and title */}
              <div className="relative py-3 px-4 bg-gradient-to-r from-[#6d1cb4] to-[#e50914]">
                <h2 className="text-xl font-bold text-white text-center pr-8">
                  {selectedBattleDetails.title}
                </h2>
                <button 
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 w-7 h-7 rounded-full bg-black/50 text-white flex items-center justify-center hover:bg-black/70 transition-colors"
                  onClick={() => {
                    const popup = document.getElementById('battleDetailsPopup');
                    if (popup) popup.classList.add('hidden');
                    setSelectedBattleDetails(null);
                  }}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                  </svg>
                </button>
              </div>
              
              {/* Battle Content */}
              <div className="p-4">
                {/* Players and Live Stats in one row */}
                <div className="flex gap-4">
                  {/* Player comparison */}
                  <div className="flex-1 flex gap-2">
                    {/* Player A */}
                    <div className="flex-1 bg-[#0a0a0c] rounded-md overflow-hidden">
                      <div className="h-1 bg-blue-600"></div>
                      <div className="p-3">
                        <div className="flex flex-col items-center">
                          <div className="w-20 h-20 rounded-full overflow-hidden mb-2 border-2 border-blue-600">
                            <Image 
                              src={selectedBattleDetails.photoA ? selectedBattleDetails.photoA :
                                 selectedBattleDetails.optionA.toLowerCase() === 'ronaldo' ? "/ronaldo.jpg" : 
                                 selectedBattleDetails.optionA.toLowerCase() === 'messi' ? "/messi.jpg" : 
                                 "https://via.placeholder.com/80"}
                              alt={selectedBattleDetails.optionA}
                              width={80}
                              height={80}
                              className="object-cover w-full h-full"
                            />
                          </div>
                          <h3 className="text-md font-bold text-white mb-1">{selectedBattleDetails.optionA}</h3>
                          <div className="text-[10px] bg-blue-600/20 text-blue-400 px-2 py-0.5 rounded-sm mb-2">Player1_ID</div>
                        </div>
                        
                        <div className="space-y-0.5 text-xs text-gray-400">
                          <div className="flex justify-between">
                            <span>Bet:</span>
                            <span className="text-white">{selectedBattleDetails.betAmount}₩</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Win rate:</span>
                            <span className="text-white">68%</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* VS */}
                    <div className="flex flex-col items-center justify-center px-1">
                      <div className="w-8 h-8 rounded-full bg-[#e50914] flex items-center justify-center text-white font-bold text-xs mb-1">VS</div>
                      <div className="text-[10px] text-gray-400">1d 6h</div>
                    </div>
                    
                    {/* Player B */}
                    <div className="flex-1 bg-[#0a0a0c] rounded-md overflow-hidden">
                      <div className="h-1 bg-[#e50914]"></div>
                      <div className="p-3">
                        <div className="flex flex-col items-center">
                          <div className="w-20 h-20 rounded-full overflow-hidden mb-2 border-2 border-[#e50914]">
                            <Image 
                              src={selectedBattleDetails.photoB ? selectedBattleDetails.photoB :
                                 selectedBattleDetails.optionB.toLowerCase() === 'ronaldo' ? "/ronaldo.jpg" : 
                                 selectedBattleDetails.optionB.toLowerCase() === 'messi' ? "/messi.jpg" : 
                                 "https://via.placeholder.com/80"}
                              alt={selectedBattleDetails.optionB}
                              width={80}
                              height={80}
                              className="object-cover w-full h-full"
                            />
                          </div>
                          <h3 className="text-md font-bold text-white mb-1">{selectedBattleDetails.optionB}</h3>
                          <div className="text-[10px] bg-[#e50914]/20 text-[#e50914] px-2 py-0.5 rounded-sm mb-2">Player2_ID</div>
                        </div>
                        
                        <div className="space-y-0.5 text-xs text-gray-400">
                          <div className="flex justify-between">
                            <span>Bet:</span>
                            <span className="text-white">{selectedBattleDetails.betAmount}₩</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Win rate:</span>
                            <span className="text-white">72%</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Action Buttons */}
                  <div className="w-[180px] flex flex-col gap-3">
                    <div className="space-y-3">
                      {/* Committee Button */}
                      <button 
                        className="battle-btn w-full py-2 bg-[#6d1cb4] text-white rounded-sm text-xs font-medium hover:bg-[#5a18a2] transition-colors flex items-center justify-center gap-1"
                        onClick={() => handleJoinCommittee(selectedBattleDetails)}
                      >
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122"></path>
                        </svg>
                        Join Committee
                      </button>
                      
                      {/* Side Bet Button */}
                      <button 
                        className="battle-btn w-full py-2 bg-gradient-to-r from-blue-600 to-[#e50914] text-white rounded-sm text-xs font-medium hover:opacity-90 transition-opacity flex items-center justify-center gap-1"
                        onClick={() => setShowSideBetOptions(!showSideBetOptions)}
                      >
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                        </svg>
                        {showSideBetOptions ? 'Hide Betting Options' : 'Place Side Bet'}
                      </button>
                      
                      {/* Side Bet Options - Only shown when toggle is on */}
                      {showSideBetOptions && (
                        <div className="space-y-3 animate-fadeIn">
                          {/* Current Votes Section */}
                          <div className="bg-[#0a0a0c] rounded-md p-3">
                            <h3 className="text-xs font-semibold mb-2 text-center">Current Votes</h3>
                            <div className="relative h-3 bg-gray-700 rounded-full overflow-hidden mb-1">
                              <div className="absolute left-0 top-0 h-full bg-gradient-to-r from-blue-600 to-blue-400" style={{ width: '65%' }}></div>
                              <div className="absolute right-0 top-0 h-full bg-gradient-to-r from-[#b80710] to-[#e50914]" style={{ width: '35%' }}></div>
                            </div>
                            <div className="flex justify-between text-xs">
                              <span className="text-blue-400 font-semibold">65%</span>
                              <span className="text-[#e50914] font-semibold">35%</span>
                            </div>
                            <div className="flex justify-between text-[10px] text-gray-400">
                              <span>32 votes</span>
                              <span>18 votes</span>
                            </div>
                            
                            {/* Dividend Rates */}
                            <div className="flex justify-between text-xs mt-2 pt-2 border-t border-gray-700">
                              <div className="text-center">
                                <p className="text-[10px] text-gray-400">Dividend Rate</p>
                                <p className="text-blue-400 font-semibold">x1.54</p>
                              </div>
                              <div className="text-center">
                                <p className="text-[10px] text-gray-400">Dividend Rate</p>
                                <p className="text-[#e50914] font-semibold">x2.86</p>
                              </div>
                            </div>
                          </div>
                          
                          {/* Bet Options */}
                          <div className="space-y-3">
                            {/* Side Selection Buttons */}
                            <div className="flex gap-2">
                              <button 
                                className="flex-1 py-2 bg-blue-600/20 text-blue-400 border border-blue-600/30 rounded-sm text-xs font-medium hover:bg-blue-600/30 transition-colors flex items-center justify-center gap-1"
                                onClick={() => {
                                  // Just selecting the side, not placing bet yet
                                  const betAmount = document.getElementById('bet-amount-input')?.value;
                                  if (!betAmount || parseInt(betAmount) <= 0) {
                                    alert('Please enter a valid bet amount');
                                    return;
                                  }
                                  alert(`Placed bet of ₩${betAmount} on ${selectedBattleDetails.optionA} with x1.54 dividend rate!`);
                                  setShowSideBetOptions(false);
                                }}
                              >
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
                                </svg>
                                Bet on {selectedBattleDetails.optionA}
                              </button>
                              
                              <button 
                                className="flex-1 py-2 bg-[#e50914]/20 text-[#e50914] border border-[#e50914]/30 rounded-sm text-xs font-medium hover:bg-[#e50914]/30 transition-colors flex items-center justify-center gap-1"
                                onClick={() => {
                                  // Just selecting the side, not placing bet yet
                                  const betAmount = document.getElementById('bet-amount-input')?.value;
                                  if (!betAmount || parseInt(betAmount) <= 0) {
                                    alert('Please enter a valid bet amount');
                                    return;
                                  }
                                  alert(`Placed bet of ₩${betAmount} on ${selectedBattleDetails.optionB} with x2.86 dividend rate!`);
                                  setShowSideBetOptions(false);
                                }}
                              >
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
                                </svg>
                                Bet on {selectedBattleDetails.optionB}
                              </button>
                            </div>
                            
                            {/* Bet Amount Input */}
                            <div className="relative">
                              <input
                                id="bet-amount-input"
                                type="number"
                                placeholder="Enter bet amount..."
                                className="w-full px-4 py-2 bg-black/30 border border-gray-700 rounded-sm text-white focus:outline-none focus:ring-1 focus:ring-[#e50914] focus:border-transparent text-sm"
                                min="1000"
                                step="1000"
                                defaultValue="5000"
                              />
                              <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-xs text-gray-400">₩</span>
                            </div>
                          </div>
                        </div>
                      )}
                      
                      <div className="text-[10px] text-gray-400 text-center">
                        Prize pool: ₩{parseInt(selectedBattleDetails.betAmount) * 2 + 35000}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Committee Quiz Popup */}
      <div id="committeeQuizPopup" className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 hidden overflow-y-auto">
        <div className="bg-[#1f1f23] rounded-md p-6 w-full max-w-2xl mx-4 my-8 border border-[#e50914]/30 animate-fadeIn max-h-[90vh] overflow-y-auto">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-bold text-white flex items-center gap-2">
              <svg className="w-5 h-5 text-[#e50914]" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd"></path>
              </svg>
              Committee Quiz
            </h3>
            <button 
              className="text-gray-400 hover:text-white transition-colors"
              onClick={() => {
                const popup = document.getElementById('committeeQuizPopup');
                if (popup) popup.classList.add('hidden');
                setIsCommitteeMode(false);
                setCommitteeQuizzes([]);
                setCurrentQuizIndex(0);
              }}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
              </svg>
            </button>
          </div>
          
          {isCommitteeMode && committeeQuizzes.length > 0 && (
            <div className="space-y-6">
              {/* Progress and Timer Indicator */}
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm text-gray-400">Quiz {currentQuizIndex + 1} of {committeeQuizzes.length}</span>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-400">
                    Player {committeeQuizzes[currentQuizIndex]?.player || 'A'}
                  </span>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                    quizTimer <= 1 ? 'bg-red-600 animate-pulse' : 'bg-gray-700'
                  }`}>
                    <span className="text-white">{quizTimer}</span>
                  </div>
                </div>
              </div>
              <div className="relative h-1.5 bg-gray-700 rounded-full overflow-hidden mb-2">
                <div 
                  className={`absolute left-0 top-0 h-full ${
                    committeeQuizzes[currentQuizIndex]?.player === 'A' 
                      ? 'bg-blue-600' 
                      : 'bg-[#e50914]'
                  }`}
                  style={{ width: `${((currentQuizIndex + 1) / committeeQuizzes.length) * 100}%` }}
                ></div>
              </div>
              
              {/* Timer Progress Bar */}
              <div className="relative h-1.5 bg-gray-700 rounded-full overflow-hidden">
                <div 
                  className={`absolute left-0 top-0 h-full ${
                    quizTimer <= 1 ? 'bg-red-600' : 'bg-yellow-500'
                  }`}
                  style={{ 
                    width: quizTimer <= 0 ? '0%' : `${Math.max(0, (quizTimer / 3) * 100)}%`,
                    transition: quizTimer === 1 ? 'width 0.25s linear' : 'width 1s linear'
                  }}
                ></div>
              </div>
              
              {/* Current Quiz */}
              <div className="p-5 bg-[#0a0a0c] rounded-md border border-gray-800">
                <div className="flex items-start gap-3 mb-5">
                  <div className="p-3 rounded-full bg-gradient-to-br from-blue-600 to-[#e50914] flex items-center justify-center">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                    </svg>
                  </div>
                  <div className="flex-1">
                    <div className="mb-1 text-xs text-gray-400">
                      {committeeQuizzes[currentQuizIndex]?.player === 'A' ? (
                        <span className="inline-flex items-center gap-1">
                          <span className="w-2 h-2 rounded-full bg-blue-600"></span>
                          Player A&apos;s Quiz
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1">
                          <span className="w-2 h-2 rounded-full bg-[#e50914]"></span>
                          Player B&apos;s Quiz
                        </span>
                      )}
                    </div>
                    <h4 className="text-lg font-medium text-white">
                      {committeeQuizzes[currentQuizIndex]?.question || "What do you think?"}
                    </h4>
                  </div>
                </div>
                
                {/* Answer Options */}
                <div className="mb-5 flex items-center justify-center gap-6">
                  <button
                    onClick={() => handleSelectAnswer('true')}
                    className="flex flex-col items-center cursor-pointer group"
                  >
                    <span className="text-sm text-gray-400 mb-2 group-hover:text-white transition-colors">Agree</span>
                    <span className={`w-16 h-16 flex items-center justify-center font-bold text-2xl rounded-full transition-colors
                      ${selectedAnswer === 'true' 
                        ? 'bg-green-600 text-white border-2 border-white' 
                        : 'bg-green-600/20 text-green-500 border-2 border-green-600/30 group-hover:bg-green-600/40 group-hover:border-green-600'}`}
                    >
                      O
                    </span>
                  </button>
                  
                  <button
                    onClick={() => handleSelectAnswer('false')}
                    className="flex flex-col items-center cursor-pointer group"
                  >
                    <span className="text-sm text-gray-400 mb-2 group-hover:text-white transition-colors">Disagree</span>
                    <span className={`w-16 h-16 flex items-center justify-center font-bold text-2xl rounded-full transition-colors
                      ${selectedAnswer === 'false' 
                        ? 'bg-red-600 text-white border-2 border-white' 
                        : 'bg-red-600/20 text-red-500 border-2 border-red-600/30 group-hover:bg-red-600/40 group-hover:border-red-600'}`}
                    >
                      X
                    </span>
                  </button>
                </div>
                
                {/* Timer Message */}
                <div className="text-center text-sm text-gray-400 mb-2">
                  <p>Answer quickly! You have {quizTimer} seconds left.</p>
                </div>
              </div>
              
              {/* Info Message */}
              <div className="flex justify-center pt-3">
                <div className="text-xs text-gray-400 flex items-center gap-1">
                  <svg className="w-4 h-4 text-[#e50914]" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd"></path>
                  </svg>
                  Select O or X to submit your answer and move to the next quiz
                </div>
              </div>
              
              {/* Judge Info */}
              <div className="text-center text-xs text-gray-400 mt-4 pt-4 border-t border-gray-800">
                <p>As a committee member, your votes help decide the outcome of this battle.</p>
                <p>You must answer all quizzes to complete your evaluation.</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Battle Voting Popup */}
      {showVotingPopup && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 overflow-y-auto">
          <div className="bg-[#1f1f23] rounded-md p-6 w-full max-w-2xl mx-4 my-8 border border-[#e50914]/30 animate-fadeIn max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <svg className="w-5 h-5 text-[#e50914]" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                  <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z"></path>
                </svg>
                Vote on Battle
              </h3>
              <button 
                className="text-gray-400 hover:text-white transition-colors"
                onClick={() => setShowVotingPopup(false)}
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                </svg>
              </button>
            </div>
            
            <div className="text-center mb-6">
              <h4 className="text-lg font-medium text-white mb-2">Congratulations! You've successfully completed all quizzes.</h4>
              <p className="text-sm text-gray-400">Now, cast your vote for the player you think should win this battle.</p>
            </div>
            
            <div className="flex gap-4 mb-8">
              {/* Option A */}
              <button 
                onClick={() => handleSelectVote('A')}
                className={`flex-1 p-5 rounded-md flex flex-col items-center gap-3 border-2 transition-all
                  ${selectedVote === 'A' 
                    ? 'border-blue-600 bg-blue-600/20' 
                    : 'border-gray-700 bg-[#0a0a0c] hover:border-blue-600/50 hover:bg-blue-600/10'}`}
              >
                <div className={`w-20 h-20 rounded-full overflow-hidden border-2 ${
                  selectedVote === 'A' ? 'border-blue-600' : 'border-blue-600/30'
                }`}>
                  <Image 
                    src={selectedBattleDetails?.photoA ? selectedBattleDetails.photoA :
                        selectedBattleDetails?.optionA?.toLowerCase() === 'ronaldo' ? "/ronaldo.jpg" : 
                        selectedBattleDetails?.optionA?.toLowerCase() === 'messi' ? "/messi.jpg" : 
                        "https://via.placeholder.com/80"}
                    alt={selectedBattleDetails?.optionA || "Player A"}
                    width={80}
                    height={80}
                    className="object-cover w-full h-full"
                  />
                </div>
                <h5 className="text-lg font-bold text-white">{selectedBattleDetails?.optionA || "Player A"}</h5>
                <p className="text-sm text-gray-400">Vote for {selectedBattleDetails?.optionA || "Player A"} to win this battle</p>
              </button>
              
              {/* Option B */}
              <button 
                onClick={() => handleSelectVote('B')}
                className={`flex-1 p-5 rounded-md flex flex-col items-center gap-3 border-2 transition-all
                  ${selectedVote === 'B' 
                    ? 'border-[#e50914] bg-[#e50914]/20' 
                    : 'border-gray-700 bg-[#0a0a0c] hover:border-[#e50914]/50 hover:bg-[#e50914]/10'}`}
              >
                <div className={`w-20 h-20 rounded-full overflow-hidden border-2 ${
                  selectedVote === 'B' ? 'border-[#e50914]' : 'border-[#e50914]/30'
                }`}>
                  <Image 
                    src={selectedBattleDetails?.photoB ? selectedBattleDetails.photoB :
                        selectedBattleDetails?.optionB?.toLowerCase() === 'ronaldo' ? "/ronaldo.jpg" : 
                        selectedBattleDetails?.optionB?.toLowerCase() === 'messi' ? "/messi.jpg" : 
                        "https://via.placeholder.com/80"}
                    alt={selectedBattleDetails?.optionB || "Player B"}
                    width={80}
                    height={80}
                    className="object-cover w-full h-full"
                  />
                </div>
                <h5 className="text-lg font-bold text-white">{selectedBattleDetails?.optionB || "Player B"}</h5>
                <p className="text-sm text-gray-400">Vote for {selectedBattleDetails?.optionB || "Player B"} to win this battle</p>
              </button>
            </div>
            
            <div className="flex justify-center">
              <button 
                onClick={handleSubmitVote}
                className="battle-btn px-8 py-3 bg-gradient-to-r from-blue-600 to-[#e50914] text-white rounded-sm font-medium hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                </svg>
                Submit Vote
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cyberpunk Background Elements */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden opacity-20">
        {/* Horizontal lines */}
        <div className="absolute top-0 left-0 right-0 h-[1px] bg-[#e50914]/20"></div>
        <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-[#e50914]/20"></div>
        
        {/* Vertical lines */}
        <div className="absolute top-0 bottom-0 left-0 w-[1px] bg-[#e50914]/20"></div>
        <div className="absolute top-0 bottom-0 right-0 w-[1px] bg-[#e50914]/20"></div>
        
        {/* Gradient overlays */}
        <div className="absolute bottom-0 left-0 right-0 h-[30vh] bg-gradient-to-t from-[#e50914]/10 to-transparent"></div>
        <div className="absolute top-0 left-0 right-0 h-[20vh] bg-gradient-to-b from-[#6d1cb4]/10 to-transparent"></div>
      </div>
    </div>
  );
}