import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Mail, Sparkles, ArrowLeft, CheckCircle2 } from 'lucide-react'
import toast from 'react-hot-toast'
import SEO from '../../components/common/SEO'
import Input from '../../components/ui/Input'
import Button from '../../components/ui/Button'
import authService from '../../services/authService'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!email) return
    setLoading(true)
    try {
      await authService.forgotPassword(email)
      setSubmitted(true)
      toast.success('Reset instructions sent!')
    } catch (err) {
      toast.error(err.message || 'Unable to send reset link.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <SEO title="Forgot Password — AIVORA" />
      <div className="min-h-screen bg-aivora-dark flex items-center justify-center p-4">
        <div className="max-w-md w-full glass rounded-3xl p-8 border border-white/10 space-y-6">
          <div className="text-center space-y-2">
            <Link to="/" className="inline-flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-aivora-indigo to-aivora-purple flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <span className="text-xl font-display font-black gradient-text">AIVORA</span>
            </Link>
            <h1 className="text-2xl font-display font-bold text-white">Reset Your Password</h1>
            <p className="text-sm text-slate-400">
              Enter your registered email and we will send you a password reset link.
            </p>
          </div>

          {submitted ? (
            <div className="text-center space-y-4 py-4">
              <div className="w-12 h-12 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-6 h-6 text-emerald-400" />
              </div>
              <p className="text-sm text-slate-300">
                If <span className="text-white font-semibold">{email}</span> is registered, a password reset link has been sent to your inbox.
              </p>
              <Link to="/auth/login" className="block pt-2">
                <Button variant="secondary" fullWidth>
                  Return to Login
                </Button>
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                label="Email Address"
                type="email"
                placeholder="you@example.com"
                icon={Mail}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <Button type="submit" fullWidth loading={loading}>
                Send Reset Link
              </Button>
            </form>
          )}

          <div className="text-center">
            <Link
              to="/auth/login"
              className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Back to Sign In
            </Link>
          </div>
        </div>
      </div>
    </>
  )
}
