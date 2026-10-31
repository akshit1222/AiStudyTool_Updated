import { useState } from "react"
import { Link } from "react-router-dom"
import {
  ArrowRight,
  CheckCircle2,
  Crown,
  Flame,
  Sparkles,
  Upload,
  Zap,
} from "lucide-react"
import Brand from "./Brand"
import Mascot from "./Mascot"
import Doodles from "./Doodles"

const DEMO_CARDS = [
  {
    q: "What does the mitochondrion do?",
    a: "It converts nutrients into ATP, the cell's usable energy.",
  },
  {
    q: "What does the Treaty of Versailles blame Germany for?",
    a: "War guilt, with reparations and territorial losses attached.",
  },
  {
    q: "What is the time complexity of binary search?",
    a: "O(log n), because each step halves the search space.",
  },
]

const SAMPLE_BOARD = [
  { name: "Maya", score: 2140, streak: 9 },
  { name: "Ravi", score: 1985, streak: 7 },
  { name: "Elena", score: 1710, streak: 6 },
  { name: "You", score: 1420, streak: 5, you: true },
]

function FlashcardDemo() {
  const [index, setIndex] = useState(0)
  const [flipped, setFlipped] = useState(false)
  const card = DEMO_CARDS[index]

  const next = () => {
    setFlipped(false)
    setIndex((i) => (i + 1) % DEMO_CARDS.length)
  }

  return (
    <div className="relative mx-auto w-full max-w-md">
      <div className="absolute -inset-6 -z-10 rounded-[2rem] bg-gradient-to-tr from-violet-600/25 via-fuchsia-500/10 to-orange-400/20 blur-2xl" />
      <Mascot mood="cheer" className="pointer-events-none absolute -right-6 -top-24 z-10 h-36 w-36 sm:-right-10 sm:-top-28 sm:h-44 sm:w-44" />

      <div
        className="absolute inset-x-6 top-4 h-full rotate-[4deg] rounded-2xl border border-white/10 bg-white/[0.03]"
        aria-hidden="true"
      />
      <button
        type="button"
        onClick={() => setFlipped((f) => !f)}
        aria-label="Flip flashcard"
        className="glass relative flex min-h-64 w-full -rotate-1 flex-col justify-between rounded-2xl p-6 text-left transition-transform duration-300 hover:rotate-0"
      >
        <span className="text-xs text-white/40">
          {flipped ? "Answer" : "Question"} · tap to flip
        </span>
        <p className="font-display text-xl font-semibold leading-snug">
          {flipped ? card.a : card.q}
        </p>
        <span className="text-xs text-white/40">
          Card {index + 1} of {DEMO_CARDS.length}
        </span>
      </button>

      <div className="mt-4 flex items-center justify-between">
        <button
          type="button"
          onClick={next}
          className="rounded-full border border-white/15 bg-white/5 px-4 py-2 text-xs font-medium transition-colors hover:bg-white/10"
        >
          Next card
        </button>
        <span className="animate-float flex items-center gap-2 rounded-full border border-orange-400/40 bg-orange-500/15 px-3 py-1.5 text-xs font-medium text-orange-200">
          <Flame className="animate-flame h-3.5 w-3.5 text-orange-400" aria-hidden="true" />
          7 streak · x3 points
        </span>
      </div>
    </div>
  )
}

export function Landing() {
  return (
    <div className="min-h-svh text-white">
      <Doodles />
      {/* Nav */}
      <header className="fixed top-0 z-50 w-full border-b border-white/10 bg-[#0b0a14]/75 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3.5">
          <Brand />
          <div className="flex items-center gap-3">
            <Link
              to="/login"
              className="text-sm text-white/70 transition-colors hover:text-white"
            >
              Log in
            </Link>
            <Link
              to="/signup"
              className="rounded-full bg-white px-4 py-2 text-sm font-medium text-neutral-950 transition-opacity hover:bg-white/90"
            >
              Sign up
            </Link>
          </div>
        </div>
      </header>

      <main className="relative z-10 pt-20">
        {/* Hero */}
        <section className="px-4 py-14 sm:py-24">
          <div className="mx-auto grid max-w-6xl items-center gap-14 lg:grid-cols-[1.1fr_0.9fr]">
            <div>
              <h1 className="text-balance text-4xl font-bold leading-[1.08] tracking-tight sm:text-6xl">
                Turn your notes into study superpowers
              </h1>
              <p className="mt-5 max-w-xl text-base leading-relaxed text-white/65 sm:text-lg">
                Paste your lecture notes or upload a PDF. AI builds flashcards, quizzes and
                summaries in seconds, then lets you play your own material for points on a
                live leaderboard.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link
                  to="/signup"
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-white px-7 py-3 text-sm font-semibold text-neutral-950 transition-transform hover:scale-[1.02]"
                >
                  Get started free
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Link>
                <Link
                  to="/login"
                  className="inline-flex items-center justify-center rounded-full border border-white/20 px-7 py-3 text-sm font-medium transition-colors hover:border-white/40 hover:bg-white/5"
                >
                  Already have an account
                </Link>
              </div>
            </div>

            <FlashcardDemo />
          </div>
        </section>

        {/* How it works */}
        <section className="px-4 py-16 sm:py-20">
          <div className="mx-auto max-w-6xl">
            <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">How it works</h2>
            <ol className="mt-10 grid gap-4 md:grid-cols-3">
              {[
                {
                  icon: Upload,
                  title: "Paste or upload",
                  desc: "Copy your notes or drag in a PDF. No setup needed.",
                },
                {
                  icon: Sparkles,
                  title: "AI generates",
                  desc: "Flashcards, quizzes and summaries are created instantly.",
                },
                {
                  icon: Zap,
                  title: "Study and play",
                  desc: "Review, save your sets, then race the clock in Quiz Blitz.",
                },
              ].map(({ icon: Icon, title, desc }, i) => (
                <li key={title} className="glass relative rounded-2xl p-6">
                  <span className="font-display text-sm font-semibold text-white/30">
                    Step {i + 1}
                  </span>
                  <Icon className="mt-4 h-6 w-6 text-violet-300" aria-hidden="true" />
                  <h3 className="mt-3 font-medium">{title}</h3>
                  <p className="mt-1.5 text-sm text-white/60">{desc}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* Features */}
        <section className="px-4 py-16 sm:py-20">
          <div className="mx-auto max-w-6xl">
            <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
              Built for how you study
            </h2>
            <div className="mt-10 grid gap-4 md:grid-cols-3">
              {[
                {
                  icon: Zap,
                  title: "Flashcards",
                  desc: "Flip through key concepts and mark what you already know.",
                  tone: "text-violet-300",
                },
                {
                  icon: CheckCircle2,
                  title: "Quizzes",
                  desc: "Test yourself and see exactly which answers you missed.",
                  tone: "text-sky-300",
                },
                {
                  icon: Sparkles,
                  title: "Summaries",
                  desc: "Get the key takeaways of long notes at a glance.",
                  tone: "text-teal-300",
                },
              ].map(({ icon: Icon, title, desc, tone }) => (
                <div key={title} className="glass rounded-2xl p-6 transition-colors hover:border-white/25">
                  <Icon className={`h-6 w-6 ${tone}`} aria-hidden="true" />
                  <h3 className="mt-4 font-medium">{title}</h3>
                  <p className="mt-1.5 text-sm text-white/60">{desc}</p>
                </div>
              ))}

              {/* Arcade feature */}
              <div className="glass relative overflow-hidden rounded-2xl p-6 md:col-span-3">
                <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-orange-500/20 blur-3xl" />
                <div className="relative grid items-center gap-8 md:grid-cols-2">
                  <div>
                    <span className="inline-flex items-center gap-2 rounded-full border border-orange-400/40 bg-orange-500/10 px-3 py-1 text-xs font-medium text-orange-200">
                      <Flame className="h-3.5 w-3.5" aria-hidden="true" />
                      New: Quiz Blitz
                    </span>
                    <h3 className="mt-4 text-2xl font-semibold tracking-tight">
                      Study like it is a game
                    </h3>
                    <p className="mt-2 text-sm leading-relaxed text-white/65">
                      Answer questions from your own notes against a 15-second clock. Chain
                      correct answers for bigger multipliers, protect your three lives, earn
                      XP and badges, and see where you rank.
                    </p>
                  </div>

                  <div>
                    <ul className="flex flex-col gap-2">
                      {SAMPLE_BOARD.map((p, i) => (
                        <li
                          key={p.name}
                          className={`flex items-center gap-3 rounded-xl border px-4 py-2.5 text-sm ${
                            p.you
                              ? "border-violet-400/50 bg-violet-500/10"
                              : "border-white/10 bg-white/[0.03]"
                          }`}
                        >
                          <span className="w-5 font-display font-semibold text-white/40">
                            {i + 1}
                          </span>
                          {i === 0 && <Crown className="h-4 w-4 text-amber-300" aria-hidden="true" />}
                          <span className="flex-1 font-medium">{p.name}</span>
                          <span className="text-xs text-white/40">streak {p.streak}</span>
                          <span className="font-display font-semibold tabular-nums">
                            {p.score.toLocaleString()}
                          </span>
                        </li>
                      ))}
                    </ul>
                    <p className="mt-2 text-center text-xs text-white/35">Sample leaderboard</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="px-4 py-16 sm:py-24">
          <div className="glass mx-auto max-w-3xl rounded-3xl px-6 py-14 text-center">
            <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
              Ready to ace your studies?
            </h2>
            <Link
              to="/signup"
              className="mt-7 inline-flex items-center gap-2 rounded-full bg-white px-7 py-3 text-sm font-semibold text-neutral-950 transition-transform hover:scale-[1.02]"
            >
              Create your account
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t border-white/5 px-4 py-8">
          <div className="mx-auto max-w-6xl text-center text-xs text-white/40">
            <p>StudyForge © 2026. All rights reserved.</p>
          </div>
        </footer>
      </main>
    </div>
  )
}
