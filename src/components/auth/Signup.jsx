import Brand from "../Brand"
import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { useAuth } from "../../hooks/useAuth"
import Mascot from "../Mascot"
import Doodles from "../Doodles"

export function SignupPage() {
  const { signup } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError("")

    if (!email || !password) {
      setError("Email and password are required")
      return
    }

    if (!email.includes("@")) {
      setError("Please enter a valid email address")
      return
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters")
      return
    }

    try {
      await signup(email, password)
      navigate("/app")
    } catch (err) {
      setError(err.message || "Signup failed")
    }
  }

  return (
    <div className="min-h-svh text-white">
      <Doodles />
      {/* Header */}
      <header className="fixed top-0 z-50 w-full border-b border-white/10 bg-[#0b0a14]/75 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <Brand />
          <div className="text-sm text-white/70">
            Already have an account?{" "}
            <button
              onClick={() => navigate("/login")}
              className="text-violet-400 transition-colors hover:text-violet-300"
            >
              Log in
            </button>
          </div>
        </div>
      </header>

      <main className="relative z-10 flex min-h-svh items-center justify-center px-4 pb-10 pt-24">
        <div className="glass w-full max-w-sm rounded-2xl p-7 shadow-2xl shadow-violet-950/40">
          <Mascot mood="cheer" className="mx-auto -mt-16 mb-1 h-28 w-28" />
          <div className="flex flex-col gap-8">
            <div className="flex flex-col gap-2">
              <h1 className="text-2xl font-semibold tracking-tight">
                Create your account
              </h1>
              <p className="text-sm text-white/60">
                Get started with AI-powered study tools in minutes.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <label htmlFor="email" className="text-xs font-medium uppercase tracking-widest text-white/50">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="rounded-lg border border-white/10 bg-white/[0.02] px-4 py-2.5 text-sm text-white outline-none transition-colors placeholder:text-white/30 focus:border-violet-500/50 focus:bg-violet-500/[0.04]"
                />
              </div>

              <div className="flex flex-col gap-2">
                <label htmlFor="password" className="text-xs font-medium uppercase tracking-widest text-white/50">
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="rounded-lg border border-white/10 bg-white/[0.02] px-4 py-2.5 text-sm text-white outline-none transition-colors placeholder:text-white/30 focus:border-violet-500/50 focus:bg-violet-500/[0.04]"
                />
              </div>

              {error && (
                <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-2.5 text-sm text-red-400">
                  {error}
                </div>
              )}

              <button
                type="submit"
                className="mt-2 rounded-lg bg-white px-4 py-2.5 text-sm font-medium text-neutral-950 transition-opacity hover:bg-white/90"
              >
                Create account
              </button>
            </form>
          </div>
        </div>
      </main>
    </div>
  )
}
