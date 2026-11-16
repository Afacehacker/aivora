import { Link } from 'react-router-dom'
import { Home, BookOpen, Sparkles } from 'lucide-react'
import SEO from '../components/common/SEO'
import Button from '../components/ui/Button'

export default function NotFoundPage() {
  return (
    <>
      <SEO title="Page Not Found — AIVORA" />
      <div className="min-h-screen bg-[#fff5f7] flex items-center justify-center px-4">
        <div className="max-w-lg w-full text-center space-y-6 bg-white rounded-3xl p-8 sm:p-12 border border-pink-100 shadow-xl">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-pink-500 to-rose-500 flex items-center justify-center mx-auto shadow-sm">
            <Sparkles className="w-7 h-7 text-white" />
          </div>
          <p className="text-6xl sm:text-7xl font-display font-black gradient-text">404</p>
          <h1 className="text-2xl font-display font-bold text-slate-900">Page Not Found</h1>
          <p className="text-sm text-slate-600">
            The page you are looking for might have been moved, renamed, or does not exist.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <Link to="/">
              <Button iconLeft={<Home className="w-4 h-4" />}>Back to Home</Button>
            </Link>
            <Link to="/courses">
              <Button variant="secondary" iconLeft={<BookOpen className="w-4 h-4" />}>
                Browse Courses
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </>
  )
}
