import { useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { Lock, Sparkles } from 'lucide-react'
import toast from 'react-hot-toast'
import SEO from '../../components/common/SEO'
import Input from '../../components/ui/Input'
import Button from '../../components/ui/Button'
import authService from '../../services/authService'

export default function ResetPasswordPage() {
  const { token } = useParams()
  const navigate = useNavigate()
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (password.length < 8) {
      toast.error('Password must be at least 8 characters')
      return
    }
    if (password !== confirmPassword) {
      toast.error('Passwords do not match')
      return
    }
    setLoading(true)
    try {
      await authService.resetPassword(token, password)
      toast.success('Password updated! Please sign in.')
      navigate('/auth/login')
    } catch (err) {
      toast.error(err.message || 'Invalid or expired reset token.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <SEO title="Set New Password — AIVORA" />
      <div className="min-h-screen bg-aivora-dark flex items-center justify-center p-4">
        <div className="max-w-md w-full glass rounded-3xl p-8 border border-white/10 space-y-6">
          <div className="text-center space-y-2">
            <Link to="/" className="inline-flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-aivora-indigo to-aivora-purple flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <span className="text-xl font-display font-black gradient-text">AIVORA</span>
            </Link>
            <h1 className="text-2xl font-display font-bold text-white">Choose a New Password</h1>
            <p className="text-sm text-slate-400">Enter your new password below.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="New Password"
              type="password"
              icon={Lock}
              placeholder="Min. 8 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <Input
              label="Confirm New Password"
              type="password"
              icon={Lock}
              placeholder="Confirm password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
            <Button type="submit" fullWidth loading={loading}>
              Update Password
            </Button>
          </form>
        </div>
      </div>
    </>
  )
}
