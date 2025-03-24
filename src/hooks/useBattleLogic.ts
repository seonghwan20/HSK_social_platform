import { useState, useEffect, useCallback } from 'react';
import { ethers } from 'ethers';

// 타입 정의
export interface Battle {
  id: number;
  title: string;
  optionA: string;
  optionB?: string;
  betAmount: string;
  participants?: number;
  waiting?: boolean;
  photoA?: string | null;
  photoB?: string | null;
  quizCount?: number;
  quizzesA?: string[];
  quizzesB?: string[];
  quizzesAAnswers?: string[];
  quizzesBAnswers?: string[];
  myChoice?: string;
  thumbnail?: string;
}

export interface CommitteeQuiz {
  question: string;
  player: 'A' | 'B';
}

export interface QuizAnswer {
  answer: string;
  quizIndex: number;
}

export function useBattleLogic() {
  // 지갑 관련 상태
  const [account, setAccount] = useState<string>('');
  const [provider, setProvider] = useState<ethers.Provider | null>(null);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  
  // Featured battle data
  const featuredBattle: Battle = {
    id: 0,
    title: "Who is better at soccer?",
    optionA: "Neymar",
    optionB: "Ronaldinho", 
    betAmount: "50,000",
    participants: 1842,
    thumbnail: "/battle-thumbnail.jpg"
  };
  
  // 배틀 관련 상태
  const [hotBattles, setHotBattles] = useState<Battle[]>([
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
      ],
      quizzesAAnswers: ["true", "true"],
      quizzesBAnswers: ["true", "true"]
    },
    { id: 2, title: "Which food is more delicious?", optionA: "Pizza", optionB: "Chicken", betAmount: "3,000", participants: 87 },
    { id: 3, title: "Which game is more fun?", optionA: "League of Legends", optionB: "PUBG", betAmount: "10,000", participants: 256 },
    { id: 4, title: "Which movie is better?", optionA: "Interstellar", optionB: "Inception", betAmount: "2,000", participants: 64 }
  ]);
  
  const [waitingBattles, setWaitingBattles] = useState<Battle[]>([
    { id: 5, title: "Which programming language is better?", optionA: "JavaScript", optionB: "Open for challenge", betAmount: "8,000", waiting: true },
    { id: 6, title: "Which operating system is better?", optionA: "Windows", optionB: "Open for challenge", betAmount: "7,000", waiting: true },
    { id: 7, title: "Which smartphone has better performance?", optionA: "iPhone", optionB: "Open for challenge", betAmount: "15,000", waiting: true },
    { id: 8, title: "Which dessert tastes better?", optionA: "Ice Cream", optionB: "Open for challenge", betAmount: "1,000", waiting: true }
  ]);
  
  const [myBattles, setMyBattles] = useState<Battle[]>([
    { id: 9, title: "Which travel destination is better?", optionA: "Europe", optionB: "Southeast Asia", betAmount: "12,000", myChoice: "optionA" },
    { id: 10, title: "Which cafe is better?", optionA: "Starbucks", optionB: "Twosome Place", betAmount: "3,500", myChoice: "optionB" },
    { id: 11, title: "Which sport is more fun?", optionA: "Football", optionB: "Basketball", betAmount: "5,000", myChoice: "optionA" },
    { id: 12, title: "Which fast food tastes better?", optionA: "McDonald's", optionB: "Burger King", betAmount: "2,500", myChoice: "optionB" }
  ]);
  
  // 배틀 생성 관련 상태
  const [newBattle, setNewBattle] = useState<{
    title: string;
    optionA: string;
    betAmount: string;
    category: string;
    photoA: string | null;
    quizCount: number;
    quizzes: string[];
    quizAnswers: string[];
  }>({
    title: '',
    optionA: '',
    betAmount: '',
    category: 'sports',
    photoA: null,
    quizCount: 1,
    quizzes: [''],
    quizAnswers: ['true'] // Default answers for quizzes (O=true, X=false)
  });
  
  // 챌린지 수락 관련 상태
  const [selectedChallenge, setSelectedChallenge] = useState<Battle | null>(null);
  const [challengeResponse, setChallengeResponse] = useState<string>('');
  const [responsePhoto, setResponsePhoto] = useState<string | null>(null);
  const [challengerQuizzes, setChallengerQuizzes] = useState<string[]>([]);
  const [challengerQuizAnswers, setChallengerQuizAnswers] = useState<string[]>([]);
  
  // 배틀 상세 관련 상태
  const [selectedBattleDetails, setSelectedBattleDetails] = useState<Battle | null>(null);
  const [showSideBetOptions, setShowSideBetOptions] = useState<boolean>(false);
  
  // 커미티 관련 상태
  const [isCommitteeMode, setIsCommitteeMode] = useState<boolean>(false);
  const [committeeQuizzes, setCommitteeQuizzes] = useState<CommitteeQuiz[]>([]);
  const [currentQuizIndex, setCurrentQuizIndex] = useState<number>(0);
  const [quizTimer, setQuizTimer] = useState<number>(3);
  const [timerActive, setTimerActive] = useState<boolean>(false);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [committeeAnswers, setCommitteeAnswers] = useState<QuizAnswer[]>([]);
  const [showVotingPopup, setShowVotingPopup] = useState<boolean>(false);
  const [selectedVote, setSelectedVote] = useState<string | null>(null);
  const [allAnswersCorrect, setAllAnswersCorrect] = useState<boolean>(false);
  
  // 에러 상태
  const [error, setError] = useState<string | null>(null);
  
  // 초기화 함수
  useEffect(() => {
    try {
      checkConnection();
      
      // Set up account change listener
      if (typeof window !== 'undefined' && (window as any).ethereum) {
        // Setup event listeners for MetaMask
        (window as any).ethereum.on('accountsChanged', handleAccountChange);
        (window as any).ethereum.on('chainChanged', () => window.location.reload());
        
        // Clean up event listeners when component unmounts
        return () => {
          if ((window as any).ethereum) {
            (window as any).ethereum.removeListener('accountsChanged', handleAccountChange);
            (window as any).ethereum.removeListener('chainChanged', () => window.location.reload());
          }
        };
      }
    } catch (err) {
      setError("초기화 중 오류가 발생했습니다.");
      console.error("초기화 오류:", err);
    }
  }, []);
  
  // Handle account changes
  const handleAccountChange = (accounts: string[]) => {
    if (accounts.length > 0) {
      setAccount(accounts[0]);
      setIsConnected(true);
    } else {
      setAccount('');
      setIsConnected(false);
    }
  };
  
  // 지갑 연결 확인
  const checkConnection = async () => {
    if (typeof window !== 'undefined' && (window as any).ethereum) {
      try {
        const web3Provider = new ethers.BrowserProvider((window as any).ethereum);
        const accounts = await web3Provider.listAccounts();
        
        if (accounts.length > 0) {
          setAccount(accounts[0].address);
          setProvider(web3Provider);
          setIsConnected(true);
        }
      } catch (error) {
        setError("지갑 연결 확인 중 오류가 발생했습니다.");
        console.error("연결 확인 중 오류 발생:", error);
      }
    }
  };
  
  // 지갑 연결
  const connectWallet = async () => {
    if (typeof window !== 'undefined' && typeof (window as any).ethereum !== 'undefined') {
      try {
        // wallet_requestPermissions를 사용하여 이전 연결 상태를 무시하고 
        // 항상 새로운 연결 확인 창이 표시되도록 함
        await (window as any).ethereum.request({
          method: 'wallet_requestPermissions',
          params: [{
            eth_accounts: {}
          }]
        });
        
        // 권한 요청 후 계정 접근 요청
        const accounts = await (window as any).ethereum.request({ 
          method: 'eth_requestAccounts' 
        });
        
        // Then initialize the provider
        const web3Provider = new ethers.BrowserProvider((window as any).ethereum);
        
        // Update state
        setAccount(accounts[0]);
        setProvider(web3Provider as any);
        setIsConnected(true);
        setError(null);
        
        // No need to add duplicate event listeners here
        // They are already set up in the useEffect
        
      } catch (error) {
        setError("지갑 연결에 실패했습니다.");
        console.error("지갑 연결 오류:", error);
      }
    } else {
      setError("메타마스크가 설치되어 있지 않습니다.");
      alert("메타마스크를 설치해주세요!");
    }
  };
  
  // 지갑 연결 해제
  const disconnectWallet = async () => {
    if (typeof window !== 'undefined' && typeof (window as any).ethereum !== 'undefined') {
      try {
        // This function is now called after the user confirms in the custom modal
        // No need for window.confirm here
        
        // wallet_revokePermissions 메소드를 사용하여 이 사이트에 대한 권한 해제 시도
        try {
          await (window as any).ethereum.request({
            method: 'wallet_revokePermissions',
            params: [{
              eth_accounts: {}
            }]
          });
        } catch (revokeError) {
          // wallet_revokePermissions가 지원되지 않을 경우 무시
          console.log("권한 해제 지원되지 않음:", revokeError);
        }
        
        // 앱 상태 초기화
        setAccount('');
        setProvider(null);
        setIsConnected(false);
        setError(null);
        
        console.log("지갑 연결이 해제되었습니다.");
      } catch (error) {
        setError("지갑 연결 해제 중 오류가 발생했습니다.");
        console.error("지갑 연결 해제 오류:", error);
      }
    }
  };
  
  // 파일 업로드 핸들러
  const handleFileUpload = (
    setter: (photo: string) => void,
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    try {
      const file = event.target.files?.[0];
      if (file) {
        const imageUrl = URL.createObjectURL(file);
        setter(imageUrl);
      }
    } catch (error) {
      setError("파일 업로드 중 오류가 발생했습니다.");
      console.error("파일 업로드 오류:", error);
    }
  };
  
  // 배틀 상세 보기
  const handleViewBattleDetails = (battle: Battle) => {
    try {
      setSelectedBattleDetails(battle);
      const popup = document.getElementById('battleDetailsPopup');
      if (popup) popup.classList.remove('hidden');
    } catch (error) {
      setError("배틀 상세 정보를 불러오는 중 오류가 발생했습니다.");
      console.error("배틀 상세 보기 오류:", error);
    }
  };
  
  // 커미티 참여
  // 커미티 참여 함수
  const handleJoinCommittee = useCallback((battle: Battle) => {
    try {
      // 퀴즈 유효성 확인   
      if (!battle.quizzesA || !battle.quizzesB || 
          battle.quizzesA.length === 0 || 
          battle.quizzesB.length === 0) {
        alert("이 배틀에는 풀어야 할 퀴즈가 없습니다.");
        return;
      }
      
      // 답변 데이터 확인
      if (!battle.quizzesAAnswers || !battle.quizzesBAnswers) {
        alert("이 배틀에 대한 답변 데이터가 없습니다.");
        console.error("답변 데이터 누락:", battle);
        return;
      }
      
      // 현재 배틀 저장
      setSelectedBattleDetails(battle);
      
      // 로깅
      console.log("배틀 데이터:", battle);
      console.log("퀴즈 A 답변:", battle.quizzesAAnswers);
      console.log("퀴즈 B 답변:", battle.quizzesBAnswers);
      
      // 양측 퀴즈 통합
      const combinedQuizzes: CommitteeQuiz[] = [
        ...(battle.quizzesA?.map(quiz => ({ question: quiz, player: 'A' as const })) || []),
        ...(battle.quizzesB?.map(quiz => ({ question: quiz, player: 'B' as const })) || [])
      ];
      
      setCommitteeQuizzes(combinedQuizzes);
      
      // 빈 답변 배열 초기화
      const totalQuizCount = (battle.quizzesA?.length || 0) + (battle.quizzesB?.length || 0);
      setCommitteeAnswers(Array(totalQuizCount).fill(null));
      
      // 팝업 처리
      const detailsPopup = document.getElementById('battleDetailsPopup');
      if (detailsPopup) detailsPopup.classList.add('hidden');
      
      const quizPopup = document.getElementById('committeeQuizPopup');
      if (quizPopup) quizPopup.classList.remove('hidden');
      
      // 퀴즈 상태 설정
      setIsCommitteeMode(true);
      setCurrentQuizIndex(0);
      setSelectedAnswer(null);
      setQuizTimer(3);
      
      // 타이머 시작
      setTimeout(() => {
        setTimerActive(true);
      }, 0);
    } catch (error) {
      setError("커미티 참여 중 오류가 발생했습니다.");
      console.error("커미티 참여 오류:", error);
    }
  }, []);
  
  // 커미티 퀴즈 제출
  const handleCommitteeQuizSubmit = useCallback((answer: QuizAnswer) => {
    try {
      if (!selectedBattleDetails || currentQuizIndex >= committeeQuizzes.length) {
        return;
      }
      
      // 현재 퀴즈와 정답 가져오기
      const currentQuiz = committeeQuizzes[currentQuizIndex];
      
      // 정답 확인
      let correctAnswer: string | undefined;
      
      if (currentQuiz.player === 'A') {
        // A 플레이어 퀴즈
        const quizIndex = selectedBattleDetails.quizzesA?.findIndex(
          q => q === currentQuiz.question
        );
        
        if (quizIndex !== undefined && quizIndex >= 0) {
          correctAnswer = selectedBattleDetails.quizzesAAnswers?.[quizIndex];
        }
      } else {
        // B 플레이어 퀴즈
        const quizIndex = selectedBattleDetails.quizzesB?.findIndex(
          q => q === currentQuiz.question
        );
        
        if (quizIndex !== undefined && quizIndex >= 0) {
          correctAnswer = selectedBattleDetails.quizzesBAnswers?.[quizIndex];
        }
      }
      
      // 정답 확인
      const isCorrect = answer.answer === correctAnswer;
      
      if (!isCorrect) {
        // 오답 처리
        const quizPopup = document.getElementById('committeeQuizPopup');
        if (quizPopup) quizPopup.classList.add('hidden');
        
        // 커미티 모드 종료
        setIsCommitteeMode(false);
        setCommitteeQuizzes([]);
        setCurrentQuizIndex(0);
        setTimerActive(false);
        
        alert("Sorry, that's incorrect. You can't continue as a committee member.");
        return;
      }
      
      // 답변 저장
      setCommitteeAnswers(prev => {
        const updated = [...prev];
        updated[currentQuizIndex] = answer;
        return updated;
      });
      
      // 타이머 리셋
      setQuizTimer(3);
      setTimerActive(true);
      setSelectedAnswer(null);
      
      // 다음 퀴즈로 이동 또는 종료
      if (currentQuizIndex < committeeQuizzes.length - 1) {
        setCurrentQuizIndex(prev => prev + 1);
      } else {
        // 모든 퀴즈 통과
        processCommitteeResults();
        
        setAllAnswersCorrect(true);
        setIsCommitteeMode(false);
        setCommitteeQuizzes([]);
        setCurrentQuizIndex(0);
        setTimerActive(false);
        
        // 퀴즈 팝업 닫기
        const quizPopup = document.getElementById('committeeQuizPopup');
        if (quizPopup) quizPopup.classList.add('hidden');
        
        // 투표 팝업 열기
        setShowVotingPopup(true);
      }
    } catch (error) {
      setError("퀴즈 제출 중 오류가 발생했습니다.");
      console.error("퀴즈 제출 오류:", error);
    }
  }, [selectedBattleDetails, currentQuizIndex, committeeQuizzes]);
  
  // 답변 선택 핸들러
  const handleSelectAnswer = (value: string) => {
    try {
      setSelectedAnswer(value);
      handleCommitteeQuizSubmit({
        answer: value,
        quizIndex: currentQuizIndex
      });
    } catch (error) {
      setError("답변 선택 중 오류가 발생했습니다.");
      console.error("답변 선택 오류:", error);
    }
  };
  
  // 커미티 결과 처리
  const processCommitteeResults = () => {
    try {
      let playerAScore = 0;
      let playerBScore = 0;
      
      committeeAnswers.forEach((answer, index) => {
        if (!answer) return;
        
        const player = committeeQuizzes[index]?.player;
        
        if (player === 'A') {
          if (answer.answer === 'true') playerAScore++;
          else if (answer.answer === 'false') playerAScore--;
        } else if (player === 'B') {
          if (answer.answer === 'true') playerBScore++;
          else if (answer.answer === 'false') playerBScore--;
        }
      });
      
      console.log(`Committee voting results - Player A: ${playerAScore}, Player B: ${playerBScore}`);
    } catch (error) {
      setError("결과 처리 중 오류가 발생했습니다.");
      console.error("결과 처리 오류:", error);
    }
  };
  
  // 투표 옵션 선택
  const handleSelectVote = (option: string) => {
    try {
      setSelectedVote(option);
    } catch (error) {
      setError("투표 선택 중 오류가 발생했습니다.");
      console.error("투표 선택 오류:", error);
    }
  };
  
  // 투표 제출
  const handleSubmitVote = () => {
    try {
      if (!selectedVote) {
        alert("Please select either option A or option B to vote.");
        return;
      }
      
      // 플레이어 이름 가져오기
      const playerName = selectedVote === 'A' 
        ? selectedBattleDetails?.optionA || "Player A"
        : selectedBattleDetails?.optionB || "Player B";
      
      console.log(`Vote submitted for ${playerName} (option ${selectedVote})`);
      
      setShowVotingPopup(false);
      setSelectedVote(null);
      setAllAnswersCorrect(false);
      
      alert(`Thank you for voting for ${playerName}! Your vote has been recorded.`);
    } catch (error) {
      setError("투표 제출 중 오류가 발생했습니다.");
      console.error("투표 제출 오류:", error);
    }
  };
  
  // 타이머 실패 처리
  const handleTimerFailure = useCallback(() => {
    try {
      const quizPopup = document.getElementById('committeeQuizPopup');
      if (quizPopup) quizPopup.classList.add('hidden');
      
      setIsCommitteeMode(false);
      setCommitteeQuizzes([]);
      setCurrentQuizIndex(0);
      setTimerActive(false);
      
      alert("Time's up! You couldn't answer in time. Please try again.");
    } catch (error) {
      setError("타이머 처리 중 오류가 발생했습니다.");
      console.error("타이머 실패 처리 오류:", error);
    }
  }, []);
  
  // 타이머 효과
  useEffect(() => {
    let timerId: NodeJS.Timeout | undefined;
    let failureTimerId: NodeJS.Timeout | undefined;
    
    try {
      if (timerActive) {
        if (quizTimer > 0) {
          if (quizTimer > 1) {
            timerId = setTimeout(() => {
              setQuizTimer(prev => prev - 1);
            }, 1000);
          } else {
            timerId = setTimeout(() => {
              setQuizTimer(0.75);
              
              setTimeout(() => {
                setQuizTimer(0.5);
                
                setTimeout(() => {
                  setQuizTimer(0.25);
                  
                  setTimeout(() => {
                    setQuizTimer(0);
                    setTimerActive(false);
                    
                    failureTimerId = setTimeout(() => {
                      handleTimerFailure();
                    }, 100);
                  }, 250);
                }, 250);
              }, 250);
            }, 250);
          }
        } else {
          setQuizTimer(0);
          setTimerActive(false);
          
          failureTimerId = setTimeout(() => {
            handleTimerFailure();
          }, 200);
        }
      }
    } catch (error) {
      setError("타이머 처리 중 오류가 발생했습니다.");
      console.error("타이머 효과 오류:", error);
    }
    
    return () => {
      if (timerId) clearTimeout(timerId);
      if (failureTimerId) clearTimeout(failureTimerId);
    };
  }, [timerActive, quizTimer, handleTimerFailure]);
  
  // 입력 변경 핸들러
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    try {
      const { name, value } = e.target;
      
      if (name === 'quizCount') {
        const count = parseInt(value);
        if (count >= 1 && count <= 5) {
          const newQuizzes = [...newBattle.quizzes];
          const newAnswers = [...newBattle.quizAnswers];
          
          if (count > newQuizzes.length) {
            while (newQuizzes.length < count) {
              newQuizzes.push('');
              newAnswers.push('true');
            }
          } else if (count < newQuizzes.length) {
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
    } catch (error) {
      setError("입력 처리 중 오류가 발생했습니다.");
      console.error("입력 변경 오류:", error);
    }
  };
  
  // 퀴즈 변경 핸들러
  const handleQuizChange = (index: number, value: string) => {
    try {
      const updatedQuizzes = [...newBattle.quizzes];
      updatedQuizzes[index] = value;
      setNewBattle(prev => ({
        ...prev,
        quizzes: updatedQuizzes
      }));
    } catch (error) {
      setError("퀴즈 변경 중 오류가 발생했습니다.");
      console.error("퀴즈 변경 오류:", error);
    }
  };
  
  // 퀴즈 답변 변경 핸들러
  const handleQuizAnswerChange = (index: number, value: string) => {
    try {
      const updatedAnswers = [...newBattle.quizAnswers];
      
      while (updatedAnswers.length <= index) {
        updatedAnswers.push('true');
      }
      
      updatedAnswers[index] = value;
      setNewBattle(prev => ({
        ...prev,
        quizAnswers: updatedAnswers
      }));
    } catch (error) {
      setError("퀴즈 답변 변경 중 오류가 발생했습니다.");
      console.error("퀴즈 답변 변경 오류:", error);
    }
  };
  
  // 챌린저 퀴즈 답변 변경 핸들러
  const handleChallengerQuizAnswerChange = (index: number, value: string) => {
    try {
      const updatedAnswers = [...challengerQuizAnswers];
      
      while (updatedAnswers.length <= index) {
        updatedAnswers.push('true');
      }
      
      updatedAnswers[index] = value;
      setChallengerQuizAnswers(updatedAnswers);
    } catch (error) {
      setError("챌린저 퀴즈 답변 변경 중 오류가 발생했습니다.");
      console.error("챌린저 퀴즈 답변 변경 오류:", error);
    }
  };
  
  // 배틀 생성 핸들러
  const handleCreateBattle = () => {
    try {
      if (!newBattle.title || !newBattle.optionA || !newBattle.betAmount) {
        alert('Please fill in all required fields');
        return;
      }
      
      const filledQuizzes = newBattle.quizzes.filter(quiz => quiz.trim() !== '');
      if (filledQuizzes.length !== newBattle.quizCount) {
        alert(`Please fill in all ${newBattle.quizCount} quizzes`);
        return;
      }
      
      const newWaitingBattle: Battle = {
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
        quizzesB: Array(newBattle.quizCount).fill(''),
        quizzesBAnswers: Array(newBattle.quizCount).fill('true')
      };
      
      setWaitingBattles(prev => [newWaitingBattle, ...prev]);
      
      setNewBattle({
        title: '',
        optionA: '',
        betAmount: '',
        category: 'sports',
        photoA: null,
        quizCount: 1,
        quizzes: [''],
        quizAnswers: ['true']
      });
      
      const popup = document.getElementById('newBattlePopup');
      if (popup) popup.classList.add('hidden');
    } catch (error) {
      setError("배틀 생성 중 오류가 발생했습니다.");
      console.error("배틀 생성 오류:", error);
    }
  };
  
  // 챌린지 수락 팝업 열기
  const handleOpenChallenge = (battle: Battle) => {
    try {
      setSelectedChallenge(battle);
      setChallengeResponse('');
      setResponsePhoto(null);
      
      if (battle.quizCount) {
        setChallengerQuizzes(Array(battle.quizCount).fill(''));
        setChallengerQuizAnswers(Array(battle.quizCount).fill('true'));
      } else {
        setChallengerQuizzes([]);
        setChallengerQuizAnswers([]);
      }
      
      const popup = document.getElementById('acceptChallengePopup');
      if (popup) popup.classList.remove('hidden');
    } catch (error) {
      setError("챌린지 팝업 열기 중 오류가 발생했습니다.");
      console.error("챌린지 팝업 열기 오류:", error);
    }
  };
  
  // 챌린저 퀴즈 변경 핸들러
  const handleChallengerQuizChange = (index: number, value: string) => {
    try {
      const updatedQuizzes = [...challengerQuizzes];
      updatedQuizzes[index] = value;
      setChallengerQuizzes(updatedQuizzes);
    } catch (error) {
      setError("챌린저 퀴즈 변경 중 오류가 발생했습니다.");
      console.error("챌린저 퀴즈 변경 오류:", error);
    }
  };
  
  // 챌린지 수락 핸들러
  const handleAcceptChallenge = () => {
    try {
      if (!challengeResponse || !selectedChallenge) {
        alert('Please enter your position');
        return;
      }
      
      if (selectedChallenge.quizCount) {
        const filledQuizzes = challengerQuizzes.filter(quiz => quiz.trim() !== '');
        if (filledQuizzes.length !== selectedChallenge.quizCount) {
          alert(`Please fill in all ${selectedChallenge.quizCount} quizzes`);
          return;
        }
      }
      
      const updatedBattle: Battle = {
        ...selectedChallenge,
        id: Math.max(...hotBattles.map(battle => battle.id), 0) + 1,
        optionB: challengeResponse,
        participants: 2,
        waiting: false,
        photoB: responsePhoto,
        quizzesB: challengerQuizzes,
        quizzesBAnswers: challengerQuizAnswers
      };
      
      setHotBattles(prev => [updatedBattle, ...prev]);
      
      setWaitingBattles(prev => 
        prev.filter(battle => battle.id !== selectedChallenge.id)
      );
      
      const myBattle: Battle = {
        ...updatedBattle,
        id: Math.max(...myBattles.map(battle => battle.id), 0) + 1,
        myChoice: 'optionB'
      };
      
      setMyBattles(prev => [myBattle, ...prev]);
      
      setSelectedChallenge(null);
      setChallengeResponse('');
      setResponsePhoto(null);
      setChallengerQuizzes([]);
      
      const popup = document.getElementById('acceptChallengePopup');
      if (popup) popup.classList.add('hidden');
    } catch (error) {
      setError("챌린지 수락 중 오류가 발생했습니다.");
      console.error("챌린지 수락 오류:", error);
    }
  };

  // 모든 상태와 함수를 객체로 반환
  return {
    // 상태들
    account,
    provider,
    isConnected,
    featuredBattle,
    hotBattles,
    waitingBattles,
    myBattles,
    newBattle,
    selectedChallenge,
    challengeResponse,
    responsePhoto,
    challengerQuizzes,
    challengerQuizAnswers,
    selectedBattleDetails,
    showSideBetOptions,
    isCommitteeMode,
    committeeQuizzes,
    currentQuizIndex,
    quizTimer,
    timerActive,
    selectedAnswer,
    committeeAnswers,
    showVotingPopup,
    selectedVote,
    allAnswersCorrect,
    
    // 함수들
    setAccount,
    setProvider,
    setIsConnected,
    setHotBattles,
    setWaitingBattles,
    setMyBattles,
    setNewBattle,
    setSelectedChallenge,
    setChallengeResponse,
    setResponsePhoto,
    setChallengerQuizzes,
    setChallengerQuizAnswers,
    setSelectedBattleDetails,
    setShowSideBetOptions,
    setIsCommitteeMode,
    setCommitteeQuizzes,
    setCurrentQuizIndex,
    setQuizTimer,
    setTimerActive,
    setSelectedAnswer,
    setCommitteeAnswers,
    setShowVotingPopup,
    setSelectedVote,
    setAllAnswersCorrect,
    
    connectWallet,
    disconnectWallet,
    handleFileUpload,
    handleViewBattleDetails,
    handleJoinCommittee,
    handleCommitteeQuizSubmit,
    handleSelectAnswer,
    processCommitteeResults,
    handleSelectVote,
    handleSubmitVote,
    handleTimerFailure,
    handleInputChange,
    handleQuizChange,
    handleQuizAnswerChange,
    handleChallengerQuizAnswerChange,
    handleCreateBattle,
    handleOpenChallenge,
    handleChallengerQuizChange,
    handleAcceptChallenge
  };
}