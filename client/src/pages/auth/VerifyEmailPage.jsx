import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react'
import SEO from '../../components/common/SEO'
import Button from '../../components/ui/Button'
import authService from '../../services/authService'

export default function VerifyEmailPage() {
  const { token } = useParams()
  const [status, setStatus] = useState('loading')
  const [message, setMessage] = useState('')

  useEffect(() => {
    let isMounted = true
    authService
      .verifyEmail(token)
      .then((res) => {
        if (isMounted) {
          setStatus('success')
          setMessage(res.message || 'Your email has been verified!')
        }
      })
      .catch((err) => {
        if (isMounted) {
          setStatus('error')
          setMessage(err.message || 'Verification link is invalid or expired.')
        }
      })
    return () => {
      isMounted = false
    }
  }, [token])

  return (
    <>
      <SEO title="Verify Email — AIVORA" />
      <div className="min-h-screen bg-aivora-dark flex items-center justify-center p-4">
        <div className="max-w-md w-full glass rounded-3xl p-8 border border-white/10 text-center space-y-5">
          {status === 'loading' && (
            <>
              <Loader2 className="w-12 h-12 text-aivora-indigo animate-spin mx-auto" />
              <h1 className="text-xl font-display font-bold text-white">Verifying Your Email...</h1>
            </>
          )}

          {status === 'success' && (
            <>
              <CheckCircle2 className="w-14 h-14 text-emerald-400 mx-auto" />
              <h1 className="text-2xl font-display font-bold text-white">Email Verified!</h1>
              <p className="text-sm text-slate-400">{message}</p>
              <Link to="/dashboard" className="block pt-2">
                <Button fullWidth>Go to Dashboard</Button>
              </Link>
            </>
          )}

          {status === 'error' && (
            <>
              <XCircle className="w-14 h-14 text-red-400 mx-auto" />
              <h1 className="text-2xl font-display font-bold text-white">Verification Failed</h1>
              <p className="text-sm text-slate-400">{message}</p>
              <Link to="/auth/login" className="block pt-2">
                <Button variant="secondary" fullWidth>
                  Return to Login
                </Button>
              </Link>
            </>
          )}
        </div>
      </div>
    </>
  )
}
