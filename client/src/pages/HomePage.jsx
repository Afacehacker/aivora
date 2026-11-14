import { useEffect, useState } from 'react'
import SEO from '../components/common/SEO'
import HeroSection from '../components/home/HeroSection'
import WhatYouCanCreate from '../components/home/WhatYouCanCreate'
import FeaturedCourses from '../components/home/FeaturedCourses'
import WhyAivora from '../components/home/WhyAivora'
import BeforeAfterShowcase from '../components/home/BeforeAfterShowcase'
import HowItWorks from '../components/home/HowItWorks'
import Testimonials from '../components/home/Testimonials'
import FAQSection from '../components/home/FAQSection'
import FinalCTA from '../components/home/FinalCTA'
import settingsService from '../services/settingsService'

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
      <WhatYouCanCreate />
      <WhyAivora />
      <BeforeAfterShowcase />
      <HowItWorks />
      <Testimonials testimonials={settings?.testimonials || []} />
      <FAQSection faqs={settings?.faqs || []} />
      <FinalCTA />
    </>
  )
}
