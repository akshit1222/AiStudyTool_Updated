import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';
import NotesInput from './components/NotesInput';
import FlashcardMode from './components/FlashcardMode';
import QuizMode from './components/QuizMode';
import SummaryView from './components/SummaryView';
import { SavedSets } from './components/SavedSets';
import VisualsView from './components/VisualsView';
import SlidesView from './components/SlidesView';
import GameHub from './components/game/GameHub';
import Brand from './components/Brand';
import { useGameStats } from './hooks/useGameStats';
import { Sparkles, Layers, ClipboardList, FileText, Gamepad2, LogOut } from 'lucide-react';
import Doodles from './components/Doodles';

export default function AppView() {
  const { logout } = useAuth();
  const { stats, refresh: refreshStats } = useGameStats();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('generate');
  const [view, setView] = useState('input');
  const [notesText, setNotesText] = useState('');
  const [savedFlashcards, setSavedFlashcards] = useState(null);
  const [savedQuiz, setSavedQuiz] = useState(null);

  const handleFlashcards = (text) => {
    setNotesText(text);
    setView('flashcards');
  };

  const handleQuiz = (text) => {
    setNotesText(text);
    setView('quiz');
  };

  const handleSummary = (text) => {
    setNotesText(text);
    setView('summary');
  };

  const handleVisuals = (text) => {
    setNotesText(text);
    setView('visuals');
  };

  const handleSlides = (text) => {
    setNotesText(text);
    setView('slides');
  };

  const handleBack = () => setView('input');

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const handleBackToGenerate = () => setActiveTab('generate');

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setSavedFlashcards(null);
    setSavedQuiz(null);
  };

  const handleOpenFlashcards = (cards) => {
    setSavedFlashcards(cards);
    setActiveTab('generate');
  };

  const handleOpenQuiz = (questions) => {
    setSavedQuiz(questions);
    setActiveTab('generate');
  };

  const tabs = [
    { id: 'generate', label: 'Generate', icon: Sparkles },
    { id: 'flashcards', label: 'Saved Flashcards', icon: Layers },
    { id: 'quizzes', label: 'Saved Quizzes', icon: ClipboardList },
    { id: 'summaries', label: 'Saved Summaries', icon: FileText },
    { id: 'game', label: 'Arcade', icon: Gamepad2 },
  ];

  return (
    <div className="min-h-screen text-white">
      <Doodles />
      {/* Navbar */}
      <header className="fixed top-0 z-50 w-full border-b border-white/10 bg-[#0b0a14]/75 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
          <Brand className="shrink-0" />

          <nav
            className="scrollbar-none hidden min-w-0 items-center gap-1 overflow-x-auto rounded-full border border-white/10 bg-white/[0.04] p-1 lg:flex"
            aria-label="Main"
          >
            {tabs.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => handleTabChange(id)}
                className={`flex shrink-0 items-center gap-2 rounded-full px-3.5 py-1.5 text-sm font-medium transition-all ${
                  activeTab === id
                    ? 'bg-white text-neutral-950 shadow'
                    : 'text-white/60 hover:text-white'
                }`}
              >
                <Icon className="h-4 w-4" aria-hidden="true" />
                {label}
              </button>
            ))}
          </nav>

          <div className="flex shrink-0 items-center gap-3">
            {stats && (
              <button
                onClick={() => handleTabChange('game')}
                className="flex items-center gap-2 rounded-full border border-orange-400/30 bg-orange-500/10 px-3 py-1.5 text-xs font-medium text-orange-200 transition-colors hover:bg-orange-500/20"
                title="Your level and XP"
              >
                <span className="font-display font-bold">Lv {stats.level}</span>
                <span className="text-orange-200/60">{stats.totalXp} XP</span>
              </button>
            )}
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 text-sm text-white/50 transition-colors hover:text-white/90"
            >
              <LogOut className="h-4 w-4" aria-hidden="true" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>

        {/* Mobile tab bar */}
        <nav
          className="scrollbar-none flex gap-1 overflow-x-auto border-t border-white/5 px-3 py-2 lg:hidden"
          aria-label="Main"
        >
          {tabs.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => handleTabChange(id)}
              className={`flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                activeTab === id ? 'bg-white text-neutral-950' : 'text-white/60'
              }`}
            >
              <Icon className="h-3.5 w-3.5" aria-hidden="true" />
              {label}
            </button>
          ))}
        </nav>
      </header>

      <div className="relative z-10 mx-auto max-w-3xl px-4 pb-16 pt-32 sm:pt-28">
        {activeTab === 'generate' && (
          <>
            {savedFlashcards && (
              <FlashcardMode savedCards={savedFlashcards} onBackToGenerate={() => { setSavedFlashcards(null); setActiveTab('generate'); }} />
            )}
            {savedQuiz && (
              <QuizMode savedQuestions={savedQuiz} onBackToGenerate={() => { setSavedQuiz(null); setActiveTab('generate'); }} />
            )}
            {!savedFlashcards && !savedQuiz && (
              <>
                {view === 'input' && (
                  <NotesInput
                    initialText={notesText}
                    onFlashcards={handleFlashcards}
                    onQuiz={handleQuiz}
                    onSummary={handleSummary}
                    onVisuals={handleVisuals}
                    onSlides={handleSlides}
                  />
                )}

                {view === 'flashcards' && (
                  <FlashcardMode initialText={notesText} onBack={handleBack} onBackToGenerate={handleBackToGenerate} />
                )}

                {view === 'quiz' && (
                  <QuizMode initialText={notesText} onBack={handleBack} onBackToGenerate={handleBackToGenerate} />
                )}

                {view === 'visuals' && (
                  <VisualsView initialText={notesText} onBack={handleBack} />
                )}

                {view === 'slides' && (
                  <SlidesView initialText={notesText} onBack={handleBack} />
                )}

                {view === 'summary' && (
                  <SummaryView initialText={notesText} onBack={handleBack} onBackToGenerate={handleBackToGenerate} />
                )}
              </>
            )}
          </>
        )}

        {activeTab === 'flashcards' && (
          <SavedSets defaultTab="flashcards" embedded={true} onOpenFlashcards={handleOpenFlashcards} onOpenQuiz={handleOpenQuiz} />
        )}

        {activeTab === 'quizzes' && (
          <SavedSets defaultTab="quizzes" embedded={true} onOpenFlashcards={handleOpenFlashcards} onOpenQuiz={handleOpenQuiz} />
        )}

        {activeTab === 'summaries' && (
          <SavedSets defaultTab="summaries" embedded={true} onOpenFlashcards={handleOpenFlashcards} onOpenQuiz={handleOpenQuiz} />
        )}

        {activeTab === 'game' && (
          <GameHub stats={stats} refreshStats={refreshStats} initialNotes={notesText} />
        )}
      </div>
    </div>
  );
}
