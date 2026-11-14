import { Suspense, lazy } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import MainLayout from './layouts/MainLayout'
import DashboardLayout from './layouts/DashboardLayout'
import AdminLayout from './layouts/AdminLayout'
import ProtectedRoute from './components/common/ProtectedRoute'
import AdminRoute from './components/common/AdminRoute'
import PageLoader from './components/common/PageLoader'
import ScrollToTop from './hooks/useScrollTop'

// Public pages
const HomePage = lazy(() => import('./pages/HomePage'))
const CoursesPage = lazy(() => import('./pages/CoursesPage'))
const CourseDetailPage = lazy(() => import('./pages/CourseDetailPage'))
const AboutPage = lazy(() => import('./pages/AboutPage'))
const ContactPage = lazy(() => import('./pages/ContactPage'))
const LegalPage = lazy(() => import('./pages/LegalPage'))
const NotFoundPage = lazy(() => import('./pages/NotFoundPage'))

// Auth pages
const LoginPage = lazy(() => import('./pages/auth/LoginPage'))
const RegisterPage = lazy(() => import('./pages/auth/RegisterPage'))
const ForgotPasswordPage = lazy(() => import('./pages/auth/ForgotPasswordPage'))
const ResetPasswordPage = lazy(() => import('./pages/auth/ResetPasswordPage'))
const VerifyEmailPage = lazy(() => import('./pages/auth/VerifyEmailPage'))

// Student dashboard pages
const DashboardOverview = lazy(() => import('./pages/dashboard/DashboardOverview'))
const MyLearningPage = lazy(() => import('./pages/dashboard/MyLearningPage'))
const CoursePlayerPage = lazy(() => import('./pages/dashboard/CoursePlayerPage'))
const CertificatesPage = lazy(() => import('./pages/dashboard/CertificatesPage'))
const PurchaseHistoryPage = lazy(() => import('./pages/dashboard/PurchaseHistoryPage'))
const AccountSettingsPage = lazy(() => import('./pages/dashboard/AccountSettingsPage'))
const SupportPage = lazy(() => import('./pages/dashboard/SupportPage'))

// Admin pages
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard'))
const AdminCourses = lazy(() => import('./pages/admin/AdminCourses'))
const AdminCourseForm = lazy(() => import('./pages/admin/AdminCourseForm'))
const AdminStudents = lazy(() => import('./pages/admin/AdminStudents'))
const AdminOrders = lazy(() => import('./pages/admin/AdminOrders'))
const AdminReviews = lazy(() => import('./pages/admin/AdminReviews'))
const AdminSiteSettings = lazy(() => import('./pages/admin/AdminSiteSettings'))
const AdminSupport = lazy(() => import('./pages/admin/AdminSupport'))
const AdminCoupons = lazy(() => import('./pages/admin/AdminCoupons'))
const AdminCategories = lazy(() => import('./pages/admin/AdminCategories'))

export default function App() {
  return (
    <>
      <ScrollToTop />
      <Suspense fallback={<PageLoader />}>
        <Routes>
          {/* Public Routes */}
          <Route element={<MainLayout />}>
            <Route path="/" element={<HomePage />} />
            <Route path="/courses" element={<CoursesPage />} />
            <Route path="/courses/:slug" element={<CourseDetailPage />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/contact" element={<ContactPage />} />
            <Route path="/terms" element={<LegalPage type="terms" />} />
            <Route path="/privacy" element={<LegalPage type="privacy" />} />
            <Route path="/refund" element={<LegalPage type="refund" />} />
            <Route path="/refund-policy" element={<LegalPage type="refund" />} />
            <Route path="/disclaimer" element={<LegalPage type="disclaimer" />} />
          </Route>

          {/* Auth Routes */}
          <Route path="/auth/login" element={<LoginPage />} />
          <Route path="/auth/register" element={<RegisterPage />} />
          <Route path="/auth/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/auth/reset-password/:token" element={<ResetPasswordPage />} />
          <Route path="/auth/verify-email/:token" element={<VerifyEmailPage />} />

          {/* Student Dashboard Routes */}
          <Route element={<ProtectedRoute />}>
            <Route element={<DashboardLayout />}>
              <Route path="/dashboard" element={<DashboardOverview />} />
              <Route path="/dashboard/learning" element={<MyLearningPage />} />
              <Route path="/dashboard/certificates" element={<CertificatesPage />} />
              <Route path="/dashboard/purchases" element={<PurchaseHistoryPage />} />
              <Route path="/dashboard/settings" element={<AccountSettingsPage />} />
              <Route path="/dashboard/support" element={<SupportPage />} />
            </Route>
            <Route path="/dashboard/learn/:courseId/:lessonId?" element={<CoursePlayerPage />} />
          </Route>

          {/* Admin Routes */}
          <Route element={<AdminRoute />}>
            <Route element={<AdminLayout />}>
              <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
              <Route path="/admin/dashboard" element={<AdminDashboard />} />
              <Route path="/admin/courses" element={<AdminCourses />} />
              <Route path="/admin/courses/create" element={<AdminCourseForm />} />
              <Route path="/admin/courses/:id/edit" element={<AdminCourseForm />} />
              <Route path="/admin/students" element={<AdminStudents />} />
              <Route path="/admin/orders" element={<AdminOrders />} />
              <Route path="/admin/reviews" element={<AdminReviews />} />
              <Route path="/admin/settings" element={<AdminSiteSettings />} />
              <Route path="/admin/support" element={<AdminSupport />} />
              <Route path="/admin/coupons" element={<AdminCoupons />} />
              <Route path="/admin/categories" element={<AdminCategories />} />
            </Route>
          </Route>

          {/* 404 */}
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </Suspense>
    </>
  )
}
