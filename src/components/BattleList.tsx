import { useBattleLogic } from '../hooks/useBattleLogic';

export default function BattleList() {
  const { hotBattles, handleViewBattleDetails, handleJoinCommittee } = useBattleLogic();
  
  return (
    <div className="battle-list">
      <h2>진행 중인 배틀</h2>
      
      {hotBattles.length === 0 ? (
        <p>현재 진행 중인 배틀이 없습니다.</p>
      ) : (
        <ul>
          {hotBattles.map((battle) => (
            <li key={battle.id}>
              <div>{battle.title}</div>
              <div>
                <button onClick={() => handleViewBattleDetails(battle)}>
                  상세 보기
                </button>
                <button onClick={() => handleJoinCommittee(battle)}>
                  커미티 참여
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}