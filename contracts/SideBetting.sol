// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

interface IFaucet {
    function getGameStatus() external view returns (bool);
    function getPlayers() external view returns (address player1, address player2);
    function getGameResult() external view returns (address winner);
}

/**
 * @title SideBetting
 * @dev Faucet 게임에 대한 사이드베팅을 관리하는 컨트랙트
 */
contract SideBetting {
    IFaucet public faucetContract;
    address public owner;
    
    struct Bet {
        address bettor;
        uint256 amount;
        address playerChoice; // 어떤 플레이어에게 베팅했는지
        bool claimed;
    }
    
    struct GameInfo {
        bool exists;
        bool resultSet;
        address winner;
        uint256 totalPool;
        bool payoutComplete;
    }
    
    // 게임ID별 베팅 관리
    mapping(uint256 => Bet[]) public bets;
    mapping(uint256 => GameInfo) public games;
    mapping(uint256 => mapping(address => uint256)) public playerTotalBets;
    
    // 배당률 계산을 위한 변수
    uint256 public constant PERCENTAGE_BASE = 10000; // 100% = 10000
    uint256 public houseEdge = 250; // 2.5%
    
    event GameCreated(uint256 indexed gameId);
    event BetPlaced(uint256 indexed gameId, address indexed bettor, address playerChoice, uint256 amount);
    event GameResultSet(uint256 indexed gameId, address winner);
    event BetClaimed(uint256 indexed gameId, address indexed bettor, uint256 amount);
    event HouseEdgeUpdated(uint256 newHouseEdge);
    
    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can call this function");
        _;
    }
    
    modifier gameExists(uint256 gameId) {
        require(games[gameId].exists, "Game does not exist");
        _;
    }
    
    constructor(address _faucetAddress) {
        faucetContract = IFaucet(_faucetAddress);
        owner = msg.sender;
    }
    
    /**
     * @dev 새 게임 생성
     * @param gameId 게임 식별자
     */
    function createGame(uint256 gameId) external onlyOwner {
        require(!games[gameId].exists, "Game already exists");
        
        games[gameId] = GameInfo({
            exists: true,
            resultSet: false,
            winner: address(0),
            totalPool: 0,
            payoutComplete: false
        });
        
        emit GameCreated(gameId);
    }
    
    /**
     * @dev 특정 플레이어에게 베팅
     * @param gameId 게임 식별자
     * @param playerChoice 베팅하려는 플레이어 주소
     */
    function placeBet(uint256 gameId, address playerChoice) external payable gameExists(gameId) {
        require(msg.value > 0, "Bet amount must be greater than 0");
        require(!games[gameId].resultSet, "Game result already set");
        
        // 게임이 아직 활성 상태인지 확인
        require(faucetContract.getGameStatus(), "Game not initialized");
        
        // 선택한 플레이어가 유효한지 확인
        (address player1, address player2) = faucetContract.getPlayers();
        require(playerChoice == player1 || playerChoice == player2, "Invalid player choice");
        
        // 베팅 정보 저장
        bets[gameId].push(Bet({
            bettor: msg.sender,
            amount: msg.value,
            playerChoice: playerChoice,
            claimed: false
        }));
        
        // 통계 업데이트
        games[gameId].totalPool += msg.value;
        playerTotalBets[gameId][playerChoice] += msg.value;
        
        emit BetPlaced(gameId, msg.sender, playerChoice, msg.value);
    }
    
    /**
     * @dev 게임 결과 설정
     * @param gameId 게임 식별자
     */
    function setGameResult(uint256 gameId) external onlyOwner gameExists(gameId) {
        require(!games[gameId].resultSet, "Game result already set");
        
        // Faucet 컨트랙트에서 승자 정보 가져오기
        address winner = faucetContract.getGameResult();
        require(winner != address(0), "Winner cannot be zero address");
        
        games[gameId].resultSet = true;
        games[gameId].winner = winner;
        
        emit GameResultSet(gameId, winner);
    }
    
    /**
     * @dev 배당률 계산
     * @param gameId 게임 식별자
     * @param playerChoice 선택한 플레이어
     */
    function calculateOdds(uint256 gameId, address playerChoice) public view gameExists(gameId) returns (uint256) {
        if (games[gameId].totalPool == 0) return 0;
        
        uint256 playerPool = playerTotalBets[gameId][playerChoice];
        if (playerPool == 0) return 0;
        
        // 배당률 계산: (전체 풀 * (1 - 하우스 엣지)) / 해당 플레이어에 베팅된 금액
        uint256 poolAfterHouseEdge = (games[gameId].totalPool * (PERCENTAGE_BASE - houseEdge)) / PERCENTAGE_BASE;
        return (poolAfterHouseEdge * PERCENTAGE_BASE) / playerPool;
    }
    
    /**
     * @dev 베팅 상금 청구
     * @param gameId 게임 식별자
     * @param betIndices 청구할 베팅 인덱스 배열
     */
    function claimWinnings(uint256 gameId, uint256[] calldata betIndices) external gameExists(gameId) {
        require(games[gameId].resultSet, "Game result not set yet");
        address winner = games[gameId].winner;
        
        uint256 totalWinnings = 0;
        
        for (uint256 i = 0; i < betIndices.length; i++) {
            uint256 index = betIndices[i];
            require(index < bets[gameId].length, "Invalid bet index");
            
            Bet storage bet = bets[gameId][index];
            require(bet.bettor == msg.sender, "Not your bet");
            require(!bet.claimed, "Already claimed");
            
            if (bet.playerChoice == winner) {
                // 승리한 베팅이므로 배당률에 따른 상금 계산
                uint256 odds = calculateOdds(gameId, winner);
                uint256 winningAmount = (bet.amount * odds) / PERCENTAGE_BASE;
                totalWinnings += winningAmount;
            }
            
            // 중복 청구 방지
            bet.claimed = true;
        }
        
        require(totalWinnings > 0, "No winnings to claim");
        
        // 상금 지급
        payable(msg.sender).transfer(totalWinnings);
        
        emit BetClaimed(gameId, msg.sender, totalWinnings);
    }
    
    /**
     * @dev 하우스 엣지 업데이트
     * @param newHouseEdge 새 하우스 엣지 (PERCENTAGE_BASE 기준)
     */
    function updateHouseEdge(uint256 newHouseEdge) external onlyOwner {
        require(newHouseEdge < PERCENTAGE_BASE, "House edge too high");
        houseEdge = newHouseEdge;
        emit HouseEdgeUpdated(newHouseEdge);
    }
    
    /**
     * @dev 하우스 수수료 인출
     * @param gameId 게임 식별자
     */
    function withdrawHouseFees(uint256 gameId) external onlyOwner gameExists(gameId) {
        require(games[gameId].resultSet, "Game result not set yet");
        require(!games[gameId].payoutComplete, "House fees already withdrawn");
        
        uint256 totalPool = games[gameId].totalPool;
        uint256 houseFee = (totalPool * houseEdge) / PERCENTAGE_BASE;
        
        games[gameId].payoutComplete = true;
        
        payable(owner).transfer(houseFee);
    }
    
    /**
     * @dev 소유권 이전
     * @param newOwner 새 소유자 주소
     */
    function transferOwnership(address newOwner) external onlyOwner {
        require(newOwner != address(0), "New owner cannot be zero address");
        owner = newOwner;
    }
    
    /**
     * @dev Faucet 컨트랙트 주소 업데이트
     * @param newFaucetAddress 새 Faucet 컨트랙트 주소
     */
    function updateFaucetContract(address newFaucetAddress) external onlyOwner {
        require(newFaucetAddress != address(0), "New faucet address cannot be zero address");
        faucetContract = IFaucet(newFaucetAddress);
    }
    
    /**
     * @dev 베팅 통계 조회
     * @param gameId 게임 식별자
     */
    function getGameStats(uint256 gameId) external view gameExists(gameId) returns (
        uint256 totalPool,
        address winner,
        bool resultSet,
        uint256 player1BetAmount,
        uint256 player2BetAmount
    ) {
        (address player1, address player2) = faucetContract.getPlayers();
        
        return (
            games[gameId].totalPool,
            games[gameId].winner,
            games[gameId].resultSet,
            playerTotalBets[gameId][player1],
            playerTotalBets[gameId][player2]
        );
    }
    
    /**
     * @dev 컨트랙트 잔액 조회
     */
    function getContractBalance() external view onlyOwner returns (uint256) {
        return address(this).balance;
    }
}
