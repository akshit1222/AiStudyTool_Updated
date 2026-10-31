import Brand from "../Brand"
import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { apiFetch } from "../../services/api"
import Mascot from "../Mascot"
import Doodles from "../Doodles"

export function ForgotPasswordPage() {
  const navigate = useNavigate()
  const [step, setStep] = useState(1)
  const [email, setEmail] = useState("")
  const [otp, setOtp] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  const handleSendOtp = async (e) => {
    e.preventDefault()
    setError("")

    if (!email) {
      setError("Email is required")
      return
    }

    if (!email.includes("@")) {
      setError("Please enter a valid email address")
      return
    }

    try {
      await apiFetch('/api/auth/forgot-password', {
        method: 'POST',
        body: JSON.stringify({ email }),
      })
      setStep(2)
    } catch (err) {
      setError(err.message || "Failed to send OTP")
    }
  }

  const handleResetPassword = async (e) => {
    e.preventDefault()
    setError("")

    if (!otp || !newPassword || !confirmPassword) {
      setError("All fields are required")
      return
    }

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match")
      return
    }

    if (newPassword.length < 6) {
      setError("Password must be at least 6 characters")
      return
    }

    try {
      await apiFetch('/api/auth/reset-password', {
        method: 'POST',
        body: JSON.stringify({ email, otp, newPassword }),
      })
      setSuccess("Password reset successfully")
      setTimeout(() => {
        navigate("/login")
      }, 2000)
    } catch (err) {
      setError(err.message || "Failed to reset password")
    }
  }

  return (
    <div className="min-h-svh text-white">
      <Doodles />
      {/* Header */}
      <header className="fixed top-0 z-50 w-full border-b border-white/10 bg-[#0b0a14]/75 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <Brand />
          <button
            onClick={() => navigate("/login")}
            className="text-sm text-white/70 transition-colors hover:text-white"
          >
            Back to login
          </button>
        </div>
      </header>

      <main className="relative z-10 flex min-h-svh items-center justify-center px-4 pb-10 pt-24">
        <div className="glass w-full max-w-sm rounded-2xl p-7 shadow-2xl shadow-violet-950/40">
          <Mascot mood="thinking" className="mx-auto -mt-16 mb-1 h-28 w-28" />
          <div className="flex flex-col gap-8">
            <div className="flex flex-col gap-2">
              <h1 className="text-2xl font-semibold tracking-tight">
                {step === 1 ? "Forgot password" : "Reset password"}
              </h1>
              <p className="text-sm text-white/60">
                {step === 1
                  ? "Enter your email to receive a password reset code."
                  : "Enter the code sent to your email and your new password."}
              </p>
            </div>

            {step === 1 ? (
              <form onSubmit={handleSendOtp} className="flex flex-col gap-4">
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

                {error && (
                  <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-2.5 text-sm text-red-400">
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  className="mt-2 rounded-lg bg-white px-4 py-2.5 text-sm font-medium text-neutral-950 transition-opacity hover:bg-white/90"
                >
                  Send OTP
                </button>
              </form>
            ) : (
              <form onSubmit={handleResetPassword} className="flex flex-col gap-4">
                <div className="flex flex-col gap-2">
                  <label htmlFor="otp" className="text-xs font-medium uppercase tracking-widest text-white/50">
                    OTP Code
                  </label>
                  <input
                    id="otp"
                    type="text"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    placeholder="123456"
                    className="rounded-lg border border-white/10 bg-white/[0.02] px-4 py-2.5 text-sm text-white outline-none transition-colors placeholder:text-white/30 focus:border-violet-500/50 focus:bg-violet-500/[0.04]"
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <label htmlFor="newPassword" className="text-xs font-medium uppercase tracking-widest text-white/50">
                    New Password
                  </label>
                  <input
                    id="newPassword"
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="••••••••"
                    className="rounded-lg border border-white/10 bg-white/[0.02] px-4 py-2.5 text-sm text-white outline-none transition-colors placeholder:text-white/30 focus:border-violet-500/50 focus:bg-violet-500/[0.04]"
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <label htmlFor="confirmPassword" className="text-xs font-medium uppercase tracking-widest text-white/50">
                    Confirm Password
                  </label>
                  <input
                    id="confirmPassword"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className="rounded-lg border border-white/10 bg-white/[0.02] px-4 py-2.5 text-sm text-white outline-none transition-colors placeholder:text-white/30 focus:border-violet-500/50 focus:bg-violet-500/[0.04]"
                  />
                </div>

                {error && (
                  <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-2.5 text-sm text-red-400">
                    {error}
                  </div>
                )}

                {success && (
                  <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-2.5 text-sm text-emerald-400">
                    {success}
                  </div>
                )}

                <button
                  type="submit"
                  className="mt-2 rounded-lg bg-white px-4 py-2.5 text-sm font-medium text-neutral-950 transition-opacity hover:bg-white/90"
                >
                  Reset Password
                </button>
              </form>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
