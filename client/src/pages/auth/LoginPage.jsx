import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Mail, Lock, Sparkles, ArrowRight, Eye, EyeOff } from 'lucide-react'
import toast from 'react-hot-toast'
import SEO from '../../components/common/SEO'
import Input from '../../components/ui/Input'
import Button from '../../components/ui/Button'
import authService from '../../services/authService'
import useAuthStore from '../../store/authStore'

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
})

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const { login } = useAuthStore()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(loginSchema),
  })

  const onSubmit = async (values) => {
    setLoading(true)
    try {
      const res = await authService.login(values)
      const { user, token } = res.data
      login(user, token)
      toast.success(`Welcome back, ${user.name}!`)
      if (user.role === 'admin') {
        navigate('/admin/dashboard')
      } else {
        navigate('/dashboard')
      }
    } catch (err) {
      toast.error(err.message || 'Invalid email or password')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <SEO title="Login — AIVORA" />
      <div className="min-h-screen bg-[#fff5f7] grid grid-cols-1 lg:grid-cols-12">
        {/* Left Visual Panel */}
        <div className="hidden lg:flex lg:col-span-6 relative overflow-hidden bg-hero-gradient p-12 flex-col justify-between border-r border-pink-100">
          <div className="absolute -top-24 -left-24 w-96 h-96 bg-pink-300/25 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-rose-200/25 rounded-full blur-3xl pointer-events-none" />

          <Link to="/" className="flex items-center gap-2 relative z-10">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-pink-500 to-rose-500 flex items-center justify-center shadow-sm">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <span className="text-2xl font-display font-black gradient-text">AIVORA</span>
          </Link>

          <div className="relative z-10 max-w-md space-y-6">
            <h2 className="text-4xl font-display font-black text-slate-900 leading-tight">
              Your Imagination. <span className="gradient-text">Powered by AI.</span>
            </h2>
            <p className="text-slate-700 text-base leading-relaxed">
              Sign in to access your enrolled AI courses, resume lessons from where you left off, and download project resources.
            </p>
          </div>

          <p className="text-xs text-slate-500 relative z-10">
            © {new Date().getFullYear()} AIVORA. All rights reserved.
          </p>
        </div>

        {/* Right Form Panel */}
        <div className="lg:col-span-6 flex items-center justify-center p-6 sm:p-12">
          <div className="max-w-md w-full space-y-8 bg-white p-8 sm:p-10 rounded-3xl border border-pink-100 shadow-xl">
            <div className="text-center lg:text-left">
              <Link to="/" className="inline-flex lg:hidden items-center gap-2 mb-6">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-pink-500 to-rose-500 flex items-center justify-center shadow-sm">
                  <Sparkles className="w-4 h-4 text-white" />
                </div>
                <span className="text-xl font-display font-black gradient-text">AIVORA</span>
              </Link>
              <h1 className="text-2xl sm:text-3xl font-display font-black text-slate-900">
                Welcome Back
              </h1>
              <p className="text-sm text-slate-600 mt-1">
                Sign in to your AIVORA account to continue learning.
              </p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              <Input
                label="Email Address"
                type="email"
                placeholder="you@example.com"
                icon={Mail}
                error={errors.email?.message}
                {...register('email')}
              />

              <div className="relative">
                <Input
                  label="Password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  icon={Lock}
                  error={errors.password?.message}
                  {...register('password')}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-9 text-slate-400 hover:text-slate-700"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              <div className="flex items-center justify-between text-xs">
                <label className="flex items-center gap-2 text-slate-600 cursor-pointer">
                  <input
                    type="checkbox"
                    className="rounded border-pink-300 text-pink-600 focus:ring-pink-500/20"
                  />
                  <span>Remember me</span>
                </label>
                <Link
                  to="/auth/forgot-password"
                  className="text-pink-600 hover:underline font-medium"
                >
                  Forgot password?
                </Link>
              </div>

              <Button
                type="submit"
                fullWidth
                size="lg"
                loading={loading}
                iconRight={<ArrowRight className="w-4 h-4" />}
              >
                Sign In
              </Button>
            </form>

            <p className="text-center text-sm text-slate-600">
              Don&apos;t have an account?{' '}
              <Link to="/auth/register" className="text-pink-600 font-semibold hover:underline">
                Create an account
              </Link>
            </p>
          </div>
        </div>
      </div>
    </>
  )
}
