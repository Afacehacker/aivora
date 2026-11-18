import { Routes, Route, Navigate } from 'react-router-dom'
import MainLayout from './layouts/MainLayout'
import DashboardLayout from './layouts/DashboardLayout'
import AdminLayout from './layouts/AdminLayout'
import ProtectedRoute from './components/common/ProtectedRoute'
import AdminRoute from './components/common/AdminRoute'
import ScrollToTop from './hooks/useScrollTop'

// Public pages (imported directly so route navigation never fails on mobile networks or across deploys)
import HomePage from './pages/HomePage'
import CoursesPage from './pages/CoursesPage'
import CourseDetailPage from './pages/CourseDetailPage'
import ManualPaymentPage from './pages/ManualPaymentPage'
import AboutPage from './pages/AboutPage'
import ContactPage from './pages/ContactPage'
import LegalPage from './pages/LegalPage'
import NotFoundPage from './pages/NotFoundPage'

// Auth pages
import LoginPage from './pages/auth/LoginPage'
import RegisterPage from './pages/auth/RegisterPage'
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage'
import ResetPasswordPage from './pages/auth/ResetPasswordPage'
import VerifyEmailPage from './pages/auth/VerifyEmailPage'

// Student dashboard pages
import DashboardOverview from './pages/dashboard/DashboardOverview'
import MyLearningPage from './pages/dashboard/MyLearningPage'
import CoursePlayerPage from './pages/dashboard/CoursePlayerPage'
import CertificatesPage from './pages/dashboard/CertificatesPage'
import PurchaseHistoryPage from './pages/dashboard/PurchaseHistoryPage'
import AccountSettingsPage from './pages/dashboard/AccountSettingsPage'
import SupportPage from './pages/dashboard/SupportPage'

// Admin pages
import AdminDashboard from './pages/admin/AdminDashboard'
import AdminPaymentApprovals from './pages/admin/AdminPaymentApprovals'
import AdminCourses from './pages/admin/AdminCourses'
import AdminCourseForm from './pages/admin/AdminCourseForm'
import AdminStudents from './pages/admin/AdminStudents'
import AdminOrders from './pages/admin/AdminOrders'
import AdminReviews from './pages/admin/AdminReviews'
import AdminSiteSettings from './pages/admin/AdminSiteSettings'
import AdminSupport from './pages/admin/AdminSupport'
import AdminCoupons from './pages/admin/AdminCoupons'
import AdminCategories from './pages/admin/AdminCategories'

export default function App() {
  return (
    <>
      <ScrollToTop />
      <Routes>
        {/* Public Routes */}
        <Route element={<MainLayout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/courses" element={<CoursesPage />} />
          <Route path="/courses/:slug" element={<CourseDetailPage />} />
          <Route path="/checkout/:slug" element={<ManualPaymentPage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/terms" element={<LegalPage type="terms" />} />
          <Route path="/privacy" element={<LegalPage type="privacy" />} />
          <Route path="/refund" element={<LegalPage type="refund" />} />
          <Route path="/refund-policy" element={<LegalPage type="refund" />} />
          <Route path="/disclaimer" element={<LegalPage type="disclaimer" />} />
        </Route>

        {/* Auth Routes */}
        <Route path="/login" element={<Navigate to="/auth/login" replace />} />
        <Route path="/register" element={<Navigate to="/auth/register" replace />} />
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
            <Route path="/admin/payments" element={<AdminPaymentApprovals />} />
            <Route path="/admin/payment-approvals" element={<AdminPaymentApprovals />} />
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
    </>
  )
}
