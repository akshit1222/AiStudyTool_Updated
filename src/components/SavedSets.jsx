import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { Trash2 } from "lucide-react"
import { apiFetch } from "../services/api"
import Mascot from './Mascot';
import MascotTip from './MascotTip';

export function SavedSets({ defaultTab, embedded = false, onOpenFlashcards, onOpenQuiz }) {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState(() => {
    if (defaultTab === 'flashcards') return 'flashcard'
    if (defaultTab === 'quizzes') return 'quiz'
    if (defaultTab === 'summaries') return 'summary'
    return defaultTab || 'flashcard'
  })
  const [isLoading, setIsLoading] = useState(true)
  const [items, setItems] = useState([])
  const [error, setError] = useState(null)
  const [expandedItem, setExpandedItem] = useState(null)
  const [expandedContent, setExpandedContent] = useState(null)

  const tabs = [
    { id: "flashcard", label: "Flashcards" },
    { id: "quiz", label: "Quizzes" },
    { id: "summary", label: "Summaries" },
  ]

  useEffect(() => {
    fetchSavedItems()
  }, [])

  const fetchSavedItems = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const [flashcards, quizzes, summaries] = await Promise.all([
        apiFetch('/api/flashcards'),
        apiFetch('/api/quizzes'),
        apiFetch('/api/summaries'),
      ])

      const mappedItems = [
        ...flashcards.map(item => ({
          id: item._id,
          title: item.title,
          savedDate: item.createdAt,
          type: 'flashcard',
          data: item.cards,
        })),
        ...quizzes.map(item => ({
          id: item._id,
          title: item.title,
          savedDate: item.createdAt,
          type: 'quiz',
          data: item.questions,
        })),
        ...summaries.map(item => ({
          id: item._id,
          title: item.title,
          savedDate: item.createdAt,
          type: 'summary',
        })),
      ]
      setItems(mappedItems)
    } catch (err) {
      setError(err.message || 'Failed to load saved items')
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async (id) => {
    const item = items.find(i => i.id === id)
    if (!item) return

    const endpoint = item.type === 'flashcard'
      ? `/api/flashcards/${id}`
      : item.type === 'quiz'
        ? `/api/quizzes/${id}`
        : `/api/summaries/${id}`

    try {
      await apiFetch(endpoint, { method: 'DELETE' })
      setItems(prev => prev.filter(i => i.id !== id))
    } catch (err) {
      setError(err.message || 'Failed to delete item')
    }
  }

  const handleItemClick = async (item) => {
    if (item.type === 'summary') {
      if (expandedItem === item.id) {
        setExpandedItem(null)
        setExpandedContent(null)
      } else {
        try {
          const data = await apiFetch(`/api/summaries/${item.id}`)
          setExpandedItem(item.id)
          setExpandedContent(data.content)
        } catch (err) {
          setError(err.message || 'Failed to load summary')
        }
      }
    } else if (item.type === 'flashcard' && onOpenFlashcards) {
      onOpenFlashcards(item.data)
    } else if (item.type === 'quiz' && onOpenQuiz) {
      onOpenQuiz(item.data)
    } else if (!embedded) {
      navigate('/app', { state: { viewSaved: { type: item.type, id: item.id } } })
    }
  }

  const filteredItems = items.filter((item) => item.type === activeTab)

  return (
    <div className={`${embedded ? '' : 'min-h-svh'} relative z-10 text-white`}>
      {/* Header */}
      {!embedded && (
        <header className="border-b border-white/10 bg-[#0b0a14]/75 backdrop-blur-xl px-4 py-4">
          <div className="mx-auto max-w-4xl">
            <div className="flex items-center justify-between">
              <h1 className="text-lg font-semibold">My Saved Sets</h1>
              <button
                onClick={() => navigate('/app')}
                className="text-xs font-medium text-violet-400 transition-colors hover:text-violet-300"
              >
                Back to app
              </button>
            </div>
          </div>
        </header>
      )}

      <main className={`mx-auto max-w-4xl px-4 ${embedded ? 'py-4' : 'py-10'}`}>
        {(isLoading || filteredItems.length > 0) && (
          <MascotTip mood="happy" accent="orange">
            Your saved study sets. Tap one to practise again!
          </MascotTip>
        )}

        {/* Tabs */}
        {!embedded && (
          <div className="flex gap-2 border-b border-white/10">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-3 text-sm font-medium transition-colors border-b-2 -mb-px ${
                  activeTab === tab.id
                    ? "border-violet-500 text-white"
                    : "border-transparent text-white/50 hover:text-white/70"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        )}

        {/* Error state */}
        {error && (
          <div className="mt-8 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
            {error}
          </div>
        )}

        {/* Loading state */}
        {isLoading && (
          <div className="mt-8 space-y-3">
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className="rounded-lg border border-white/10 bg-white/[0.02] p-4"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 space-y-2">
                    <div className="h-5 w-3/4 animate-pulse rounded bg-white/10" />
                    <div className="h-4 w-1/2 animate-pulse rounded bg-white/5" />
                  </div>
                  <div className="h-5 w-5 animate-pulse rounded bg-white/10" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Empty state */}
        {!isLoading && items.length === 0 && (
          <div className="mt-8 text-center">
            <Mascot mood="sleepy" className="mx-auto h-40 w-40" />
            <p className="text-sm text-white/60">
              {(() => {
                const typeLabel = activeTab === "flashcard" ? "flashcards" : activeTab === "quiz" ? "quizzes" : "summaries"
                if (embedded) {
                  return `No ${typeLabel} saved yet.`
                }
                return (
                  <>
                    No {typeLabel} saved yet —{" "}
                    <button
                      onClick={() => navigate('/app')}
                      className="text-violet-400 transition-colors hover:text-violet-300"
                    >
                      generate some from your notes
                    </button>{" "}
                    to get started.
                  </>
                )
              })()}
            </p>
          </div>
        )}

        {/* Items list */}
        {!isLoading && filteredItems.length > 0 && (
          <div className="mt-8 space-y-3">
            {filteredItems.map((item) => (
              <div key={item.id}>
                <div
                  className="group rounded-xl border border-white/10 border-l-4 border-l-violet-500/70 bg-white/[0.03] p-4 transition-all hover:-translate-y-0.5 hover:border-white/20 hover:bg-white/[0.06]"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div
                      className="flex-1 min-w-0 cursor-pointer"
                      onClick={() => handleItemClick(item)}
                    >
                      <h3 className="font-medium truncate">{item.title}</h3>
                      <p className="mt-1 text-xs text-white/50">
                        Saved{" "}
                        {new Date(item.savedDate).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </p>
                    </div>
                    <button
                      onClick={() => handleDelete(item.id)}
                      className="shrink-0 rounded-md border border-white/10 bg-white/[0.02] p-2 transition-colors hover:border-red-500/50 hover:bg-red-500/10"
                      aria-label="Delete"
                    >
                      <Trash2 className="h-4 w-4 text-white/60 hover:text-red-400" aria-hidden="true" />
                    </button>
                  </div>
                </div>
                {expandedItem === item.id && expandedContent && (
                  <div className="mt-2 rounded-lg border border-white/10 bg-white/[0.02] p-4">
                    <div className="flex items-start justify-between gap-4 mb-3">
                      <h4 className="text-sm font-medium text-white/70">Summary Content</h4>
                      <button
                        onClick={() => {
                          setExpandedItem(null)
                          setExpandedContent(null)
                        }}
                        className="text-xs text-white/50 hover:text-white/70"
                      >
                        Close
                      </button>
                    </div>
                    <p className="text-sm text-white/80 whitespace-pre-wrap">{expandedContent}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
