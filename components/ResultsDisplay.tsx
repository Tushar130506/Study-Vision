import React, { useState } from 'react';
import { StudyGuide } from '../types';
import { FlashcardDeck } from './FlashcardDeck';
import { Quiz } from './Quiz';
import { BookOpen, Brain, ListChecks, Calendar, FileText, ChevronDown, ChevronUp, Zap, Check, X, Eye } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface ResultsDisplayProps {
  data: StudyGuide;
  onReset: () => void;
}

type Tab = 'summary' | 'mcq' | 'flashcards' | 'practice' | 'drills' | 'plan';

export const ResultsDisplay: React.FC<ResultsDisplayProps> = ({ data, onReset }) => {
  const [activeTab, setActiveTab] = useState<Tab>('summary');
  const [practiceOpen, setPracticeOpen] = useState<{ [key: number]: boolean }>({});
  
  // State for Drills
  const [revealedBlanks, setRevealedBlanks] = useState<{ [key: number]: boolean }>({});
  const [tfSelections, setTfSelections] = useState<{ [key: number]: boolean | null }>({});

  const togglePractice = (index: number) => {
    setPracticeOpen(prev => ({ ...prev, [index]: !prev[index] }));
  };

  const toggleBlankReveal = (index: number) => {
    setRevealedBlanks(prev => ({ ...prev, [index]: !prev[index] }));
  };

  const handleTfSelect = (index: number, selection: boolean) => {
    if (tfSelections[index] !== undefined) return;
    setTfSelections(prev => ({ ...prev, [index]: selection }));
  };

  const tabs = [
    { id: 'summary', label: 'Summary', icon: FileText },
    { id: 'mcq', label: 'Quiz', icon: ListChecks },
    { id: 'flashcards', label: 'Flashcards', icon: Brain },
    { id: 'practice', label: 'Practice', icon: BookOpen },
    { id: 'drills', label: 'Drills', icon: Zap },
    { id: 'plan', label: 'Plan', icon: Calendar },
  ] as const;

  const containerVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
    exit: { opacity: 0, y: -10, transition: { duration: 0.2 } }
  };

  return (
    <div className="animate-in fade-in duration-500">
      {/* Tab Navigation */}
      <div className="sticky top-16 z-20 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 mb-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
            <div className="flex space-x-1 overflow-x-auto no-scrollbar py-3">
                {tabs.map((tab) => {
                    const Icon = tab.icon;
                    const isActive = activeTab === tab.id;
                    return (
                        <motion.button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            className={`relative flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-colors whitespace-nowrap z-10
                                ${isActive 
                                    ? 'text-white' 
                                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                                }`}
                        >
                            {isActive && (
                                <motion.div
                                    layoutId="activeTab"
                                    className="absolute inset-0 bg-indigo-600 rounded-full shadow-md shadow-indigo-200 dark:shadow-none -z-10"
                                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                                />
                            )}
                            <Icon size={16} />
                            <span>{tab.label}</span>
                        </motion.button>
                    )
                })}
            </div>
        </div>
      </div>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
        
        <AnimatePresence mode="wait">
            {activeTab === 'summary' && (
                <motion.div 
                    key="summary"
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-8"
                >
                    <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mb-6 flex items-center gap-3">
                        <FileText className="text-indigo-600 dark:text-indigo-400" />
                        Key Concepts Summary
                    </h2>
                    <div className="prose prose-slate dark:prose-invert max-w-none prose-lg leading-relaxed">
                        {data.summary.split('\n').map((line, i) => (
                            <p key={i} className="mb-4">{line}</p>
                        ))}
                    </div>
                </motion.div>
            )}

            {/* MCQs Tab */}
            {activeTab === 'mcq' && (
                 <motion.div key="mcq" variants={containerVariants} initial="hidden" animate="visible" exit="exit">
                    <div className="mb-6">
                        <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Knowledge Check</h2>
                        <p className="text-slate-500 dark:text-slate-400">Test your understanding with these multiple choice questions.</p>
                    </div>
                    <Quiz questions={data.mcqs} />
                 </motion.div>
            )}

            {/* Flashcards Tab */}
            {activeTab === 'flashcards' && (
                <motion.div key="flashcards" variants={containerVariants} initial="hidden" animate="visible" exit="exit" className="flex flex-col items-center justify-center min-h-[50vh]">
                    <div className="mb-8 text-center">
                        <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Flashcards</h2>
                        <p className="text-slate-500 dark:text-slate-400">Master terminology and key definitions.</p>
                    </div>
                    <FlashcardDeck cards={data.flashcards} />
                </motion.div>
            )}

            {/* Practice Questions Tab */}
            {activeTab === 'practice' && (
                <motion.div key="practice" variants={containerVariants} initial="hidden" animate="visible" exit="exit" className="space-y-6">
                     <div className="mb-6">
                        <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Practice Problems</h2>
                        <p className="text-slate-500 dark:text-slate-400">Apply what you've learned. Try to answer before looking at the model solution.</p>
                    </div>
                    {data.practiceQuestions.map((pq, idx) => {
                        const isOpen = practiceOpen[idx];
                        let difficultyColor = 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300';
                        if (pq.difficulty === 'Easy') difficultyColor = 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300';
                        if (pq.difficulty === 'Medium') difficultyColor = 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300';
                        if (pq.difficulty === 'Hard') difficultyColor = 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300';

                        return (
                            <motion.div 
                                key={idx} 
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: idx * 0.1 }}
                                className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden"
                            >
                                <div 
                                    className="p-6 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors flex items-start justify-between gap-4"
                                    onClick={() => togglePractice(idx)}
                                >
                                    <div className="space-y-2 w-full">
                                        <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold ${difficultyColor} mb-1`}>
                                            {pq.difficulty}
                                        </span>
                                        <h3 className="text-lg font-medium text-slate-900 dark:text-slate-100">{pq.question}</h3>
                                    </div>
                                    <div className="mt-1 text-slate-400 dark:text-slate-500">
                                        {isOpen ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                                    </div>
                                </div>
                                
                                {isOpen && (
                                    <div className="px-6 pb-6 pt-2 bg-slate-50/50 dark:bg-slate-900/30 border-t border-slate-100 dark:border-slate-700">
                                        <div className="prose prose-sm dark:prose-invert max-w-none">
                                            <p className="font-semibold text-slate-700 dark:text-slate-300 text-sm uppercase tracking-wide mb-2">Model Answer</p>
                                            <p className="text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-800 p-4 rounded-lg border border-slate-200 dark:border-slate-700">
                                                {pq.modelAnswer}
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </motion.div>
                        );
                    })}
                </motion.div>
            )}

            {/* Drills Tab */}
            {activeTab === 'drills' && (
                 <motion.div key="drills" variants={containerVariants} initial="hidden" animate="visible" exit="exit" className="space-y-12">
                    
                    {/* Fill in the blanks */}
                    <div>
                        <div className="mb-6">
                            <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Fill in the Blanks</h2>
                            <p className="text-slate-500 dark:text-slate-400">Test your recall by filling in the missing terms.</p>
                        </div>
                        <div className="space-y-4">
                            {data.fillInTheBlanks.map((item, idx) => (
                                <motion.div 
                                    key={idx} 
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: idx * 0.1 }}
                                    className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm"
                                >
                                    <p className="text-lg text-slate-800 dark:text-slate-100 font-medium mb-4 leading-relaxed">
                                        {item.sentence}
                                    </p>
                                    <div className="flex items-center gap-4">
                                        <motion.button
                                            whileHover={{ scale: 1.05 }}
                                            whileTap={{ scale: 0.95 }}
                                            onClick={() => toggleBlankReveal(idx)}
                                            className="text-sm px-4 py-2 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 rounded-lg hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-colors font-medium flex items-center gap-2"
                                        >
                                            {revealedBlanks[idx] ? <Eye size={16}/> : <Eye size={16} />}
                                            {revealedBlanks[idx] ? "Hide Answer" : "Reveal Answer"}
                                        </motion.button>
                                        {revealedBlanks[idx] && (
                                            <span className="text-green-700 dark:text-green-300 font-bold px-3 py-1 bg-green-50 dark:bg-green-900/30 rounded-md border border-green-100 dark:border-green-800 animate-in fade-in slide-in-from-left-2">
                                                {item.answer}
                                            </span>
                                        )}
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </div>

                    {/* True / False */}
                    <div>
                        <div className="mb-6">
                            <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">True or False</h2>
                            <p className="text-slate-500 dark:text-slate-400">Evaluate the accuracy of these statements.</p>
                        </div>
                        <div className="space-y-4">
                            {data.trueFalseQuestions.map((item, idx) => {
                                const isAnswered = tfSelections[idx] !== undefined && tfSelections[idx] !== null;
                                const isCorrect = isAnswered && tfSelections[idx] === item.isTrue;
                                
                                return (
                                    <motion.div 
                                        key={idx} 
                                        initial={{ opacity: 0, x: 10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: idx * 0.1 }}
                                        className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm"
                                    >
                                        <h3 className="text-lg text-slate-800 dark:text-slate-100 font-medium mb-6">{item.statement}</h3>
                                        
                                        <div className="flex flex-wrap gap-4 mb-4">
                                            <motion.button
                                                disabled={isAnswered}
                                                whileHover={!isAnswered ? { scale: 1.02 } : {}}
                                                whileTap={!isAnswered ? { scale: 0.98 } : {}}
                                                onClick={() => handleTfSelect(idx, true)}
                                                className={`flex-1 py-3 px-6 rounded-lg font-bold border transition-all flex justify-center items-center gap-2
                                                    ${isAnswered 
                                                        ? item.isTrue 
                                                            ? "bg-green-100 dark:bg-green-900/30 border-green-300 dark:border-green-800 text-green-800 dark:text-green-200"
                                                            : "bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-400 dark:text-slate-600 opacity-50"
                                                        : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-indigo-300 dark:hover:border-indigo-500 hover:text-indigo-600 dark:hover:text-indigo-400"
                                                    }
                                                    ${isAnswered && tfSelections[idx] === true && !isCorrect ? "bg-red-100 dark:bg-red-900/30 border-red-300 dark:border-red-800 text-red-800 dark:text-red-200 opacity-100" : ""}
                                                `}
                                            >
                                                {isAnswered && item.isTrue && <Check size={18} />}
                                                {isAnswered && tfSelections[idx] === true && !isCorrect && <X size={18} />}
                                                True
                                            </motion.button>
                                            <motion.button
                                                disabled={isAnswered}
                                                whileHover={!isAnswered ? { scale: 1.02 } : {}}
                                                whileTap={!isAnswered ? { scale: 0.98 } : {}}
                                                onClick={() => handleTfSelect(idx, false)}
                                                className={`flex-1 py-3 px-6 rounded-lg font-bold border transition-all flex justify-center items-center gap-2
                                                    ${isAnswered 
                                                        ? !item.isTrue 
                                                            ? "bg-green-100 dark:bg-green-900/30 border-green-300 dark:border-green-800 text-green-800 dark:text-green-200" 
                                                            : "bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-400 dark:text-slate-600 opacity-50"
                                                        : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-indigo-300 dark:hover:border-indigo-500 hover:text-indigo-600 dark:hover:text-indigo-400"
                                                    }
                                                    ${isAnswered && tfSelections[idx] === false && !isCorrect ? "bg-red-100 dark:bg-red-900/30 border-red-300 dark:border-red-800 text-red-800 dark:text-red-200 opacity-100" : ""}
                                                `}
                                            >
                                                {isAnswered && !item.isTrue && <Check size={18} />}
                                                {isAnswered && tfSelections[idx] === false && !isCorrect && <X size={18} />}
                                                False
                                            </motion.button>
                                        </div>

                                        {isAnswered && (
                                            <div className={`mt-4 p-4 rounded-lg text-sm ${isCorrect ? 'bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-200 border border-green-100 dark:border-green-800' : 'bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-200 border border-red-100 dark:border-red-800'} animate-in fade-in slide-in-from-top-1`}>
                                                <span className="font-bold block mb-1">
                                                    {isCorrect ? "Correct!" : "Incorrect."}
                                                </span>
                                                {item.rationale}
                                            </div>
                                        )}
                                    </motion.div>
                                )
                            })}
                        </div>
                    </div>

                 </motion.div>
            )}

            {/* Study Plan Tab */}
            {activeTab === 'plan' && (
                <motion.div key="plan" variants={containerVariants} initial="hidden" animate="visible" exit="exit">
                    <div className="mb-8">
                        <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">3-Day Spaced Repetition Plan</h2>
                        <p className="text-slate-500 dark:text-slate-400">A structured roadmap designed to maximize retention.</p>
                    </div>
                    
                    <div className="relative border-l-2 border-indigo-100 dark:border-indigo-900 ml-4 space-y-12">
                        {data.studyPlan.map((day, idx) => (
                            <div key={idx} className="relative pl-8">
                                <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-indigo-600 border-4 border-white dark:border-slate-900 shadow-sm"></div>
                                <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-4">Day {day.day}</h3>
                                
                                <div className="grid gap-4">
                                    {day.tasks.map((task, tIdx) => (
                                        <motion.div 
                                            key={tIdx} 
                                            initial={{ opacity: 0, x: 20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: (idx * 0.2) + (tIdx * 0.1) }}
                                            whileHover={{ x: 5 }}
                                            className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm p-5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col sm:flex-row gap-4 sm:items-center"
                                        >
                                            <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-semibold text-sm whitespace-nowrap bg-indigo-50 dark:bg-indigo-900/30 px-3 py-1.5 rounded-lg w-fit h-fit">
                                                <Calendar size={14} />
                                                {task.timeEstimate}
                                            </div>
                                            <p className="text-slate-600 dark:text-slate-300 font-medium">{task.description}</p>
                                        </motion.div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </motion.div>
            )}

        </AnimatePresence>
      </main>
    </div>
  );
};