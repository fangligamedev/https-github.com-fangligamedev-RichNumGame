import React, { useState } from 'react';
import { MathQuestion } from '../types';
import { CheckCircle2, XCircle, Calculator, Brain } from 'lucide-react';

interface MathChallengeProps {
  question: MathQuestion | null;
  onAnswer: (isCorrect: boolean) => void;
  isLoading: boolean;
}

const MathChallenge: React.FC<MathChallengeProps> = ({ question, onAnswer, isLoading }) => {
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);

  if (isLoading || !question) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-white p-8 rounded-2xl shadow-2xl flex flex-col items-center animate-pulse">
          <Brain className="w-16 h-16 text-blue-500 mb-4 animate-bounce" />
          <h2 className="text-2xl font-bold text-gray-700">正在生成题目...</h2>
          <p className="text-gray-500">老师机器人正在思考适合你的问题</p>
        </div>
      </div>
    );
  }

  const handleSelect = (option: number) => {
    if (showResult) return;
    
    setSelectedOption(option);
    const correct = option === question.answer;
    setIsCorrect(correct);
    setShowResult(true);

    // Delay closing to show feedback
    setTimeout(() => {
      onAnswer(correct);
      // Reset internal state
      setShowResult(false);
      setSelectedOption(null);
    }, 2500);
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 px-4">
      <div className="bg-white max-w-lg w-full rounded-3xl shadow-2xl overflow-hidden border-4 border-blue-400 transform transition-all scale-100">
        {/* Header */}
        <div className="bg-blue-400 p-4 flex items-center justify-center">
          <Calculator className="text-white w-8 h-8 mr-2" />
          <h2 className="text-2xl font-bold text-white">数学大挑战</h2>
        </div>

        {/* Content */}
        <div className="p-8 text-center">
          <p className="text-2xl font-medium text-gray-800 mb-8 leading-relaxed">
            {question.question}
          </p>

          <div className="grid grid-cols-2 gap-4">
            {question.options.map((option, idx) => {
              let btnClass = "py-4 text-xl font-bold rounded-xl border-2 transition-all duration-200 shadow-md active:scale-95";
              
              if (showResult) {
                if (option === question.answer) {
                  btnClass += " bg-green-500 text-white border-green-600 shadow-green-200 scale-105";
                } else if (option === selectedOption) {
                  btnClass += " bg-red-500 text-white border-red-600 shadow-red-200";
                } else {
                  btnClass += " bg-gray-100 text-gray-400 border-gray-200 opacity-50";
                }
              } else {
                btnClass += " bg-white text-blue-600 border-blue-200 hover:bg-blue-50 hover:border-blue-400";
              }

              return (
                <button
                  key={idx}
                  onClick={() => handleSelect(option)}
                  disabled={showResult}
                  className={btnClass}
                >
                  {option}
                </button>
              );
            })}
          </div>

          {/* Feedback Area */}
          {showResult && (
            <div className={`mt-6 p-4 rounded-xl flex items-center justify-center ${isCorrect ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
              {isCorrect ? (
                <>
                  <CheckCircle2 className="w-8 h-8 mr-2" />
                  <div>
                    <p className="font-bold text-lg">太棒了！答对了！</p>
                  </div>
                </>
              ) : (
                <>
                  <XCircle className="w-8 h-8 mr-2" />
                  <div className="text-left">
                    <p className="font-bold text-lg">哎呀，再接再厉！</p>
                    <p className="text-sm">{question.explanation}</p>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MathChallenge;
