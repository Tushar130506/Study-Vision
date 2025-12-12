import React, { useState } from 'react';
import { Session } from '../types';
import { Trash2, MessageSquare, Combine, Plus, X, CheckSquare, Square } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface SidebarProps {
  sessions: Session[];
  currentSessionId: string | null;
  onSelectSession: (session: Session) => void;
  onNewChat: () => void;
  onDeleteSession: (id: string) => void;
  onMergeSessions: (ids: string[]) => void;
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  sessions,
  currentSessionId,
  onSelectSession,
  onNewChat,
  onDeleteSession,
  onMergeSessions,
  isOpen,
  setIsOpen
}) => {
  const [isMergeMode, setIsMergeMode] = useState(false);
  const [selectedForMerge, setSelectedForMerge] = useState<Set<string>>(new Set());

  const toggleMergeSelection = (id: string) => {
    const newSet = new Set(selectedForMerge);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setSelectedForMerge(newSet);
  };

  const handleMergeClick = () => {
    if (selectedForMerge.size < 2) return;
    onMergeSessions(Array.from(selectedForMerge));
    setIsMergeMode(false);
    setSelectedForMerge(new Set());
    // Close sidebar on mobile after action
    if (window.innerWidth < 768) setIsOpen(false);
  };

  return (
    <>
      {/* Mobile Overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsOpen(false)}
            className="fixed inset-0 bg-black/50 z-40 md:hidden backdrop-blur-sm"
          />
        )}
      </AnimatePresence>

      {/* Sidebar Container */}
      <motion.div
        className={`fixed md:sticky top-0 left-0 h-screen bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 z-50 w-72 flex flex-col shadow-xl md:shadow-none transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <h2 className="font-bold text-lg text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <MessageSquare size={18} className="text-indigo-600 dark:text-indigo-400" />
            History
          </h2>
          <button 
             onClick={() => setIsOpen(false)}
             className="md:hidden p-1 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-4 gap-2 flex flex-col">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => {
                onNewChat();
                if (window.innerWidth < 768) setIsOpen(false);
            }}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors shadow-sm"
          >
            <Plus size={18} /> New Study Guide
          </motion.button>

          <button
            onClick={() => {
                setIsMergeMode(!isMergeMode);
                setSelectedForMerge(new Set());
            }}
            disabled={sessions.length < 2}
            className={`w-full flex items-center justify-center gap-2 py-2 px-4 rounded-lg font-medium transition-colors text-sm border 
                ${isMergeMode 
                    ? 'bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-slate-600 text-slate-800 dark:text-slate-200' 
                    : 'bg-white dark:bg-transparent border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                }
                ${sessions.length < 2 ? 'opacity-50 cursor-not-allowed' : ''}
            `}
          >
            <Combine size={16} /> {isMergeMode ? 'Cancel Merge' : 'Merge Chats'}
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-2">
            {sessions.length === 0 && (
                <div className="text-center text-slate-400 dark:text-slate-500 text-sm mt-8 px-4">
                    No saved chats yet. Upload notes to start.
                </div>
            )}

            <AnimatePresence>
            {sessions.map((session) => (
                <motion.div 
                    key={session.id}
                    layout
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    whileHover={{ x: 4 }}
                    onClick={() => {
                        if (isMergeMode) toggleMergeSelection(session.id);
                        else {
                            onSelectSession(session);
                            if (window.innerWidth < 768) setIsOpen(false);
                        }
                    }}
                    className={`
                        group flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-colors border
                        ${isMergeMode && selectedForMerge.has(session.id)
                             ? 'bg-indigo-50 dark:bg-indigo-900/20 border-indigo-200 dark:border-indigo-800'
                             : currentSessionId === session.id && !isMergeMode
                                ? 'bg-indigo-50 dark:bg-indigo-900/30 border-indigo-200 dark:border-indigo-800 shadow-sm' 
                                : 'bg-transparent border-transparent hover:bg-slate-50 dark:hover:bg-slate-800/50'
                        }
                    `}
                >
                    {isMergeMode ? (
                         <div className={`text-indigo-600 dark:text-indigo-400 ${selectedForMerge.has(session.id) ? 'opacity-100' : 'opacity-40'}`}>
                             {selectedForMerge.has(session.id) ? <CheckSquare size={20} /> : <Square size={20} />}
                         </div>
                    ) : (
                        <MessageSquare size={18} className="text-slate-400 dark:text-slate-500 shrink-0" />
                    )}
                    
                    <div className="flex-1 min-w-0">
                        <h3 className={`text-sm font-medium truncate ${currentSessionId === session.id ? 'text-indigo-900 dark:text-indigo-100' : 'text-slate-700 dark:text-slate-300'}`}>
                            {session.title}
                        </h3>
                        <p className="text-xs text-slate-400 dark:text-slate-500 truncate">
                            {new Date(session.createdAt).toLocaleDateString()}
                        </p>
                    </div>

                    {!isMergeMode && (
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                onDeleteSession(session.id);
                            }}
                            className="opacity-0 group-hover:opacity-100 p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-all"
                        >
                            <Trash2 size={14} />
                        </button>
                    )}
                </motion.div>
            ))}
            </AnimatePresence>
        </div>

        {isMergeMode && (
            <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
                <button
                    onClick={handleMergeClick}
                    disabled={selectedForMerge.size < 2}
                    className="w-full py-3 bg-indigo-600 disabled:bg-slate-300 dark:disabled:bg-slate-700 text-white rounded-lg font-bold shadow-lg shadow-indigo-200 dark:shadow-none transition-all"
                >
                    Merge ({selectedForMerge.size})
                </button>
            </div>
        )}
      </motion.div>
    </>
  );
};