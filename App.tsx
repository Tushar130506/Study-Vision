import React, { useState, useRef, useEffect } from 'react';
import { AppStatus, FileData, StudyGuide, Session } from './types';
import { generateStudyGuide } from './services/geminiService';
import { ResultsDisplay } from './components/ResultsDisplay';
import { Sidebar } from './components/Sidebar';
import { ThemeToggle } from './components/ThemeToggle';
import { ChatBuddy } from './components/ChatBuddy';
import { Upload, FileText, Loader2, Sparkles, Brain, Menu, X, Plus } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const App: React.FC = () => {
  const [status, setStatus] = useState<AppStatus>(AppStatus.IDLE);
  const [filesData, setFilesData] = useState<FileData[]>([]);
  const [contextText, setContextText] = useState('');
  const [studyData, setStudyData] = useState<StudyGuide | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Persistence State
  const [sessions, setSessions] = useState<Session[]>(() => {
    const saved = localStorage.getItem('study-vision-sessions');
    return saved ? JSON.parse(saved) : [];
  });

  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  
  // Theme State
  const [isDark, setIsDark] = useState(() => {
    if (typeof window !== 'undefined') {
        return document.documentElement.classList.contains('dark') || 
               localStorage.getItem('study-vision-theme') === 'dark';
    }
    return false;
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync sessions with localStorage
  useEffect(() => {
    localStorage.setItem('study-vision-sessions', JSON.stringify(sessions));
  }, [sessions]);

  // Sync theme
  useEffect(() => {
    const root = document.documentElement;
    if (isDark) {
      root.classList.add('dark');
      localStorage.setItem('study-vision-theme', 'dark');
    } else {
      root.classList.remove('dark');
      localStorage.setItem('study-vision-theme', 'light');
    }
  }, [isDark]);

  const toggleTheme = () => setIsDark(!isDark);

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
    const newFiles: FileData[] = [];
    let hasError = false;

    const fileReaders = Array.from(files).map((file) => {
      return new Promise<void>((resolve) => {
        if (!validTypes.includes(file.type)) {
          hasError = true;
          resolve();
          return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
          const base64 = (e.target?.result as string).split(',')[1];
          newFiles.push({
            file,
            previewUrl: URL.createObjectURL(file),
            base64,
            mimeType: file.type
          });
          resolve();
        };
        reader.readAsDataURL(file);
      });
    });

    await Promise.all(fileReaders);

    if (hasError) {
      setErrorMsg("Some files were skipped. Please upload valid images (JPG, PNG, WEBP) or PDFs.");
    } else {
      setErrorMsg(null);
    }

    setFilesData((prev) => [...prev, ...newFiles]);
    
    // Reset input so same files can be selected again if needed
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeFile = (indexToRemove: number) => {
    setFilesData((prev) => prev.filter((_, index) => index !== indexToRemove));
  };

  const handleGenerate = async () => {
    if (filesData.length === 0) return;

    setStatus(AppStatus.GENERATING);
    try {
      // Prepare files payload
      const filesPayload = filesData.map(f => ({
        base64: f.base64,
        mimeType: f.mimeType
      }));

      const result = await generateStudyGuide(
        filesPayload,
        contextText
      );
      
      const mainTitle = filesData[0].file.name.split('.')[0] || 'Untitled Notes';
      const sessionTitle = filesData.length > 1 
        ? `${mainTitle} + ${filesData.length - 1} others`
        : mainTitle;

      const newSession: Session = {
        id: crypto.randomUUID(),
        title: sessionTitle,
        createdAt: Date.now(),
        data: result
      };

      setSessions(prev => [newSession, ...prev]);
      setCurrentSessionId(newSession.id);
      setStudyData(result);
      setStatus(AppStatus.SUCCESS);
    } catch (error) {
      console.error(error);
      setStatus(AppStatus.ERROR);
      setErrorMsg("Failed to generate study guide. Please try again.");
    }
  };

  const handleSelectSession = (session: Session) => {
    setStudyData(session.data);
    setCurrentSessionId(session.id);
    setFilesData([]); // Clear file upload state when viewing history
    setContextText('');
    setStatus(AppStatus.SUCCESS);
  };

  const handleNewChat = () => {
    setStatus(AppStatus.IDLE);
    setFilesData([]);
    setStudyData(null);
    setContextText('');
    setErrorMsg(null);
    setCurrentSessionId(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleDeleteSession = (id: string) => {
    const newSessions = sessions.filter(s => s.id !== id);
    setSessions(newSessions);
    if (currentSessionId === id) {
        handleNewChat();
    }
  };

  const handleMergeSessions = (ids: string[]) => {
    const sessionsToMerge = sessions.filter(s => ids.includes(s.id));
    if (sessionsToMerge.length < 2) return;

    // Merge Logic
    const mergedTitle = "Merged: " + sessionsToMerge.map(s => s.title).join(' + ');
    const mergedSummary = sessionsToMerge.map(s => `--- Summary from ${s.title} ---\n${s.data.summary}`).join('\n\n');
    
    // Concatenate Arrays
    const mergedMCQs = sessionsToMerge.flatMap(s => s.data.mcqs);
    const mergedFlashcards = sessionsToMerge.flatMap(s => s.data.flashcards);
    const mergedPractice = sessionsToMerge.flatMap(s => s.data.practiceQuestions);
    const mergedBlanks = sessionsToMerge.flatMap(s => s.data.fillInTheBlanks);
    const mergedTF = sessionsToMerge.flatMap(s => s.data.trueFalseQuestions);
    
    // Merge Plan: Simple grouping by Day index.
    const mergedPlanMap = new Map<number, any>();
    
    sessionsToMerge.forEach(s => {
        s.data.studyPlan.forEach(day => {
            const existing = mergedPlanMap.get(day.day) || { day: day.day, tasks: [] };
            // Add a header task to indicate source
            const labeledTasks = day.tasks.map(t => ({...t, description: `[${s.title}] ${t.description}`}));
            existing.tasks = [...existing.tasks, ...labeledTasks];
            mergedPlanMap.set(day.day, existing);
        });
    });
    
    const mergedPlan = Array.from(mergedPlanMap.values()).sort((a, b) => a.day - b.day);

    const mergedGuide: StudyGuide = {
        summary: mergedSummary,
        mcqs: mergedMCQs,
        flashcards: mergedFlashcards,
        practiceQuestions: mergedPractice,
        fillInTheBlanks: mergedBlanks,
        trueFalseQuestions: mergedTF,
        studyPlan: mergedPlan
    };

    const newSession: Session = {
        id: crypto.randomUUID(),
        title: mergedTitle,
        createdAt: Date.now(),
        data: mergedGuide
    };

    setSessions(prev => [newSession, ...prev]);
    handleSelectSession(newSession);
  };

  // Construct context string for Buddy
  const getBuddyContext = () => {
    if (!studyData) return "";
    return `
    SUMMARY OF NOTES:
    ${studyData.summary}
    
    KEY TERMS & DEFINITIONS:
    ${studyData.flashcards.map(f => `${f.term}: ${f.definition}`).join('\n')}
    
    QUIZ CONTENT:
    ${studyData.mcqs.map(m => `Q: ${m.question} \nA: ${m.options[m.correctOptionIndex]} \nRationale: ${m.rationale}`).join('\n')}
    `;
  };

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-950 font-sans text-slate-900 dark:text-slate-100 transition-colors duration-200 selection:bg-indigo-100 selection:text-indigo-900 dark:selection:bg-indigo-900 dark:selection:text-indigo-100">
      
      {/* Ambient Background Blobs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
          <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-indigo-400/20 dark:bg-indigo-600/10 blur-3xl animate-pulse" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-violet-400/20 dark:bg-violet-600/10 blur-3xl" />
      </div>

      <Sidebar 
        sessions={sessions}
        currentSessionId={currentSessionId}
        onSelectSession={handleSelectSession}
        onNewChat={handleNewChat}
        onDeleteSession={handleDeleteSession}
        onMergeSessions={handleMergeSessions}
        isOpen={isSidebarOpen}
        setIsOpen={setIsSidebarOpen}
      />

      <div className="flex-1 flex flex-col min-w-0 z-10">
          {/* Header */}
          <header className="sticky top-0 z-30 bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl border-b border-slate-200 dark:border-slate-800 px-4 h-16 flex items-center justify-between">
            <div className="flex items-center gap-3">
                <button 
                    onClick={() => setIsSidebarOpen(true)}
                    className="md:hidden p-2 -ml-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
                >
                    <Menu size={24} />
                </button>
                <div className="flex items-center gap-2">
                    <div className="bg-gradient-to-br from-indigo-500 to-violet-600 p-1.5 rounded-lg shadow-lg shadow-indigo-500/20">
                        <Brain className="text-white w-5 h-5" />
                    </div>
                    <span className="font-bold text-xl tracking-tight hidden sm:block">
                        Study <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-violet-600 dark:from-indigo-400 dark:to-violet-400">Vision</span>
                    </span>
                </div>
            </div>
            
            <ThemeToggle isDark={isDark} toggle={toggleTheme} />
          </header>

          {/* Main Content */}
          <main className="flex-1 overflow-y-auto">
             
             {/* IDLE / Upload View */}
             {status !== AppStatus.SUCCESS && (
                 <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="max-w-3xl mx-auto px-4 py-6 md:py-12"
                 >
                    <div className={`text-center transition-all duration-500 ${filesData.length > 0 ? 'mb-6 md:mb-8' : 'mb-12'}`}>
                        <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight mb-4 md:mb-6">
                            Master Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-violet-600 dark:from-indigo-400 dark:to-violet-400">Coursework</span>
                        </h1>
                        <p className="text-base md:text-lg text-slate-500 dark:text-slate-400 max-w-2xl mx-auto px-4">
                            {filesData.length > 0 
                                ? "Great! Now customize your study guide or generate it immediately."
                                : "Upload your notes, slides, or PDFs to get started."
                            }
                        </p>
                    </div>

                    <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm rounded-3xl shadow-2xl shadow-indigo-100 dark:shadow-none border border-white/50 dark:border-slate-800 overflow-hidden transition-all duration-500">
                        {status === AppStatus.ERROR && (
                            <div className="bg-red-50 dark:bg-red-900/20 p-4 border-l-4 border-red-500 flex items-center gap-3">
                                <div className="text-red-500 dark:text-red-400 font-bold">Error</div>
                                <p className="text-red-700 dark:text-red-300 text-sm">{errorMsg}</p>
                            </div>
                        )}

                        <div className="p-6 md:p-12 space-y-6 md:space-y-8">
                             {/* Upload Section */}
                            <div className="transition-all duration-300">
                                <div className="flex justify-between items-center mb-4">
                                    <label className="text-sm font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide">
                                        {filesData.length > 0 ? 'Uploaded Files' : 'Upload Materials'}
                                    </label>
                                    {filesData.length > 0 && (
                                         <span className="text-xs font-medium text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30 px-2 py-1 rounded-full border border-indigo-100 dark:border-indigo-800">
                                            {filesData.length} File{filesData.length !== 1 ? 's' : ''}
                                         </span>
                                    )}
                                </div>
                                
                                {filesData.length === 0 ? (
                                    <motion.div 
                                        onClick={() => fileInputRef.current?.click()}
                                        className="group relative cursor-pointer"
                                        whileHover={{ scale: 1.01 }}
                                        whileTap={{ scale: 0.99 }}
                                    >
                                        <input 
                                            type="file" 
                                            ref={fileInputRef} 
                                            onChange={handleFileChange} 
                                            className="hidden" 
                                            accept="image/*,.pdf"
                                            multiple
                                        />
                                        
                                        {/* Mobile Minimalist View */}
                                        <div className="md:hidden flex items-center gap-4 p-6 rounded-2xl border-2 border-dashed border-slate-300 dark:border-slate-700 active:bg-slate-50 dark:active:bg-slate-800 transition-colors">
                                            <div className="bg-indigo-600 p-3 rounded-xl text-white shadow-lg shadow-indigo-200 dark:shadow-none">
                                                <Upload size={24} />
                                            </div>
                                            <div className="flex-1">
                                                <h3 className="font-bold text-slate-800 dark:text-slate-100 text-lg">Tap to Upload</h3>
                                                <p className="text-slate-500 dark:text-slate-400 text-xs">Images or PDFs</p>
                                            </div>
                                        </div>

                                        {/* Desktop Expanded View */}
                                        <div className="hidden md:flex flex-col items-center justify-center p-12 rounded-2xl border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-indigo-400 dark:hover:border-indigo-500 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all duration-300">
                                            <div className="bg-indigo-50 dark:bg-indigo-900/30 p-4 rounded-full mb-4 text-indigo-600 dark:text-indigo-400 group-hover:scale-110 transition-transform shadow-inner">
                                                <Upload size={32} />
                                            </div>
                                            <span className="text-lg font-medium text-slate-700 dark:text-slate-300 mb-2">
                                                Drag & drop or click to upload
                                            </span>
                                            <p className="text-sm text-slate-400 dark:text-slate-500">
                                                Supported formats: JPG, PNG, PDF
                                            </p>
                                        </div>
                                    </motion.div>
                                ) : (
                                    /* File List View */
                                    <div className="space-y-4">
                                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                                            <AnimatePresence>
                                            {filesData.map((file, idx) => (
                                                <motion.div 
                                                    key={idx} 
                                                    initial={{ opacity: 0, scale: 0.8 }}
                                                    animate={{ opacity: 1, scale: 1 }}
                                                    exit={{ opacity: 0, scale: 0.8 }}
                                                    whileHover={{ scale: 1.05, rotate: 1 }}
                                                    className="relative group bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-2 flex flex-col items-center shadow-sm hover:shadow-md transition-shadow"
                                                >
                                                    <button 
                                                        onClick={() => removeFile(idx)}
                                                        className="absolute -top-2 -right-2 p-1.5 bg-white dark:bg-slate-700 text-red-500 border border-slate-200 dark:border-slate-600 rounded-full shadow-sm hover:scale-110 transition-transform z-10"
                                                    >
                                                        <X size={12} />
                                                    </button>
                                                    
                                                    {file.mimeType.startsWith('image') ? (
                                                        <div className="w-full aspect-square mb-2 rounded-lg overflow-hidden bg-white shadow-inner">
                                                            <img src={file.previewUrl} alt="Preview" className="w-full h-full object-cover" />
                                                        </div>
                                                    ) : (
                                                        <div className="w-full aspect-square mb-2 flex items-center justify-center bg-indigo-50 dark:bg-indigo-900/20 rounded-lg border border-indigo-100 dark:border-indigo-800/50">
                                                            <FileText size={24} className="text-indigo-500 dark:text-indigo-400" />
                                                        </div>
                                                    )}
                                                    
                                                    <span className="text-[10px] font-medium text-slate-600 dark:text-slate-400 truncate w-full text-center px-1">
                                                        {file.file.name}
                                                    </span>
                                                </motion.div>
                                            ))}
                                            </AnimatePresence>

                                            {/* Add More Button */}
                                            <motion.button 
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                                whileHover={{ scale: 1.05 }}
                                                whileTap={{ scale: 0.95 }}
                                                onClick={() => fileInputRef.current?.click()}
                                                className="aspect-square flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-indigo-200 dark:border-indigo-800 bg-indigo-50/50 dark:bg-indigo-900/10 hover:border-indigo-400 dark:hover:border-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-all group"
                                            >
                                                 <div className="bg-white dark:bg-slate-800 p-2 rounded-full shadow-sm text-indigo-500 group-hover:scale-110 transition-transform mb-1">
                                                    <Plus size={20} />
                                                 </div>
                                                 <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase">Add More</span>
                                            </motion.button>
                                            
                                            <input 
                                                type="file" 
                                                ref={fileInputRef} 
                                                onChange={handleFileChange} 
                                                className="hidden" 
                                                accept="image/*,.pdf"
                                                multiple
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Optional Features & Generate - Only shown if files exist */}
                            {filesData.length > 0 && (
                                <motion.div 
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="space-y-6 pt-4 border-t border-slate-100 dark:border-slate-800"
                                >
                                    {/* Context Input */}
                                    <div>
                                        <div className="flex items-center gap-2 mb-3">
                                            <label className="text-sm font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide">
                                                Focus Areas
                                            </label>
                                            <span className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">Optional</span>
                                        </div>
                                        <textarea
                                            value={contextText}
                                            onChange={(e) => setContextText(e.target.value)}
                                            placeholder="E.g., Focus on equations, specifically Newton's laws..."
                                            className="w-full p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-slate-800 dark:text-slate-200 focus:bg-white dark:focus:bg-slate-800 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50/50 dark:focus:ring-indigo-900/50 outline-none transition-all resize-none text-sm"
                                            rows={2}
                                        />
                                    </div>

                                     {/* Generate Button */}
                                    <div className="pt-2">
                                        <motion.button
                                            whileHover={{ scale: 1.02 }}
                                            whileTap={{ scale: 0.98 }}
                                            onClick={handleGenerate}
                                            disabled={status === AppStatus.GENERATING}
                                            className={`
                                                w-full py-4 px-6 rounded-xl font-bold text-lg flex items-center justify-center gap-3 transition-all
                                                ${status === AppStatus.GENERATING
                                                    ? 'bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-600 cursor-not-allowed'
                                                    : 'bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white shadow-xl shadow-indigo-300/50 dark:shadow-indigo-900/30'
                                                }
                                            `}
                                        >
                                            {status === AppStatus.GENERATING ? (
                                                <>
                                                    <Loader2 className="animate-spin" />
                                                    Generating Guide...
                                                </>
                                            ) : (
                                                <>
                                                    <Sparkles className="text-indigo-100" />
                                                    Generate Study Guide
                                                </>
                                            )}
                                        </motion.button>
                                        <p className="text-center text-xs text-slate-400 dark:text-slate-500 mt-4">
                                            Powered by Google Gemini 2.5 Flash
                                        </p>
                                    </div>
                                </motion.div>
                            )}
                        </div>
                    </div>
                 </motion.div>
             )}

             {/* Results View */}
             {status === AppStatus.SUCCESS && studyData && (
                 <ResultsDisplay data={studyData} onReset={handleNewChat} />
             )}
          </main>
      </div>

      {/* Chat Buddy */}
      <ChatBuddy context={getBuddyContext()} />
    </div>
  );
};

export default App;