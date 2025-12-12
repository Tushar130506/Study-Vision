import React, { useState } from 'react';
import { Flashcard } from '../types';
import { ChevronLeft, ChevronRight, RotateCw } from 'lucide-react';
import { motion } from 'framer-motion';

interface FlashcardDeckProps {
  cards: Flashcard[];
}

export const FlashcardDeck: React.FC<FlashcardDeckProps> = ({ cards }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);

  const handleNext = () => {
    setIsFlipped(false);
    setTimeout(() => {
      setCurrentIndex((prev) => (prev + 1) % cards.length);
    }, 200);
  };

  const handlePrev = () => {
    setIsFlipped(false);
    setTimeout(() => {
      setCurrentIndex((prev) => (prev - 1 + cards.length) % cards.length);
    }, 200);
  };

  const currentCard = cards[currentIndex];

  return (
    <div className="flex flex-col items-center w-full max-w-2xl mx-auto">
      <div className="w-full flex justify-between items-center mb-4 text-slate-500 dark:text-slate-400 text-sm font-medium">
        <span>Card {currentIndex + 1} of {cards.length}</span>
        <div className="flex gap-2">
            <kbd className="px-2 py-1 bg-slate-100 dark:bg-slate-800 rounded border border-slate-200 dark:border-slate-700 text-xs">Space to flip</kbd>
            <kbd className="px-2 py-1 bg-slate-100 dark:bg-slate-800 rounded border border-slate-200 dark:border-slate-700 text-xs">Arrows to nav</kbd>
        </div>
      </div>

      <div 
        className="relative w-full aspect-[3/2] cursor-pointer perspective-1000 group"
        onClick={() => setIsFlipped(!isFlipped)}
      >
        <motion.div
            className="w-full h-full relative transform-style-3d transition-transform duration-500 shadow-xl rounded-2xl"
            animate={{ rotateY: isFlipped ? 180 : 0 }}
            transition={{ duration: 0.6, type: "spring" }}
        >
            {/* Front */}
            <div className="absolute w-full h-full backface-hidden bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-8 flex flex-col items-center justify-center text-center">
                <span className="text-xs font-bold tracking-widest text-indigo-500 dark:text-indigo-400 uppercase mb-4">Term</span>
                <h3 className="text-3xl font-bold text-slate-800 dark:text-slate-100">{currentCard.term}</h3>
                <div className="absolute bottom-6 text-slate-400 dark:text-slate-500 flex items-center gap-2 text-sm">
                    <RotateCw size={14} /> Click to flip
                </div>
            </div>

            {/* Back */}
            <div className="absolute w-full h-full backface-hidden bg-indigo-600 dark:bg-indigo-700 rounded-2xl border border-indigo-500 dark:border-indigo-600 p-8 flex flex-col items-center justify-center text-center rotate-y-180 text-white">
                <span className="text-xs font-bold tracking-widest text-indigo-200 uppercase mb-4">Definition</span>
                <p className="text-xl font-medium leading-relaxed">{currentCard.definition}</p>
            </div>
        </motion.div>
      </div>

      <div className="flex gap-4 mt-8">
        <motion.button 
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={(e) => { e.stopPropagation(); handlePrev(); }}
            className="p-3 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 hover:border-indigo-200 dark:hover:border-indigo-500 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all shadow-sm"
        >
            <ChevronLeft size={24} />
        </motion.button>
        <motion.button 
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={(e) => { e.stopPropagation(); handleNext(); }}
            className="p-3 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 hover:border-indigo-200 dark:hover:border-indigo-500 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all shadow-sm"
        >
            <ChevronRight size={24} />
        </motion.button>
      </div>
    </div>
  );
};