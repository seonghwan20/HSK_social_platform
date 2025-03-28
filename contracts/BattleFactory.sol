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
    
    // 배틀 ID별 컨트랙트 주소 매핑
    mapping(uint256 => address) public battles;
    mapping(uint256 => address) public sideBettings;
    
    // 모든 배틀 ID 배열
    uint256[] public allBattleIds;
    
    // 이벤트 정의
    event BattleCreated(uint256 indexed battleId, address battleContract, address player1, address player2, uint256 betAmount);
    event SideBettingCreated(uint256 indexed battleId, address sideBettingContract, address battleContract);
    
    constructor() {
        owner = msg.sender;
    }
    
    /**
     * @dev 새로운 배틀 생성
     * @param battleId 배틀 식별자
     * @param player1 첫 번째 플레이어 주소
     * @param minimumCommittee 최소 필요 위원회 인원 수
     * @param betAmount 베팅 금액
     */
    function createBattle(
        uint256 battleId,
        address player1,
        uint256 minimumCommittee,
        uint256 betAmount
    ) external returns (address) {
        require(battles[battleId] == address(0), "Battle ID already exists");
        
        // 현재 컨트랙트를 player2로 임시 설정 (나중에 교체됨)
        address tempPlayer2 = address(this);
        
        // 새로운 Faucet 배틀 컨트랙트 배포
        Faucet newBattle = new Faucet(
            player1,
            tempPlayer2,
            betAmount,
            minimumCommittee
        );
        
        // 매핑 업데이트
        battles[battleId] = address(newBattle);
        allBattleIds.push(battleId);
        
        emit BattleCreated(battleId, address(newBattle), player1, tempPlayer2, betAmount);
        
        return address(newBattle);
    }
    
    /**
     * @dev 배틀 수락 및 SideBetting 컨트랙트 생성
     * @param battleId 배틀 식별자
     * @param player2 두 번째 플레이어 주소
     */
    function acceptBattle(
        uint256 battleId,
        address player2
    ) external returns (address) {
        address battleContract = battles[battleId];
        require(battleContract != address(0), "Battle does not exist");
        require(sideBettings[battleId] == address(0), "Battle already accepted");
        
        // Faucet 컨트랙트에서 player2 업데이트 (실제 구현에서는 여기에 로직 추가)
        // 이 예제에서는 player2 업데이트 로직을 생략합니다.
        
        // SideBetting 컨트랙트 배포
        SideBetting newSideBetting = new SideBetting(battleContract);
        
        // 매핑 업데이트
        sideBettings[battleId] = address(newSideBetting);
        
        emit SideBettingCreated(battleId, address(newSideBetting), battleContract);
        
        return address(newSideBetting);
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
}