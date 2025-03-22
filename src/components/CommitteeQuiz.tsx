import { useBattleLogic } from '../hooks/useBattleLogic';

export default function CommitteeQuiz() {
  const { 
    isCommitteeMode, 
    committeeQuizzes, 
    currentQuizIndex, 
    quizTimer, 
    selectedAnswer, 
    handleSelectAnswer,
    selectedBattleDetails
  } = useBattleLogic();
  
  if (!isCommitteeMode || committeeQuizzes.length === 0) {
    return null;
  }
  
  const currentQuiz = committeeQuizzes[currentQuizIndex];
  
  return (
    <div className="committee-quiz">
      <div className="quiz-header">
        <h3>Committee Quiz</h3>
        <p>Quiz {currentQuizIndex + 1} of {committeeQuizzes.length}</p>
        <div className="timer">{Math.ceil(quizTimer)}</div>
      </div>
      
      <div className="question">
        <p>{currentQuiz.question}</p>
        <p>This claim belongs to {currentQuiz.player === 'A' ? selectedBattleDetails?.optionA : selectedBattleDetails?.optionB}</p>
      </div>
      
      <div className="answers">
        <button 
          onClick={() => handleSelectAnswer('true')}
          className={selectedAnswer === 'true' ? 'selected' : ''}
        >
          O (True)
        </button>
        <button 
          onClick={() => handleSelectAnswer('false')}
          className={selectedAnswer === 'false' ? 'selected' : ''}
        >
          X (False)
        </button>
      </div>
    </div>
  );
}