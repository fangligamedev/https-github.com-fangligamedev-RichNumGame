import React, { useState } from 'react';
import { MathQuestion } from '../types';
import { CheckCircle2, XCircle, Calculator, Brain, HelpCircle } from 'lucide-react';

interface MathChallengeProps {
  question: MathQuestion | null;
  onAnswer: (isCorrect: boolean, selectedOption?: number) => void;
  isLoading: boolean;
  playerId?: string;
}

const MathChallenge: React.FC<MathChallengeProps> = ({ question, onAnswer, isLoading, playerId }) => {
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);

  // Theme configuration based on player
  const getTheme = () => {
    if (playerId === 'P1') return {
      bg: 'bg-blue-50',
      border: 'ring-blue-300',
      headerBg: 'bg-blue-100',
      headerText: 'text-blue-700'
    };
    if (playerId === 'P2') return {
      bg: 'bg-emerald-50',
      border: 'ring-emerald-300',
      headerBg: 'bg-emerald-100',
      headerText: 'text-emerald-700'
    };
    return { // AI or Fallback
      bg: 'bg-purple-50',
      border: 'ring-purple-300',
      headerBg: 'bg-purple-100',
      headerText: 'text-purple-700'
    };
  };

  const theme = getTheme();

  if (isLoading || !question) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 backdrop-blur-sm">
        <div className="bg-white p-8 rounded-2xl shadow-2xl flex flex-col items-center animate-pulse border-4 border-blue-200">
          <Brain className={`w-16 h-16 ${theme.headerText} mb-4 animate-bounce`} />
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
      onAnswer(correct, option);
      // Reset internal state
      setShowResult(false);
      setSelectedOption(null);
    }, 2500);
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 px-4 backdrop-blur-sm">
      {/* Container: Landscape oriented (max-w-4xl), Flex Row on Desktop */}
      <div className={`bg-white max-w-4xl w-full rounded-3xl shadow-2xl overflow-hidden border-8 border-white ring-4 ${theme.border} transform transition-all scale-100 flex flex-col md:flex-row min-h-[450px]`}>
        
        {/* Left Side: Question Area (60% width) */}
        <div className={`md:w-3/5 ${theme.bg} p-8 flex flex-col relative`}>
            {/* Header Tag */}
            <div className={`absolute top-4 left-4 ${theme.headerBg} ${theme.headerText} px-3 py-1 rounded-full text-sm font-bold flex items-center shadow-sm`}>
                <Calculator className="w-4 h-4 mr-1" />
                {playerId === 'P1' ? '我的挑战' : playerId === 'P2' ? '朋友的挑战' : '机器人的挑战'}
            </div>

            <div className="flex-1 flex flex-col justify-center items-center text-center mt-6">
                <div className="mb-6 p-6 bg-white rounded-2xl shadow-sm border border-slate-100 w-full relative">
                    <div className="absolute -top-3 -left-3 text-4xl opacity-20">❝</div>
                    <p className="text-2xl md:text-3xl font-bold text-slate-800 leading-relaxed whitespace-pre-wrap font-sans">
                    {question.question}
                    </p>
                    <div className="absolute -bottom-3 -right-3 text-4xl opacity-20">❞</div>
                </div>
                
                <div className="flex items-center text-slate-400 text-sm font-medium animate-pulse">
                   <HelpCircle className="w-4 h-4 mr-1" />
                   请在右侧选择正确的答案
                </div>
            </div>
        </div>

        {/* Right Side: Options & Interaction Area (40% width) */}
        <div className="md:w-2/5 bg-white p-6 flex flex-col justify-center border-t md:border-t-0 md:border-l border-slate-100 relative z-10">
            <div className="grid grid-cols-1 gap-3 w-full">
                {question.options.map((option, idx) => {
                let btnClass = "py-4 px-6 text-xl md:text-2xl font-bold rounded-2xl border-2 transition-all duration-200 shadow-sm hover:shadow-md active:scale-95 flex items-center justify-between group";
                
                if (showResult) {
                    if (option === question.answer) {
                    btnClass += " bg-green-500 text-white border-green-600 shadow-green-200 scale-105 z-10";
                    } else if (option === selectedOption) {
                    btnClass += " bg-red-500 text-white border-red-600 shadow-red-200";
                    } else {
                    btnClass += " bg-gray-50 text-gray-300 border-gray-100 opacity-50";
                    }
                } else {
                    btnClass += " bg-white text-slate-700 border-slate-200 hover:border-blue-400 hover:text-blue-600 hover:bg-blue-50";
                }

                return (
                    <button
                    key={idx}
                    onClick={() => handleSelect(option)}
                    disabled={showResult}
                    className={btnClass}
                    >
                    <span className="opacity-50 text-base font-normal mr-2">{String.fromCharCode(65 + idx)}.</span> 
                    <span className="flex-1 text-center font-mono">{option}</span>
                    {showResult && option === question.answer && <CheckCircle2 className="w-6 h-6 ml-2" />}
                    {showResult && option === selectedOption && option !== question.answer && <XCircle className="w-6 h-6 ml-2" />}
                    </button>
                );
                })}
            </div>

            {/* Feedback Overlay - Covers the options when result is shown */}
            {showResult && (
                <div className={`absolute inset-0 bg-white/95 backdrop-blur-[2px] flex flex-col items-center justify-center p-6 text-center animate-fadeIn z-20 rounded-none md:rounded-r-3xl`}>
                    {isCorrect ? (
                        <>
                        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-4 animate-bounce">
                            <CheckCircle2 className="w-12 h-12 text-green-600" />
                        </div>
                        <h3 className="text-2xl font-bold text-green-700 mb-2">回答正确！</h3>
                        <p className="text-green-600 font-medium">太棒了，继续保持！</p>
                        </>
                    ) : (
                        <>
                        <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mb-4 animate-shake">
                            <XCircle className="w-12 h-12 text-red-600" />
                        </div>
                        <h3 className="text-2xl font-bold text-red-700 mb-2">回答错误</h3>
                        <div className="bg-red-50 p-4 rounded-xl border border-red-100 w-full text-left shadow-sm">
                             <p className="text-red-600 text-xs font-bold uppercase mb-1">正确解析</p>
                             <p className="text-red-900 font-medium text-lg leading-snug">{question.explanation}</p>
                        </div>
                        </>
                    )}
                </div>
            )}
        </div>

      </div>
      <style>{`
        .animate-shake {
            animation: shake 0.5s cubic-bezier(.36,.07,.19,.97) both;
        }
        @keyframes shake {
            10%, 90% { transform: translate3d(-1px, 0, 0); }
            20%, 80% { transform: translate3d(2px, 0, 0); }
            30%, 50%, 70% { transform: translate3d(-4px, 0, 0); }
            40%, 60% { transform: translate3d(4px, 0, 0); }
        }
        .animate-fadeIn {
            animation: fadeIn 0.3s ease-out forwards;
        }
        @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
        }
      `}</style>
    </div>
  );
};

export default MathChallenge;