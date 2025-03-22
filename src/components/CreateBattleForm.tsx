import { useState } from 'react';
import { useBattleLogic } from '../hooks/useBattleLogic';

export default function CreateBattleForm() {
  const [title, setTitle] = useState('');
  const [optionA, setOptionA] = useState('');
  const [optionB, setOptionB] = useState('');
  const [betAmount, setBetAmount] = useState('');
  const [quizCount, setQuizCount] = useState(3);
  
  const { handleCreateBattle } = useBattleLogic();
  
  const onSubmit = (e) => {
    e.preventDefault();
    handleCreateBattle({
      title,
      optionA,
      optionB,
      betAmount,
      quizCount
    });
  };
  
  return (
    <div className="battle-form">
      <h2>새 배틀 생성</h2>
      <form onSubmit={onSubmit}>
        {/* 입력 폼 필드들 */}
        <button type="submit">배틀 생성</button>
      </form>
    </div>
  );
}