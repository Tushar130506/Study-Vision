import React, { useState, useRef, useEffect } from 'react';
import { Bot, Send, X, MessageSquare, Loader2, Sparkles, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChatMessage } from '../types';
import { sendChatMessageStream } from '../services/geminiService';

interface ChatBuddyProps {
  context: string;
}

export const ChatBuddy: React.FC<ChatBuddyProps> = ({ context }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: 'model', text: "Hi! I'm Buddy. I can help you study your notes or answer general questions. What's on your mind?" }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isOpen]);

  useEffect(() => {
      if (isOpen && inputRef.current) {
          setTimeout(() => inputRef.current?.focus(), 300);
      }
  }, [isOpen]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMsg: ChatMessage = { role: 'user', text: input };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
        // Convert local messages to Gemini history format (excluding the new user message)
        const history = messages.map(m => ({
            role: m.role,
            parts: [{ text: m.text }]
        }));

        // Add placeholder for model response
        setMessages(prev => [...prev, { role: 'model', text: '' }]);
        
        const stream = sendChatMessageStream(history, userMsg.text, context);
        
        let fullResponse = "";
        for await (const chunk of stream) {
             fullResponse += chunk;
             setMessages(prev => {
                const newArr = [...prev];
                // Update the last message (which is the model placeholder)
                newArr[newArr.length - 1] = { role: 'model', text: fullResponse };
                return newArr;
             });
        }

    } catch (error) {
        console.error("Chat error", error);
        setMessages(prev => {
             // If error occurs, remove the empty/partial model message if it exists or append error
             const newArr = [...prev];
             if (newArr[newArr.length - 1].role === 'model' && newArr[newArr.length - 1].text === '') {
                 newArr[newArr.length - 1] = { role: 'model', text: "Sorry, I encountered an error. Please try again." };
             } else {
                 newArr.push({ role: 'model', text: "Sorry, I encountered an error. Please try again." });
             }
             return newArr;
        });
    } finally {
        setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Simple formatter for bold text (**text**)
  const formatText = (text: string) => {
      const parts = text.split(/(\*\*.*?\*\*)/g);
      return parts.map((part, i) => {
          if (part.startsWith('**') && part.endsWith('**')) {
              return <strong key={i} className="font-bold text-indigo-700 dark:text-indigo-300">{part.slice(2, -2)}</strong>;
          }
          return part;
      });
  };

  return (
    <>
      {/* Floating Action Button */}
      <motion.button
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => setIsOpen(!isOpen)}
        className={`fixed bottom-6 right-6 z-50 p-4 rounded-full shadow-2xl transition-all duration-300 flex items-center justify-center
            ${isOpen 
                ? 'bg-slate-800 text-slate-400 rotate-90' 
                : 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white'
            }
        `}
      >
        {isOpen ? <X size={24} /> : <Bot size={28} />}
      </motion.button>

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="fixed bottom-24 right-6 w-[90vw] md:w-96 h-[600px] max-h-[80vh] bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border border-slate-200 dark:border-slate-700 rounded-3xl shadow-2xl z-40 flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="p-4 border-b border-slate-100 dark:border-slate-800 bg-indigo-50/50 dark:bg-indigo-900/20 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="bg-gradient-to-br from-indigo-500 to-violet-500 p-2 rounded-xl shadow-lg shadow-indigo-500/20">
                        <Bot className="text-white w-5 h-5" />
                    </div>
                    <div>
                        <h3 className="font-bold text-slate-800 dark:text-slate-100">Study Buddy</h3>
                        <div className="flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Online</span>
                        </div>
                    </div>
                </div>
                <button 
                    onClick={() => setIsOpen(false)}
                    className="p-2 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg text-slate-500 transition-colors"
                >
                    <ChevronDown size={20} />
                </button>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {context && messages.length === 1 && (
                     <div className="bg-indigo-50 dark:bg-indigo-900/20 text-indigo-800 dark:text-indigo-200 text-xs px-3 py-2 rounded-lg border border-indigo-100 dark:border-indigo-800/50 flex items-center gap-2 mb-4">
                        <Sparkles size={12} />
                        <span>I have access to your uploaded notes!</span>
                     </div>
                )}
                
                {messages.map((msg, idx) => (
                    <div 
                        key={idx} 
                        className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                        <div 
                            className={`max-w-[85%] px-4 py-3 rounded-2xl text-sm leading-relaxed shadow-sm whitespace-pre-wrap
                                ${msg.role === 'user' 
                                    ? 'bg-indigo-600 text-white rounded-br-none' 
                                    : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-100 dark:border-slate-700 rounded-bl-none'
                                }
                            `}
                        >
                            {msg.role === 'model' ? formatText(msg.text) : msg.text}
                        </div>
                    </div>
                ))}
                
                {isLoading && messages[messages.length - 1]?.role === 'user' && (
                    <div className="flex justify-start">
                         <div className="bg-white dark:bg-slate-800 px-4 py-3 rounded-2xl rounded-bl-none border border-slate-100 dark:border-slate-700 shadow-sm flex items-center gap-2">
                            <Loader2 size={16} className="animate-spin text-indigo-500" />
                            <span className="text-xs text-slate-400">Buddy is thinking...</span>
                         </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm">
                <div className="relative flex items-center">
                    <input
                        ref={inputRef}
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={handleKeyPress}
                        placeholder="Ask a question..."
                        className="w-full pl-4 pr-12 py-3.5 bg-slate-100 dark:bg-slate-800 border-none rounded-xl text-slate-800 dark:text-slate-200 placeholder:text-slate-400 focus:ring-2 focus:ring-indigo-500/50 outline-none transition-all shadow-inner"
                    />
                    <button
                        onClick={handleSend}
                        disabled={!input.trim() || isLoading}
                        className="absolute right-2 p-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:hover:bg-indigo-600 transition-colors shadow-md"
                    >
                        <Send size={16} />
                    </button>
                </div>
                <div className="text-center mt-2">
                    <span className="text-[10px] text-slate-400 dark:text-slate-500">
                        Buddy prioritizes your notes but knows the world too.
                    </span>
                </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};