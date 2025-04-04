// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

/**
 * @title Faucet
 * @dev 두 플레이어 간의 베팅 게임을 관리하는 컨트랙트
 */
contract Faucet {
    // 상태 변수
    address public player1;
    address public player2;
    uint256 public betAmount;
    uint256 public minimumCommittee;
    uint256 public committeeCount;
    bool public gameValid;
    string public player1Bet;
    string public player2Bet;
    uint256 public quizCount;
    string public title;

    
    // 게임 기간 관련 변수
    uint256 public gameDeadline; // 게임 종료 시간 (배팅+투표 기간)
    bool public gameActive; // 게임 활성화 상태

    struct Quiz{
        string question;
        bytes32 answerHash;
        bool solved;
        address creator;
    }
    
    struct QuizInput {
    string question;
    bytes32 answerHash;
    }
    // 각 주소별 보유한 자금
    mapping(address => uint256) public stash;
    // 위원회 멤버 목록
    mapping(address => bool) public committeeList;
    // 퀴즈 목록
    mapping(uint256 => Quiz) public quizzes;

    mapping(address => uint256) public solvedCount;






    // 베팅 기간 enum
    enum BetDuration {
        ONE_DAY,
        TWO_DAY,
        THREE_DAY
    }
    
    // 이벤트 정의
    event GameFunded(address indexed funder, uint256 amount);
    event CommitteeAdded(address indexed member);
    event GameStarted(uint256 deadline, uint256 totalPot);
    event GameCancelled(string reason);
    event MinimumCommitteeMet(uint256 count);
    event GameEnded(address winner);
    event VotingPhaseStarted();
    event GameJoined();
    event QuizCreated(uint256 quizId, string question);
    event QuizSolved(address solver, uint256 quizId);
    event AllQuizzesSolved(address solver);

    /**
     * @dev 컨트랙트 생성자
     * @param _player1 첫 번째 플레이어 주소
     * @param _betAmount 베팅 금액
     * @param _minimumCommittee 최소 필요 위원회 인원 수
     */
    constructor(
        address _player1,
        uint256 _betAmount,
        uint256 _minimumCommittee,
        string memory _player1Bet,
        uint8 _durationInDays,
        string memory _title
        
    ) {
        require(_player1 != address(0), "Player1 cannot be zero address");
        require(_betAmount > 0, "Bet amount must be greater than zero");
        require(_minimumCommittee > 0, "Minimum committee must be greater than zero");
        
        player1 = _player1;
        player1Bet = _player1Bet;
        betAmount = _betAmount;
        minimumCommittee = _minimumCommittee;
        gameActive = false;
        gameValid = false;
        gameDeadline = _durationInDays;
        title = _title;
    }

    /**
     * @dev 게임에 자금을 추가
     */
    function FundGame() public payable {
        require(msg.value == betAmount, "Deposit amount must exactly match the bet amount");
        stash[msg.sender] += msg.value;
        emit GameFunded(msg.sender, msg.value);
    }

    // 백엔드에서 만든 answer hash 받아와서 저장
    function createQuiz(QuizInput[] memory inputs) public {

        require(msg.sender == player1 || msg.sender == player2, "Only players can create quizzes");

         for (uint256 i = 0; i < inputs.length; i++) {
        quizzes[quizCount] = Quiz({
            question: inputs[i].question,
            answerHash: inputs[i].answerHash,
            solved: false,
            creator: msg.sender
        });
        emit QuizCreated(quizCount, inputs[i].question);
        quizCount++;
        }

    }

    // 사용자 B의 배틀 참가
     function joinGame(string memory _player2Bet, address _player2) public {

        require(_player2 != player1 , "player1 cannot join the game");
        require( keccak256(abi.encodePacked(_player2Bet)) != keccak256(abi.encodePacked(player1Bet)),
        "player2's bet must be different from player1's bet");

        player2 = _player2;
        player2Bet = _player2Bet;

        FundGame();

        emit GameJoined();

        if (stash[player1] >= betAmount && stash[player2] >= betAmount && !gameActive) {
            startGame();
        }

        
    }
    /**
     * @dev 게임 시작 - 기간 설정 및 게임 초기화
     */
    function startGame() private {
        require(msg.sender == player1 || msg.sender == player2, "Only players can start the game");
        require(!gameActive, "Game already active");
        require(stash[player1] >= betAmount, "Player1 needs to fund the game first");
        require(stash[player2] >= betAmount, "Player2 needs to fund the game first");
        
        // 게임 기간 설정 (현재 시간 + 일수 * 하루 초)
        gameDeadline = block.timestamp + (gameDeadline * 1 days);
        
        // 베팅 금액을 플레이어 계정에서 차감
        stash[player1] -= betAmount;
        stash[player2] -= betAmount;
        
        // 게임 상태 활성화
        gameActive = true;
        gameValid = false;
        
        // 커미티 카운트 초기화
        committeeCount = 0;
        
        emit GameStarted(gameDeadline, betAmount * 2);
    }

    /**
     * @dev 위원회 멤버 추가
     * @param newMember 추가할 위원회 멤버 주소
     */
    function addCommittee(address newMember) public {
        require(gameActive, "Game not active");
        require(block.timestamp < gameDeadline, "Game period has ended");
        require(!committeeList[newMember], "Member already in committee");
        require(newMember != address(0), "Cannot add zero address");
        require(newMember != player1 && newMember != player2, "Players cannot be committee members");
        
        committeeCount += 1;
        committeeList[newMember] = true;
        
        emit CommitteeAdded(newMember);
        
        // 최소 커미티 수 도달 시 게임 유효 상태로 변경
        if (committeeCount >= minimumCommittee && !gameValid) {
            gameValid = true;
            emit MinimumCommitteeMet(committeeCount);
        }
    }

    // commitee 희망자가 다 맞추면 프론트에 log 보내기
    function submitAnswerHashes(uint256[] memory quizIds, bytes32[] memory providedHashes) public {
        require(quizIds.length == providedHashes.length, "Mismatched input arrays");

        for (uint256 i = 0; i < quizIds.length; i++) {
            uint256 quizId = quizIds[i];
            require(!quizzes[quizId].solved, "Quiz already solved");

            if (quizzes[quizId].answerHash == providedHashes[i]) {
                    quizzes[quizId].solved = true;
                    solvedCount[msg.sender] += 1;
            }

            if(solvedCount[msg.sender] == quizCount){
                emit AllQuizzesSolved(msg.sender);
            }

        }
}

    /**
     * @dev 게임이 투표 단계인지 확인
     */
    function isVotingPhase() public view returns (bool) {
        return gameActive && gameValid && block.timestamp >= gameDeadline;
    }

    /**
     * @dev 게임 상태 확인 - 기간 종료 시 자동 처리
     * 누구나 호출 가능하며, 게임 배팅 기간이 끝났다면 상태 업데이트 처리
     */
    function checkGameStatus() public returns (string memory) {
        // 이미 비활성화된 게임은 체크하지 않음
        if (!gameActive) {
            return "Game not active";
        }
        
        // 아직 배팅 기간이 끝나지 않음
        if (block.timestamp < gameDeadline) {
            return gameValid 
                ? "Game active: minimum committee met"
                : "Game active: waiting for committee members";
        }
        
        // 여기서부터는 배팅 기간이 끝난 경우
        
        // 최소 커미티 멤버 수 불충족 시 게임 취소
        if (committeeCount < minimumCommittee) {
            _cancelGame("Insufficient committee members");
            return "Game cancelled: insufficient committee members";
        }
        
        // 최소 커미티 충족 - 결과 처리 단계
        return "Game period ended, ready for result processing";
    }

    /**
     * @dev 게임 취소 내부 함수
     * @param reason 취소 사유
     */
    function _cancelGame(string memory reason) internal {
        // 베팅 금액을 플레이어 계정으로 환불
        stash[player1] += betAmount;
        stash[player2] += betAmount;
        
        // 게임 상태 재설정
        gameValid = false;
        gameActive = false;
        
        emit GameCancelled(reason);
    }

    /**
     * @dev 게임 수동 취소
     * 투표 수가 충족되지 않은 경우에만 취소 가능
     */
    function cancelGame() public {
        require(msg.sender == player1 || msg.sender == player2, "Only players can cancel the game");
        require(gameActive, "Game not active");
        
        // 배팅 기간이 끝났는지 자동 확인
        if (block.timestamp >= gameDeadline) {
            checkGameStatus();
            return;
        }
        
        _cancelGame("Cancelled by player");
    }
    
    /**
     * @dev 게임 현재 상태 조회
     */
    function getGameStatus() public view returns (
        bool isActive,
        bool isValid,
        bool inVotingPhase,
        uint256 deadline,
        uint256 currentCommitteeCount,
        uint256 requiredCommitteeCount,
        uint256 timeRemaining
    ) {
        isActive = gameActive;
        isValid = gameValid;
        inVotingPhase = isVotingPhase();
        deadline = gameDeadline;
        currentCommitteeCount = committeeCount;
        requiredCommitteeCount = minimumCommittee;
        
        if (block.timestamp < gameDeadline) {
            timeRemaining = gameDeadline - block.timestamp;
        } else {
            timeRemaining = 0;
        }
    }
    
    /**
     * @dev 사용자가 자신의 자금을 인출
     * @param amount 인출할 금액
     */
    function withdraw(uint256 amount) public {
        require(stash[msg.sender] >= amount, "Insufficient funds");
        stash[msg.sender] -= amount;
        payable(msg.sender).transfer(amount);
    }
    
    /**
     * @dev 게임 플레이어 정보 조회
     */
    function getPlayers() external view returns (address, address) {
        return (player1, player2);
    }
    
    // TODO: 게임 결과 처리 및 보상 분배 기능
    // function processGameResult() public { ... }
}
