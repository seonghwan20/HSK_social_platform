"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { ethers } from 'ethers';
import { BattleStatus } from '@/services/contracts/types';
import { SideBettingService } from '@/services/contracts/SideBettingService';
import { toast } from 'react-hot-toast';
import { BattleFactoryService } from '@/services/contracts/BattleFactoryService';
import { FaucetService } from '@/services/contracts/FaucetService';
import { formatEther, parseEther } from '../utils/ethers';

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
  contractAddress?: string;
  contractType?: 'Faucet' | 'SideBetting';
  sideBettingContract?: string;
  status?: BattleStatus;
}

export interface CommitteeQuiz {
  question: string;
  player: 'A' | 'B';
}

export interface QuizAnswer {
  answer: string;
  quizIndex: number;
}

// 기본 프로바이더 URL 상수
const DEFAULT_RPC_URL = 'https://hashkeychain-testnet.alt.technology';

// 전역 변수 - 하드코딩된 기본 프로바이더 및 서비스
let isGlobalInitialized = false;
let globalDefaultProvider: ethers.BrowserProvider | null = null;
let globalBattleFactoryService: BattleFactoryService | null = null;
let globalSideBettingService: SideBettingService | null = null;
let globalFaucetService: FaucetService | null = null;

// 기본 프로바이더 초기화 함수 (브라우저 환경에 맞게 조정)
const initializeDefaultProvider = () => {
  if (globalDefaultProvider) {
    console.log("🔷 이미 초기화된 기본 프로바이더 재사용");
    return globalDefaultProvider;
  }

  try {
    // 브라우저 환경에서만 실행
    if (typeof window === 'undefined') {
      console.error("브라우저 환경이 아닙니다.");
      return null;
    }
    
    console.log("🔷 기본 프로바이더 초기화 시작");
    
    // ethereum 객체 준비 (없으면 가상 객체 생성)
    if (!window.ethereum) {
      console.log("🔷 ethereum 객체를 생성합니다 - URL: https://hashkeychain-testnet.alt.technology");
      
      // 가상의 ethereum 객체 생성
      window.ethereum = {
        request: async ({ method, params }: any) => {
          console.log(`기본 RPC 요청: ${method}`, params);
          
          // 기본 RPC 요청 구현
          if (method === 'eth_chainId') {
            return '0x85'; // HashKey Testnet chainId (133 in hex)
          }
          
          // eth_accounts는 빈 배열 반환 (연결된 계정 없음)
          if (method === 'eth_accounts') {
            return [];
          }
          
          // eth_requestAccounts는 오류 반환 (사용자 지갑 필요)
          if (method === 'eth_requestAccounts') {
            throw new Error("사용자 지갑이 필요한 작업입니다. 지갑을 연결해주세요.");
          }
          
          // 다른 메서드들은 null 반환
          return null;
        },
        on: (event: string, callback: any) => {
          console.log(`이벤트 등록 (가상): ${event}`);
          return window.ethereum;
        },
        removeListener: (event: string, callback: any) => {
          console.log(`이벤트 제거 (가상): ${event}`);
          return window.ethereum;
        },
        isMetaMask: false,
        isConnected: () => false,
        networkVersion: '133',
        chainId: '0x85', // HashKey Testnet chainId
      };
    }
    
    // BrowserProvider 생성 시도
    try {
      console.log("🔷 BrowserProvider 생성 시도");
      const provider = new ethers.BrowserProvider(window.ethereum, {
        chainId: 133,
        name: 'HashKey Testnet',
        ensAddress: undefined
      });
      
      // 기본 검증 - 네트워크 연결 확인
      console.log("🔷 프로바이더 네트워크 검증 시도");
      
      // 최대 3번까지 재시도
      let retryCount = 0;
      const validateProvider = async (): Promise<ethers.BrowserProvider | null> => {
        try {
          // 네트워크에 연결되었는지 확인 (getBlockNumber는 가벼운 호출)
          const blockNumber = await provider.getBlockNumber();
          console.log(`🔷 네트워크 검증 성공: 현재 블록 번호 ${blockNumber}`);
          return provider;
        } catch (err) {
          if (retryCount < 2) {
            retryCount++;
            console.warn(`🔷 네트워크 검증 실패, ${retryCount}/2 재시도 중...`);
            await new Promise(r => setTimeout(r, 1000)); // 1초 대기
            return validateProvider();
          }
          console.error("🔷 네트워크 검증 최종 실패, 기본 프로바이더 생성 실패");
          throw err;
        }
      };
      
      // 전역 서비스 초기화는 검증 후 설정
      return validateProvider().then(validProvider => {
        if (validProvider) {
          globalDefaultProvider = validProvider;
          globalBattleFactoryService = new BattleFactoryService(validProvider);
          globalSideBettingService = new SideBettingService(validProvider);
          globalFaucetService = new FaucetService(validProvider);
          console.log("✅ 기본 프로바이더 및 서비스 초기화 완료");
          return validProvider;
        }
        return null;
      });
    } catch (providerError) {
      console.error("⚠️ BrowserProvider 생성 실패:", providerError);
      toast.error("기본 프로바이더 초기화에 실패했습니다");
      return null;
    }
  } catch (error) {
    console.error("⚠️ 기본 프로바이더 초기화 실패:", error);
    return null;
  }
};

// 항상 시작 시 프로바이더 초기화
initializeDefaultProvider();

export function useBattleLogic() {
  // 초기화 완료 여부를 추적하는 ref 추가
  const isInitialized = useRef(false);
  const isLoadingRef = useRef(false);
  
  // 하드코딩된 프로바이더는 이제 전역 변수 사용
  // const defaultProviderRef = useRef<ethers.JsonRpcProvider | null>(null);
  
  // 지갑 관련 상태
  const [account, setAccount] = useState<string>('');
  const [provider, setProvider] = useState<ethers.BrowserProvider | null>(null);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [balance, setBalance] = useState<string>("0.0000");
  
  // 배틀 데이터 상태
  const [featuredBattle, setFeaturedBattle] = useState<Battle | null>({
    id: 1,
    title: "Loading Battle...",
    optionA: "Option A",
    optionB: "Option B",
    betAmount: "0.01",
    participants: 0,
    waiting: false
  } as Battle);
  
  // 배틀 관련 상태
  const [hotBattles, setHotBattles] = useState<Battle[]>([
    { 
      id: 1, 
      title: "Who is the better soccer player?", 
      optionA: "Neymar", 
      optionB: "Ronaldinho", 
      betAmount: "0.03", 
      participants: 128,
      quizzesA: [
        "Neymar has won more international trophies than Ronaldinho's was."
      ],
      quizzesB: [
        "Ronaldinho won the Ballon d'Or, which Neymar has never won.",
        "Ronaldinho had a greater impact on world football than Neymar."
      ],
      quizzesAAnswers: ["true"],
      quizzesBAnswers: ["true", "true"]
    }
  ]);
  
  const [waitingBattles, setWaitingBattles] = useState<Battle[]>([
    { id: 5, title: "Which programming language is better?", optionA: "JavaScript", optionB: "Open for challenge", betAmount: "0.025", waiting: true }
  ]);
  
  const [myBattles, setMyBattles] = useState<Battle[]>([
    { id: 9, title: "Which travel destination is better?", optionA: "Europe", optionB: "Southeast Asia", betAmount: "0.01", myChoice: "optionA" }
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
  
  // 퀴즈 검증 스킵 플래그
  const skipQuizValidation = true; // 개발 중에는 퀴즈 검증을 건너뛰도록 설정
  
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
  
  // 배틀 데이터 로딩 상태 추가
  const [isLoadingBattles, setIsLoadingBattles] = useState<boolean>(false);
  
  // 배틀 상태 관리
  const [battleStatus, setBattleStatus] = useState<BattleStatus | null>(null);
  const [unsubscribeStatus, setUnsubscribeStatus] = useState<(() => void) | null>(null);
  
  // 사이드베팅 관련 상태
  const [player1Odds, setPlayer1Odds] = useState<string>("0");
  const [player2Odds, setPlayer2Odds] = useState<string>("0");
  const [player1BetAmount, setPlayer1BetAmount] = useState<string>("");
  const [player2BetAmount, setPlayer2BetAmount] = useState<string>("");
  
  // 배틀 데이터 로딩 함수 - 전역 기본 프로바이더 사용
  const loadBattleData = useCallback(async () => {
    // 동시에 여러 번 호출 방지
    if (isLoadingRef.current) {
      console.log("⏳ 이미 데이터를 로딩 중입니다. 중복 호출 무시.");
      return;
    }

    // 로딩 타임아웃 설정
    let loadingTimeout: NodeJS.Timeout | null = null;

    try {
      // 로딩 상태 설정
      isLoadingRef.current = true;
      setIsLoadingBattles(true);

      // 30초 타임아웃 설정 - 로딩이 너무 오래 걸리면 자동으로 초기화
      loadingTimeout = setTimeout(() => {
        console.warn("⚠️ 데이터 로딩 타임아웃 발생! 로딩 상태 초기화");
        isLoadingRef.current = false;
        setIsLoadingBattles(false);
      }, 30000);

      console.log("🔄 배틀 데이터 로딩 시작");

      // 기본 프로바이더가 없으면 초기화
      if (!globalDefaultProvider) {
        await initializeDefaultProvider();
      }

      // 사용할 서비스 결정 (지갑 연결 여부에 따라)
      const serviceToUse = isConnected && provider 
        ? new BattleFactoryService(provider) // 지갑 연결 시 연결된 프로바이더 사용
        : globalBattleFactoryService; // 연결 안된 경우 기본 프로바이더 사용

      if (!serviceToUse) {
        throw new Error("서비스가 초기화되지 않았습니다");
      }

      // 모든 배틀 목록 가져오기
      console.log("📋 모든 배틀 데이터 가져오기");
      const result = await serviceToUse.getAllBattleMetas();

      if (!result.success || !result.battleMetas) {
        console.error("배틀 데이터 가져오기 실패:", result.message);
        
        // 조기 반환하기 전에 상태 정리
        if (loadingTimeout) clearTimeout(loadingTimeout);
        isLoadingRef.current = false;
        setIsLoadingBattles(false);
        
        // 에러 토스트 표시
        toast.error("배틀 데이터를 가져오는데 실패했습니다");
        return;
      }

      console.log(`${result.battleMetas.length}개 배틀 발견`);

      // 배틀 데이터 처리
      const allBattles = result.battleMetas.map(meta => ({
        id: meta.battleId,
        title: meta.title || 'Untitled Battle',
        optionA: meta.player1Bet || 'Option A',
        optionB: meta.isAccepted ? (meta.player2Bet || 'Option B') : "Open for challenge",
        contractAddress: meta.battleContract || '',
        betAmount: formatEther(meta.betAmount) || '0.01',
        participants: meta.isAccepted ? 2 : 1,
        category: 'general',
        waiting: !meta.isAccepted,
        creator: meta.player1 || '',
        status: {
          isActive: true,
          sideBettingOpen: true,
          sideBettingDeadline: Date.now() + 86400000, // 현재 시간 + 24시간
          committeeRecruitmentOpen: true,
          committeeCount: 0,
          minimumCommittee: meta.minimumCommittee || 3,
          votingPhase: false,
          votingDeadline: Date.now() + 172800000, // 현재 시간 + 48시간
          gameEnded: false
        }
      }));

      // 활성 배틀 (수락된 배틀)
      const activeBattles = allBattles.filter(battle => !battle.waiting);

      // 대기 중인 배틀 (수락되지 않은 배틀)
      const waitingBattles = allBattles.filter(battle => battle.waiting);

      // 내 배틀 (내 주소로 필터링) - 계정이 있을 때만
      const myBattles = isConnected && account
        ? allBattles.filter(battle => 
            battle.creator.toLowerCase() === account.toLowerCase())
        : [];

      // 상태 업데이트
      setHotBattles(activeBattles.length > 0 ? activeBattles : []);
      setWaitingBattles(waitingBattles.length > 0 ? waitingBattles : []);
      setMyBattles(myBattles.length > 0 ? myBattles : []);
      
      // 대표 배틀 설정 - null일 가능성 없애기 위해 조건 수정
      if (activeBattles.length > 0) {
        setFeaturedBattle(activeBattles[0]);
      } else if (waitingBattles.length > 0) {
        setFeaturedBattle(waitingBattles[0]);
      }

      console.log("✅ 배틀 데이터 로딩 완료", {
        all: allBattles.length,
        active: activeBattles.length,
        waiting: waitingBattles.length,
        my: myBattles.length
      });

    } catch (error) {
      console.error("❌ 배틀 데이터 로딩 오류:", error);
      toast.error("배틀 데이터 로딩 중 오류가 발생했습니다");
    } finally {
      // 타임아웃 제거
      if (loadingTimeout) clearTimeout(loadingTimeout);
      
      // 로딩 상태 해제
      isLoadingRef.current = false;
      setIsLoadingBattles(false);
    }
  }, [isConnected, account, provider, setIsLoadingBattles]);

  // 초기화 함수 - 페이지 로드 시 한 번만 실행
  useEffect(() => {
    // 컴포넌트 내 초기화가 이미 진행된 경우
    if (isInitialized.current) {
      console.log("컴포넌트 내 초기화가 이미 완료되었습니다. 중복 초기화 방지.");
      return;
    }
    
    console.log("🔄 useBattleLogic 초기화 시작 - 기본 프로바이더 사용");
    isInitialized.current = true;
    isGlobalInitialized = true;
    
    // 초기화 타임아웃 설정
    let initTimeout: NodeJS.Timeout | null = null;
    
    try {
      // 1. 데이터 로딩 시작 - 기본 프로바이더로 즉시 시작
      console.log("기본 프로바이더로 데이터 로딩 시작");
      
      // 초기화 타임아웃 설정 - 15초 이상 진행되지 않으면 초기화 상태 리셋
      initTimeout = setTimeout(() => {
        console.warn("⚠️ 초기화 타임아웃 발생. 초기화 상태 리셋");
        isInitialized.current = false;
        isGlobalInitialized = false;
        isLoadingRef.current = false;
        setIsLoadingBattles(false);
      }, 15000);
      
      // 약간의 지연 후 데이터 로딩 시작 - 컴포넌트 마운트 완료 후
      setTimeout(() => {
        if (!isLoadingRef.current) {
          loadBattleData()
            .then(() => {
              console.log("초기 데이터 로딩 완료");
              if (initTimeout) clearTimeout(initTimeout);
            })
            .catch(err => {
              console.error("초기 데이터 로딩 오류:", err);
              isLoadingRef.current = false; 
              setIsLoadingBattles(false);
            });
        }
      }, 1000);
      
      // 2. 연결 상태 로컬 스토리지에서 복원
      const tryRestoreWalletConnection = async () => {
        try {
          // 로컬 스토리지에서 이전 연결 정보 확인
          const wasConnected = localStorage.getItem('walletConnected') === 'true';
          
          // 이전에 연결된 적이 있고, ethereum 객체가 있는 경우
          if (wasConnected && typeof window !== 'undefined' && (window as any).ethereum) {
            console.log("이전 지갑 연결 기록 발견, 연결 복원 시도");
            
            // 현재 연결된 계정 확인
            const accounts = await (window as any).ethereum.request({ 
              method: 'eth_accounts' // 연결 요청 없이 현재 계정 확인
            });
            
            if (accounts && accounts.length > 0) {
              console.log("이미 연결된 지갑 발견:", accounts[0]);
              
              // 지갑 프로바이더로 전환
              const web3Provider = new ethers.BrowserProvider((window as any).ethereum, {
                chainId: 133,
                name: 'HashKey Testnet',
                ensAddress: undefined
              });
              
              // 계정 정보 설정
              setAccount(accounts[0]);
              setProvider(web3Provider);
              setIsConnected(true);
              
              // 잔액 업데이트
              try {
                const balance = await web3Provider.getBalance(accounts[0]);
                const formattedBalance = ethers.formatEther(balance);
                setBalance(parseFloat(formattedBalance).toFixed(4));
              } catch (balanceError) {
                console.error("잔액 조회 오류:", balanceError);
              }
              
              // 연결 복원 성공 메시지
              console.log("지갑 연결이 복원되었습니다:", accounts[0]);
              toast.success("지갑 연결이 복원되었습니다");
              
              // 데이터 다시 로드
              await loadBattleData();
              
              return true;
            } else {
              console.log("이전에 연결된 지갑을 찾을 수 없음");
              localStorage.removeItem('walletConnected');
            }
          }
          return false;
        } catch (error) {
          console.error("지갑 연결 복원 중 오류:", error);
          localStorage.removeItem('walletConnected');
          return false;
        }
      };
      
      // 연결 복원 시도
      tryRestoreWalletConnection().catch(console.error);
      
      // 3. 이벤트 리스너 설정
      if (typeof window !== 'undefined' && (window as any).ethereum) {
        try {
          // 계정 변경 이벤트
          (window as any).ethereum.on('accountsChanged', handleAccountChange);
          
          // 체인 변경 이벤트
          (window as any).ethereum.on('chainChanged', (chainId: string) => {
            console.log("🔗 체인 변경 감지:", chainId);
            
            // 체인 변경 시 데이터 다시 로드
            if (!isLoadingRef.current) {
              loadBattleData();
            }
          });
          
          // 연결 해제 이벤트
          (window as any).ethereum.on('disconnect', () => {
            console.log("🔌 지갑 연결 해제 감지");
            setIsConnected(false);
            setAccount('');
            localStorage.removeItem('walletConnected');
          });
        } catch (eventError) {
          console.error("이벤트 설정 중 오류:", eventError);
        }
      }
      
      // 컴포넌트 언마운트 시 청소
      return () => {
        // 타임아웃 정리
        if (initTimeout) clearTimeout(initTimeout);
        
        // 이벤트 리스너 제거
        if (typeof window !== 'undefined' && (window as any).ethereum) {
          try {
            (window as any).ethereum.removeListener('accountsChanged', handleAccountChange);
            (window as any).ethereum.removeListener('chainChanged', () => {});
          } catch (listenerError) {
            console.error("이벤트 리스너 제거 중 오류:", listenerError);
          }
        }
        
        // 로딩 상태 정리
        isLoadingRef.current = false;
        setIsLoadingBattles(false);
      };
    } catch (error) {
      console.error("초기화 중 오류 발생:", error);
      toast.error("초기화 중 오류가 발생했습니다. 페이지를 새로고침 해주세요.");
      
      // 오류 발생 시 상태 정리
      if (initTimeout) clearTimeout(initTimeout);
      isInitialized.current = false;
      isGlobalInitialized = false;
      isLoadingRef.current = false;
      setIsLoadingBattles(false);
    }
  }, [loadBattleData, setIsLoadingBattles]);

  // 지갑 연결 함수 - 사용자가 버튼 클릭 시에만 호출됨
  const connectWallet = useCallback(async () => {
    if (typeof window === 'undefined' || !(window as any).ethereum) {
      console.error("MetaMask가 설치되어 있지 않습니다.");
      toast.error("MetaMask가 설치되어 있지 않습니다. 설치 후 다시 시도해주세요.");
      return;
    }

    try {
      console.log("사용자 요청으로 지갑 연결 시도");
      
      // 지갑 연결 요청
      const accounts = await (window as any).ethereum.request({ 
        method: 'eth_requestAccounts' 
      });
      
      if (accounts.length > 0) {
        // 지갑 프로바이더로 전환
        const web3Provider = new ethers.BrowserProvider((window as any).ethereum, {
          chainId: 133,
          name: 'HashKey Testnet',
          ensAddress: undefined
        });
        
        // 상태 업데이트
        setAccount(accounts[0]);
        setProvider(web3Provider); // 지갑 프로바이더 설정
        setIsConnected(true);
        
        // 연결 상태 로컬 스토리지에 저장
        localStorage.setItem('walletConnected', 'true');
        
        // 네트워크 확인
        await switchToHashKeyNetwork();
        
        console.log("MetaMask에 연결되었습니다:", accounts[0]);
        toast.success("지갑 연결 성공!");
        
        // 지갑 연결 후 데이터 다시 로드
        console.log("지갑 연결 후 배틀 데이터 로드 시작");
        await loadBattleData();
      }
    } catch (error) {
      console.error("지갑 연결 실패:", error);
      toast.error("지갑 연결에 실패했습니다. 다시 시도해주세요.");
      localStorage.removeItem('walletConnected');
    }
  }, [loadBattleData]);

  // 지갑 연결 해제 함수
  const disconnectWallet = useCallback(async () => {
    // 상태 초기화
    setAccount('');
    setProvider(null);
    setIsConnected(false);
    setBalance("0.0000");
    
    // 로컬 스토리지에서 연결 상태 제거
    localStorage.removeItem('walletConnected');
    
    console.log("지갑 연결이 해제되었습니다. 기본 프로바이더로 전환");
    toast.success("지갑 연결이 해제되었습니다.");
    
    // 지갑 연결이 해제되면 기본 프로바이더 사용으로 자동 전환됨
    // 데이터 다시 로드
    console.log("지갑 연결 해제 후 배틀 데이터 로드 시작");
    await loadBattleData();
  }, [loadBattleData]);

  // 계정 변경 처리
  const handleAccountChange = useCallback(async (accounts: string[]) => {
    if (accounts.length === 0) {
      // 계정이 연결 해제된 경우
      console.log("지갑 연결 해제 감지");
      setIsConnected(false);
      setAccount('');
      setProvider(null);
      setBalance("0.0000");
      
      // 기본 프로바이더로 자동 전환됨
      console.log("기본 프로바이더로 전환됨");
      
      // 데이터 다시 로드
      console.log("지갑 연결 해제 후 배틀 데이터 로드 시작");
      await loadBattleData();
      return;
    }
    
    // 새 계정으로 연결된 경우
    const newAccount = accounts[0];
    console.log("계정 변경 감지:", newAccount);
    
    try {
      // 새 계정으로 프로바이더 업데이트
      const web3Provider = new ethers.BrowserProvider((window as any).ethereum, {
        chainId: 133,
        name: 'HashKey Testnet',
        ensAddress: undefined
      });
      
      setAccount(newAccount);
      setProvider(web3Provider);
      setIsConnected(true);
      
      // 잔액 업데이트
      const balance = await web3Provider.getBalance(newAccount);
      const formattedBalance = ethers.formatEther(balance);
      setBalance(parseFloat(formattedBalance).toFixed(4));
      
      // 계정 변경 후 데이터 다시 로드
      console.log("계정 변경 후 배틀 데이터 로드 시작");
      await loadBattleData();
    } catch (error) {
      console.error("계정 변경 중 오류:", error);
    }
  }, [loadBattleData]); // loadBattleData 의존성 추가

  // 지갑 연결 후 네트워크 전환
  const switchToHashKeyNetwork = async () => {
    try {
      console.log("🔄 HashKey Testnet으로 전환 시도 중...");
      
      // 현재 체인 ID 확인
      const currentChainId = await (window as any).ethereum.request({ method: 'eth_chainId' });
      
      // 이미 HashKey Testnet에 있는 경우
      if (currentChainId === '0x85') {
        console.log("✅ 이미 HashKey Testnet에 연결됨");
        return;
      }
      
      // HashKey Testnet 파라미터
      const hashKeyNetwork = {
        chainId: '0x85', // 133 in decimal
        chainName: 'HashKey Testnet',
        nativeCurrency: {
          name: 'HSK',
          symbol: 'HSK',
          decimals: 18
        },
        rpcUrls: ['https://hashkeychain-testnet.alt.technology'],
        blockExplorerUrls: ['https://hashkeychain-testnet-explorer.alt.technology']
      };

      try {
        // 먼저 네트워크 전환 시도
        await (window as any).ethereum.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: '0x85' }]
        });
      } catch (switchError: any) {
        // 네트워크가 추가되어 있지 않은 경우
        if (switchError.code === 4902) {
          // 네트워크 추가 요청
          await (window as any).ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [hashKeyNetwork],
          });
        } else {
          throw switchError;
        }
      }
      
      console.log("✅ HashKey Testnet으로 전환 완료");
    } catch (error: any) {
      if (error.code === 4001) {
        console.log("⚠️ 네트워크 전환 거부됨");
        throw new Error("네트워크 전환이 거부되었습니다.");
      }
      throw error;
    }
  };

  // 서비스 초기화 - provider 상태에 따라 지갑 또는 기본 제공자 사용
  const battleFactoryService = useMemo(() => {
    return isConnected && provider 
      ? new BattleFactoryService(provider) 
      : (globalBattleFactoryService || new BattleFactoryService(globalDefaultProvider!));
  }, [isConnected, provider]);

  const sideBettingService = useMemo(() => {
    return isConnected && provider 
      ? new SideBettingService(provider) 
      : (globalSideBettingService || new SideBettingService(globalDefaultProvider!));
  }, [isConnected, provider]);

  const faucetService = useMemo(() => {
    return isConnected && provider 
      ? new FaucetService(provider) 
      : (globalFaucetService || new FaucetService(globalDefaultProvider!));
  }, [isConnected, provider]);

  // 사이드베팅 처리
  const handlePlaceSideBet = async (battle: Battle & { sideBettingContract: string }, playerChoice: string, amount: string) => {
    if (!amount || parseFloat(amount) <= 0) {
      toast.error("베팅 금액을 입력해주세요");
      return;
    }
    
    if (!provider || !account) {
      toast.error("지갑이 연결되지 않았습니다");
      return;
    }

    try {
      // 금액을 gwei 단위로 전달
      const amountInGwei = parseEther(amount);
      
      // 지갑 잔액 확인
      const balance = await provider.getBalance(account);
      
      if (balance < amountInGwei) {
        toast.error(`잔액이 부족합니다. 필요: ${amount} HSK, 보유: ${formatEther(balance)} HSK`);
        return;
      }
      
      const result = await sideBettingService.placeBet(
        battle.sideBettingContract,
        battle.id,
        playerChoice,
        amountInGwei.toString() // gwei 단위로 전달
      );

      if (result.success) {
        toast.success("베팅이 완료되었습니다");
        // 베팅 금액 초기화
        setPlayer1BetAmount("");
        setPlayer2BetAmount("");
      } else {
        toast.error(result.message || "베팅에 실패했습니다");
      }
    } catch (error) {
      console.error("Failed to place bet:", error);
      toast.error("베팅에 실패했습니다");
    }
  };

  // 모든 상태와 함수를 객체로 반환
  return {
    // 상태 변수들
    provider,
    account,
    isConnected,
    balance,
    isLoadingBattles,
    setIsLoadingBattles, // 상태 설정 함수 추가
    error,
    allBattles: hotBattles, // 활성 배틀 목록
    waitingBattles, // 대기 중인 배틀 목록
    myBattles, // 내 배틀 목록
    featuredBattle, // 대표 배틀
    hotBattles, // 핫 배틀 목록(별도 반환)
    selectedBattleDetails, // 선택된 배틀 상세 정보
    player1Odds,
    player2Odds,
    player1BetAmount,
    player2BetAmount,
    
    // 기타 상태 변수
    newBattle,
    setNewBattle,
    selectedChallenge,
    setSelectedChallenge,
    challengeResponse,
    setChallengeResponse,
    responsePhoto,
    setResponsePhoto,
    showSideBetOptions, 
    setShowSideBetOptions,
    challengerQuizzes, 
    challengerQuizAnswers,
    setChallengerQuizzes,
    setChallengerQuizAnswers,
    isCommitteeMode,
    setIsCommitteeMode,
    committeeQuizzes,
    setCommitteeQuizzes,
    currentQuizIndex,
    setCurrentQuizIndex,
    quizTimer,
    setQuizTimer,
    timerActive,
    setTimerActive,
    selectedAnswer,
    setSelectedAnswer,
    committeeAnswers,
    setCommitteeAnswers,
    showVotingPopup,
    setShowVotingPopup,
    selectedVote,
    setSelectedVote,
    allAnswersCorrect,
    setAllAnswersCorrect,
    
    // 함수들
    loadBattleData, // 데이터 수동 새로고침을 위해 함수 추가
    setAccount,
    setProvider,
    setBalance,
    setIsConnected,
    setError,
    setHotBattles,
    setWaitingBattles,
    setMyBattles,
    setFeaturedBattle,
    setSelectedBattleDetails,
    setPlayer1Odds,
    setPlayer2Odds,
    setPlayer1BetAmount,
    setPlayer2BetAmount,
    
    // 액션 함수들
    connectWallet,
    disconnectWallet,
    handleAccountChange,
    handlePlaceSideBet,
    
    // 배틀 관련 함수
    handleFileUpload: (setter: (photo: string) => void, event: React.ChangeEvent<HTMLInputElement>) => {
      try {
        const file = event.target.files?.[0];
        if (file) {
          const imageUrl = URL.createObjectURL(file);
          setter(imageUrl);
        }
      } catch (error) {
        console.error("파일 업로드 오류:", error);
      }
    },
    
    handleViewBattleDetails: (battle: Battle) => {
      // status가 없는 경우 기본값 설정
      const battleWithStatus = {
        ...battle,
        status: battle.status || {
          isActive: true,
          sideBettingOpen: true,
          sideBettingDeadline: Date.now() + 86400000,
          committeeRecruitmentOpen: true,
          committeeCount: 0,
          minimumCommittee: 3,
          votingPhase: false,
          votingDeadline: Date.now() + 172800000,
          gameEnded: false
        }
      };
      setSelectedBattleDetails(battleWithStatus);
      const popup = document.getElementById('battleDetailsPopup');
      if (popup) popup.classList.remove('hidden');
    },
    
    handleOpenChallenge: (battle: Battle) => {
      setSelectedChallenge(battle);
      setChallengeResponse('');
      setResponsePhoto(null);
      const popup = document.getElementById('acceptChallengePopup');
      if (popup) popup.classList.remove('hidden');
    },
    
    handleChallengerQuizChange: (index: number, value: string) => {
      const updatedQuizzes = [...challengerQuizzes];
      updatedQuizzes[index] = value;
      setChallengerQuizzes(updatedQuizzes);
    },
    
    handleInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
      const { name, value } = e.target;
      setNewBattle(prev => ({
        ...prev,
        [name]: value
      }));
    },
    
    handleQuizChange: (index: number, value: string) => {
      const updatedQuizzes = [...newBattle.quizzes];
      updatedQuizzes[index] = value;
      setNewBattle(prev => ({
        ...prev,
        quizzes: updatedQuizzes
      }));
    },
    
    handleQuizAnswerChange: (index: number, value: string) => {
      const updatedAnswers = [...newBattle.quizAnswers];
      updatedAnswers[index] = value;
      setNewBattle(prev => ({
        ...prev,
        quizAnswers: updatedAnswers
      }));
    },
    
    handleChallengerQuizAnswerChange: (index: number, value: string) => {
      const updatedAnswers = [...challengerQuizAnswers];
      updatedAnswers[index] = value;
      setChallengerQuizAnswers(updatedAnswers);
    },
    
    handleCreateBattle: async (battleData: any) => {
      try {
        // 새 배틀 생성 로직 (간략화)
        const newBattleItem = {
          id: Date.now(),
          title: battleData.title,
          optionA: battleData.optionA,
          optionB: "Open for challenge",
          betAmount: battleData.betAmount,
          participants: 1,
          waiting: true,
          creator: account
        };
        
        setWaitingBattles(prev => [...prev, newBattleItem]);
        toast.success("배틀이 생성되었습니다!");
      } catch (error) {
        console.error("Error creating battle:", error);
        toast.error("배틀 생성 중 오류가 발생했습니다");
      }
    },
    
    handleAcceptChallenge: async () => {
      if (!selectedChallenge || !challengeResponse) {
        toast.error("필수 정보가 누락되었습니다");
        return;
      }
      
      try {
        // 챌린지 수락 로직 (간략화)
        const updatedBattle = {
          ...selectedChallenge,
          optionB: challengeResponse,
          waiting: false
        };
        
        setWaitingBattles(prev => prev.filter(b => b.id !== selectedChallenge.id));
        setMyBattles(prev => [...prev, updatedBattle]);
        
        const popup = document.getElementById('acceptChallengePopup');
        if (popup) popup.classList.add('hidden');
        
        toast.success("챌린지가 수락되었습니다!");
        setSelectedChallenge(null);
        setChallengeResponse('');
        setResponsePhoto(null);
      } catch (error) {
        console.error("Error accepting challenge:", error);
        toast.error("챌린지 수락 중 오류가 발생했습니다");
      }
    },
    
    handleJoinCommittee: (battle: Battle) => {
      // status가 없는 경우 기본값 설정
      const battleWithStatus = {
        ...battle,
        status: battle.status || {
          isActive: true,
          sideBettingOpen: true,
          sideBettingDeadline: Date.now() + 86400000,
          committeeRecruitmentOpen: true,
          committeeCount: 0,
          minimumCommittee: 3,
          votingPhase: false,
          votingDeadline: Date.now() + 172800000,
          gameEnded: false
        }
      };
      setSelectedBattleDetails(battleWithStatus);
      setCommitteeQuizzes([]);
      setCurrentQuizIndex(0);
      const popup = document.getElementById('committeeQuizPopup');
      if (popup) popup.classList.remove('hidden');
    },
    
    handleSelectAnswer: (value: string) => {
      setSelectedAnswer(value);
    },
    
    handleSelectVote: (option: string) => {
      setSelectedVote(option);
    },
    
    handleSubmitVote: () => {
      if (!selectedVote) {
        alert("Please select either option A or option B to vote.");
        return;
      }
      
      setShowVotingPopup(false);
      setSelectedVote(null);
      alert(`Thank you for voting! Your vote has been recorded.`);
    },
    
    // 사이드베팅 배당률 새로고침
    refreshOdds: () => {
      if (selectedBattleDetails?.sideBettingContract) {
        // 배당률 계산 로직 (간략화)
        setPlayer1Odds("1.5");
        setPlayer2Odds("2.3");
        toast.success("배당률이 업데이트되었습니다");
      }
    },
    
    // 서비스들
    battleFactoryService,
    faucetService,
    sideBettingService
  };
}