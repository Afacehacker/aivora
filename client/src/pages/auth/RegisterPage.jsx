import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { User, Mail, Lock, Sparkles, ArrowRight, Eye, EyeOff } from 'lucide-react'
import toast from 'react-hot-toast'
import SEO from '../../components/common/SEO'
import Input from '../../components/ui/Input'
import Button from '../../components/ui/Button'
import authService from '../../services/authService'
import useAuthStore from '../../store/authStore'

const registerSchema = z
  .object({
    name: z.string().min(2, 'Full name must be at least 2 characters'),
    email: z.string().email('Please enter a valid email address'),
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
        'Password must include uppercase, lowercase, and a number'
      ),
    confirmPassword: z.string().min(1, 'Please confirm your password'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  })

export default function RegisterPage() {
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const { login } = useAuthStore()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(registerSchema),
  })

  const onSubmit = async (values) => {
    setLoading(true)
    try {
      const res = await authService.register({
        name: values.name,
        email: values.email,
        password: values.password,
      })
      const { user, token } = res.data
      login(user, token)
      toast.success('Account created! Welcome to AIVORA.')
      navigate('/dashboard')
    } catch (err) {
      toast.error(err.message || 'Registration failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <SEO title="Create Account — AIVORA" />
      <div className="min-h-screen bg-aivora-dark grid grid-cols-1 lg:grid-cols-12">
        {/* Left Brand Panel */}
        <div className="hidden lg:flex lg:col-span-6 relative overflow-hidden bg-hero-gradient p-12 flex-col justify-between border-r border-white/5">
          <div className="absolute -top-24 -left-24 w-96 h-96 bg-aivora-indigo/25 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-aivora-purple/25 rounded-full blur-3xl pointer-events-none" />

          <Link to="/" className="flex items-center gap-2 relative z-10">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-aivora-indigo to-aivora-purple flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <span className="text-2xl font-display font-black gradient-text">AIVORA</span>
          </Link>

          <div className="relative z-10 max-w-md space-y-6">
            <h2 className="text-4xl font-display font-black text-white leading-tight">
              Start Creating With <span className="gradient-text">Modern AI Tools.</span>
            </h2>
            <p className="text-slate-300 text-base leading-relaxed">
              Join creators, filmmakers, and entrepreneurs learning AI video production, character creation, and realistic voice synthesis.
            </p>
          </div>

          <p className="text-xs text-slate-500 relative z-10">
            © {new Date().getFullYear()} AIVORA. All rights reserved.
          </p>
        </div>

        {/* Right Form Panel */}
        <div className="lg:col-span-6 flex items-center justify-center p-6 sm:p-12">
          <div className="max-w-md w-full space-y-7">
            <div className="text-center lg:text-left">
              <Link to="/" className="inline-flex lg:hidden items-center gap-2 mb-6">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-aivora-indigo to-aivora-purple flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-white" />
                </div>
                <span className="text-xl font-display font-black gradient-text">AIVORA</span>
              </Link>
              <h1 className="text-2xl sm:text-3xl font-display font-black text-white">
                Create Your Account
              </h1>
              <p className="text-sm text-slate-400 mt-1">
                Get instant access to AIVORA courses and student dashboard.
              </p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <Input
                label="Full Name"
                placeholder="Adaobi Okafor"
                icon={User}
                error={errors.name?.message}
                {...register('name')}
              />

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
                  placeholder="Min. 8 chars (Upper, lower, number)"
                  icon={Lock}
                  error={errors.password?.message}
                  {...register('password')}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-9 text-slate-400 hover:text-white"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              <Input
                label="Confirm Password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Re-enter your password"
                icon={Lock}
                error={errors.confirmPassword?.message}
                {...register('confirmPassword')}
              />

              <Button
                type="submit"
                fullWidth
                size="lg"
                loading={loading}
                iconRight={<ArrowRight className="w-4 h-4" />}
              >
                Create Account
              </Button>
            </form>

            <p className="text-center text-sm text-slate-400">
              Already have an account?{' '}
              <Link to="/auth/login" className="text-aivora-indigo font-semibold hover:underline">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </>
  )
}
