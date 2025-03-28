// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./Faucet.sol";
import "./SideBetting.sol";

/**
 * @title BattleFactory
 * @dev 배틀 게임을 위한 컨트랙트 팩토리
 * 새로운 배틀이 생성될 때마다 Faucet 컨트랙트를 배포하고,
 * 상대방이 챌린지를 수락할 때 SideBetting 컨트랙트를 배포합니다.
 */
contract BattleFactory {
    address public owner;
    uint256 public battleId;

    
    // 배틀 ID별 컨트랙트 주소 매핑
    mapping(uint256 => address) public battles;
    mapping(uint256 => address) public sideBettings;

    // 모든 배틀 ID 배열
    uint256[] public allBattleIds;
    
    // 이벤트 정의
    event BattleCreated(uint256 indexed battleId, address battleContract, address player1, uint256 betAmount);
    event SideBettingCreated(uint256 indexed battleId, address sideBettingContract, address battleContract);
    
    constructor() {
        owner = msg.sender;
    }

    struct BattleMeta {
    uint256 battleId;
    address battleContract;
    address player1;
    string player1Bet;
    address player2;
    string player2Bet;
    uint256 betAmount;
    uint256 minimumCommittee;
    uint8 durationInDays;
    string title;
    bool isAccepted;
    address sideBettingContract;

    }

    mapping(uint256 => BattleMeta) public battleMetas;

    
    /**
     * @dev 새로운 배틀 생성
     * @param player1 첫 번째 플레이어 주소
     * @param minimumCommittee 최소 필요 위원회 인원 수
     * @param betAmount 베팅 금액
     */
    function createBattle(
        address player1,
        uint256 minimumCommittee,
        uint256 betAmount,
        string memory player1Bet,
        uint8 durationInDays,
        string memory title



    ) external returns (address) {

        battleId = battleId + 1;

        require(battles[battleId] == address(0), "Battle ID already exists");
        
        
        // 새로운 Faucet 배틀 컨트랙트 배포
        Faucet newBattle = new Faucet(
            player1,
            betAmount,
            minimumCommittee,
            player1Bet,
            durationInDays,
            title
        );
        
        // 매핑 업데이트
        battles[battleId] = address(newBattle);
        allBattleIds.push(battleId);
        
        emit BattleCreated(battleId, address(newBattle), player1, betAmount);
        
        battleMetas[battleId] = BattleMeta({
        battleId: battleId,
        battleContract: address(newBattle),
        player1: player1,
        player1Bet: player1Bet,
        player2: address(0),
        player2Bet: "",
        betAmount: betAmount,
        minimumCommittee: minimumCommittee,
        durationInDays: durationInDays,
        title: title,
        isAccepted: false,
        sideBettingContract: address(0)
        });

        return address(newBattle);
    }
    
    /**
     * @dev 배틀 수락 및 SideBetting 컨트랙트 생성
     * @param battleId 배틀 식별자
     */
    function acceptBattle(
        uint256 battleId,
        string memory player2Bet
    ) external returns (address) {

        address battleContract = battles[battleId];
        require(battleContract != address(0), "Battle does not exist");
        require(sideBettings[battleId] == address(0), "Battle already accepted");
        
        
        // 🧠 Faucet에 player2 등록 + 베팅 처리
        Faucet(battleContract).joinGame(player2Bet,msg.sender);
        // SideBetting 컨트랙트 배포
        SideBetting newSideBetting = new SideBetting(battleContract);
        
        sideBettings[battleId] = address(newSideBetting);

        battleMetas[battleId].player2 = msg.sender;
        battleMetas[battleId].player2Bet = player2Bet;
        battleMetas[battleId].isAccepted = true;
        battleMetas[battleId].sideBettingContract = address(newSideBetting);

        emit SideBettingCreated(battleId, address(newSideBetting), battleContract);

        return address(newSideBetting);
    }


    function getAllBattleMetas() external view returns (BattleMeta[] memory) {
        uint256 length = allBattleIds.length;
        BattleMeta[] memory metas = new BattleMeta[](length);

        for (uint256 i = 0; i < length; i++) {
            uint256 id = allBattleIds[i];
            metas[i] = battleMetas[id];
    }

    return metas;
    }
    
    /**
     * @dev 특정 배틀 ID에 대한 컨트랙트 주소 조회
     * @param battleId 배틀 식별자
     */
    function getBattleContracts(uint256 battleId) external view returns (address battleContract, address sideBettingContract) {
        return (battles[battleId], sideBettings[battleId]);
    }
    
    /**
     * @dev 모든 배틀 ID 조회
     */
    function getAllBattleIds() external view returns (uint256[] memory) {
        return allBattleIds;
    }
    
    /**
     * @dev 배틀 컨트랙트 배포 상태 확인
     * @param battleId 배틀 식별자
     */
    function isBattleAccepted(uint256 battleId) external view returns (bool) {
        return sideBettings[battleId] != address(0);
    }

    
    /**
     * @dev 소유권 이전
     * @param newOwner 새 소유자 주소
     */
    function transferOwnership(address newOwner) external {
        require(msg.sender == owner, "Only owner can transfer ownership");
        require(newOwner != address(0), "New owner cannot be zero address");
        owner = newOwner;
    }


    function getWaitingBattles() external view returns (BattleMeta[] memory) {
    uint256 count = 0;

    // 먼저 몇 개인지 세기
    for (uint256 i = 0; i < allBattleIds.length; i++) {
        if (!battleMetas[allBattleIds[i]].isAccepted) {
            count++;
        }
    }

    // 메모리 배열 만들고 채우기
    BattleMeta[] memory waiting = new BattleMeta[](count);
    uint256 index = 0;

    for (uint256 i = 0; i < allBattleIds.length; i++) {
        uint256 id = allBattleIds[i];
        if (!battleMetas[id].isAccepted) {
            waiting[index] = battleMetas[id];
            index++;
        }
    }

    return waiting;
    }

    function getActiveBattles() external view returns (BattleMeta[] memory) {
    uint256 count = 0;

    for (uint256 i = 0; i < allBattleIds.length; i++) {
        if (battleMetas[allBattleIds[i]].isAccepted) {
            count++;
        }
    }

    BattleMeta[] memory active = new BattleMeta[](count);
    uint256 index = 0;

    for (uint256 i = 0; i < allBattleIds.length; i++) {
        uint256 id = allBattleIds[i];
        if (battleMetas[id].isAccepted) {
            active[index] = battleMetas[id];
            index++;
        }
    }

    return active;
    }

    function getBattleMetaById(uint256 battleId) external view returns (BattleMeta memory) {
    require(battles[battleId] != address(0), "Battle does not exist");
    return battleMetas[battleId];
}


}