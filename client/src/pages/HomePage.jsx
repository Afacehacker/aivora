import { useEffect, useState, lazy, Suspense } from 'react'
import SEO from '../components/common/SEO'
import HeroSection from '../components/home/HeroSection'
import FeaturedCourses from '../components/home/FeaturedCourses'
import settingsService from '../services/settingsService'

// Lazy-load below-the-fold sections for ultra-fast mobile first paint and reduced initial JS bundle
const WhatYouCanCreate = lazy(() => import('../components/home/WhatYouCanCreate'))
const WhyAivora = lazy(() => import('../components/home/WhyAivora'))
const BeforeAfterShowcase = lazy(() => import('../components/home/BeforeAfterShowcase'))
const HowItWorks = lazy(() => import('../components/home/HowItWorks'))
const Testimonials = lazy(() => import('../components/home/Testimonials'))
const FAQSection = lazy(() => import('../components/home/FAQSection'))
const FinalCTA = lazy(() => import('../components/home/FinalCTA'))

export default function HomePage() {
  const [settings, setSettings] = useState(null)

  useEffect(() => {
    let isMounted = true
    settingsService
      .getSiteSettings()
      .then((res) => {
        if (isMounted && res?.data) setSettings(res.data)
      })
      .catch(() => {})
    return () => {
      isMounted = false
    }
  }, [])

  return (
    <>
      <SEO
        title={settings?.seoSettings?.homeTitle || 'AIVORA — Your Imagination. Powered by AI.'}
        description={
          settings?.seoSettings?.homeDescription ||
          'Master AI video creation, digital characters, realistic voice cloning, and cinematic storytelling with AIVORA.'
        }
      />

      {settings?.announcementBanner?.isActive && settings?.announcementBanner?.text && (
        <div
          className="pt-20 pb-2 px-4 text-center text-xs sm:text-sm font-semibold text-white"
          style={{ backgroundColor: settings.announcementBanner.color || '#6366f1' }}
        >
          {settings.announcementBanner.text}
        </div>
      )}

      <HeroSection settings={settings} />
      <FeaturedCourses />

      <Suspense fallback={null}>
        <WhatYouCanCreate />
        <WhyAivora />
        <BeforeAfterShowcase />
        <HowItWorks />
        <Testimonials testimonials={settings?.testimonials || []} />
        <FAQSection faqs={settings?.faqs || []} />
        <FinalCTA />
      </Suspense>
    </>
  )
}
