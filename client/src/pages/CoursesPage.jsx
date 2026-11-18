import { useState, useEffect } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { Search, SlidersHorizontal, BookOpen, X } from 'lucide-react'
import SEO from '../components/common/SEO'
import CourseCard from '../components/home/CourseCard'
import { SkeletonCard } from '../components/ui/Skeleton'
import Pagination from '../components/ui/Pagination'
import Modal from '../components/ui/Modal'
import Button from '../components/ui/Button'
import useDebounce from '../hooks/useDebounce'
import courseService from '../services/courseService'
import CourseMediaPreview, { normalizeMediaUrl } from '../components/common/CourseMediaPreview'

const levels = [
  { value: '', label: 'All Levels' },
  { value: 'beginner', label: 'Beginner' },
  { value: 'intermediate', label: 'Intermediate' },
  { value: 'advanced', label: 'Advanced' },
]

const sortOptions = [
  { value: '-createdAt', label: 'Newest First' },
  { value: 'price', label: 'Price: Low to High' },
  { value: '-price', label: 'Price: High to Low' },
  { value: '-rating.avg', label: 'Highest Rated' },
]

export default function CoursesPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const initialCategory = searchParams.get('category') || ''

  const [search, setSearch] = useState('')
  const debouncedSearch = useDebounce(search, 400)
  const [selectedCategory, setSelectedCategory] = useState(initialCategory)
  const [selectedLevel, setSelectedLevel] = useState('')
  const [sort, setSort] = useState('-createdAt')
  const [page, setPage] = useState(1)

  const [categories, setCategories] = useState([])
  const [courses, setCourses] = useState([])
  const [pagination, setPagination] = useState({ total: 0, pages: 1, page: 1 })
  const [loading, setLoading] = useState(true)
  const [previewCourse, setPreviewCourse] = useState(null)

  useEffect(() => {
    courseService
      .getCategories()
      .then((res) => setCategories(res?.data || []))
      .catch(() => {})
  }, [])

  useEffect(() => {
    let isMounted = true
    const loadCourses = async () => {
      setLoading(true)
      try {
        const params = {
          page,
          limit: 9,
          sort,
        }
        if (debouncedSearch) params.search = debouncedSearch
        if (selectedCategory) params.category = selectedCategory
        if (selectedLevel) params.level = selectedLevel

        const res = await courseService.getAllCourses(params)
        if (isMounted) {
          setCourses(res?.data || [])
          setPagination(res?.pagination || { total: 0, pages: 1, page: 1 })
        }
      } catch {
        if (isMounted) setCourses([])
      } finally {
        if (isMounted) setLoading(false)
      }
    }
    loadCourses()
    return () => {
      isMounted = false
    }
  }, [page, debouncedSearch, selectedCategory, selectedLevel, sort])

  const handleClearFilters = () => {
    setSearch('')
    setSelectedCategory('')
    setSelectedLevel('')
    setSort('-createdAt')
    setPage(1)
    setSearchParams({})
  }

  return (
    <>
      <SEO
        title="Explore AI Courses — AIVORA"
        description="Browse practical courses on AI Video Creation, AI Voice Cloning, Character Transformation, Talking Avatars, and Short Film Production."
        url="/courses"
      />

      <div className="pt-28 pb-24 min-h-screen bg-aivora-dark">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-10">
            <span className="inline-block px-3.5 py-1.5 rounded-full bg-pink-100/70 border border-pink-200 text-xs font-semibold uppercase tracking-wider text-pink-700 mb-3 shadow-sm">
              AIVORA Course Catalog
            </span>
            <h1 className="text-3xl sm:text-5xl font-display font-black text-slate-900 mb-3">
              Master <span className="gradient-text">AI Creative Production</span>
            </h1>
            <p className="text-slate-600 text-base max-w-2xl">
              Step-by-step courses designed to take you from beginner to commercial AI creator.
            </p>
          </div>

          {/* Search & Filter Bar */}
          <div className="bg-white rounded-2xl p-4 sm:p-5 border border-pink-100 shadow-sm mb-8 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
              {/* Search */}
              <div className="md:col-span-5 relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value)
                    setPage(1)
                  }}
                  placeholder="Search courses by title, tool, or topic..."
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-pink-50/50 border border-pink-200 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-pink-500 focus:bg-white"
                />
              </div>

              {/* Category Select */}
              <div className="md:col-span-3">
                <select
                  value={selectedCategory}
                  onChange={(e) => {
                    setSelectedCategory(e.target.value)
                    setPage(1)
                  }}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-pink-50/50 border border-pink-200 text-sm text-slate-800 focus:outline-none focus:border-pink-500 focus:bg-white"
                >
                  <option value="">All Categories</option>
                  {categories.map((cat) => (
                    <option key={cat._id} value={cat.slug}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Level Select */}
              <div className="md:col-span-2">
                <select
                  value={selectedLevel}
                  onChange={(e) => {
                    setSelectedLevel(e.target.value)
                    setPage(1)
                  }}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-pink-50/50 border border-pink-200 text-sm text-slate-800 focus:outline-none focus:border-pink-500 focus:bg-white"
                >
                  {levels.map((l) => (
                    <option key={l.value} value={l.value}>
                      {l.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Sort Select */}
              <div className="md:col-span-2">
                <select
                  value={sort}
                  onChange={(e) => setSort(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-pink-50/50 border border-pink-200 text-sm text-slate-800 focus:outline-none focus:border-pink-500 focus:bg-white"
                >
                  {sortOptions.map((s) => (
                    <option key={s.value} value={s.value}>
                      {s.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {(search || selectedCategory || selectedLevel) && (
              <div className="flex items-center justify-between pt-2 border-t border-pink-100 text-xs text-slate-500">
                <span>Showing {pagination.total || courses.length} matching courses</span>
                <button
                  onClick={handleClearFilters}
                  className="inline-flex items-center gap-1 text-pink-600 hover:underline font-semibold"
                >
                  <X className="w-3.5 h-3.5" /> Clear Filters
                </button>
              </div>
            )}
          </div>

          {/* Course Grid */}
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 6 }).map((_, idx) => (
                <SkeletonCard key={idx} />
              ))}
            </div>
          ) : courses.length > 0 ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {courses.map((course) => (
                  <CourseCard
                    key={course._id}
                    course={course}
                    onPreview={(c) => setPreviewCourse(c)}
                  />
                ))}
              </div>

              {pagination.pages > 1 && (
                <div className="mt-10 flex justify-center">
                  <Pagination
                    currentPage={page}
                    totalPages={pagination.pages}
                    onPageChange={setPage}
                  />
                </div>
              )}
            </>
          ) : (
            <div className="bg-white rounded-2xl p-14 text-center border border-pink-100 shadow-sm max-w-lg mx-auto my-8">
              <BookOpen className="w-12 h-12 text-pink-500 mx-auto mb-4" />
              <h3 className="text-xl font-display font-bold text-slate-900 mb-2">
                No Matching Courses Found
              </h3>
              <p className="text-sm text-slate-600 mb-6">
                Try clearing your search filters to view all available courses.
              </p>
              <Button onClick={handleClearFilters}>Reset All Filters</Button>
            </div>
          )}
        </div>
      </div>

      {/* Preview Modal */}
      <Modal
        isOpen={!!previewCourse}
        onClose={() => setPreviewCourse(null)}
        title={previewCourse?.title || 'Course Preview'}
        maxWidth="max-w-3xl"
      >
        {previewCourse && (
          <div className="space-y-4">
            <div className="rounded-xl overflow-hidden bg-black flex items-center justify-center">
              <CourseMediaPreview
                course={previewCourse}
                className="w-full h-auto max-h-[75vh] object-contain"
                autoPlay={true}
                muted={false}
                loop={true}
                controls={true}
              />
            </div>
            <div className="flex items-center justify-between">
              <p className="text-sm text-slate-700">{previewCourse.shortDescription}</p>
              <Link to={`/courses/${previewCourse.slug}`}>
                <Button size="sm">View Full Details</Button>
              </Link>
            </div>
          </div>
        )}
      </Modal>
    </>
  )
}
