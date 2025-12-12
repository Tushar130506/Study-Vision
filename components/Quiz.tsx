import React, { useState } from 'react';
import { MCQ } from '../types';
import { CheckCircle, XCircle, HelpCircle } from 'lucide-react';
import { motion } from 'framer-motion';

interface QuizProps {
  questions: MCQ[];
}

export const Quiz: React.FC<QuizProps> = ({ questions }) => {
  const [selections, setSelections] = useState<{ [key: number]: number | null }>({});
  const [showRationale, setShowRationale] = useState<{ [key: number]: boolean }>({});

  const handleSelect = (qIndex: number, optionIndex: number) => {
    if (selections[qIndex] !== undefined) return; // Prevent changing answer
    setSelections(prev => ({ ...prev, [qIndex]: optionIndex }));
    setShowRationale(prev => ({ ...prev, [qIndex]: true }));
  };

  return (
    <div className="space-y-8">
      {questions.map((q, qIndex) => {
        const selected = selections[qIndex];
        const isAnswered = selected !== undefined && selected !== null;
        
        return (
          <div key={qIndex} className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6 shadow-sm">
            <div className="flex items-start gap-4 mb-4">
                <span className="flex-shrink-0 w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold text-sm">
                    {qIndex + 1}
                </span>
                <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100 leading-snug pt-1">{q.question}</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 ml-12">
              {q.options.map((option, oIndex) => {
                let statusClass = "border-slate-200 dark:border-slate-700 hover:border-indigo-300 dark:hover:border-indigo-500 hover:bg-slate-50 dark:hover:bg-slate-700/50 text-slate-700 dark:text-slate-300";
                let icon = null;

                if (isAnswered) {
                    if (oIndex === q.correctOptionIndex) {
                        statusClass = "border-green-500 bg-green-50 dark:bg-green-900/30 text-green-800 dark:text-green-200";
                        icon = <CheckCircle size={18} className="text-green-600 dark:text-green-400" />;
                    } else if (selected === oIndex) {
                        statusClass = "border-red-500 bg-red-50 dark:bg-red-900/30 text-red-800 dark:text-red-200";
                        icon = <XCircle size={18} className="text-red-600 dark:text-red-400" />;
                    } else {
                        statusClass = "opacity-50 border-slate-100 dark:border-slate-800 text-slate-500 dark:text-slate-500";
                    }
                }

                return (
                  <motion.button
                    key={oIndex}
                    whileHover={!isAnswered ? { scale: 1.01 } : {}}
                    whileTap={!isAnswered ? { scale: 0.99 } : {}}
                    onClick={() => handleSelect(qIndex, oIndex)}
                    disabled={isAnswered}
                    className={`relative p-4 rounded-lg border text-left transition-colors flex justify-between items-center ${statusClass}`}
                  >
                    <span className="font-medium mr-2">{String.fromCharCode(65 + oIndex)}. {option}</span>
                    {icon}
                  </motion.button>
                );
              })}
            </div>

            {isAnswered && (
                <div className="ml-12 mt-4 p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg border border-indigo-100 dark:border-indigo-800 text-indigo-900 dark:text-indigo-200 text-sm flex gap-3 animate-in fade-in slide-in-from-top-2">
                    <HelpCircle size={20} className="flex-shrink-0 text-indigo-500 dark:text-indigo-400" />
                    <div>
                        <span className="font-bold block mb-1">Explanation:</span>
                        {q.rationale}
                    </div>
                </div>
            )}
          </div>
        );
      })}
    </div>
  );
};