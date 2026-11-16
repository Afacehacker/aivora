import { Link, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  ShieldCheck,
  FileText,
  Lock,
  RotateCcw,
  AlertTriangle,
  Sparkles,
  Mail,
  CheckCircle2,
} from 'lucide-react'
import SEO from '../components/common/SEO'

const LEGAL_SECTIONS = {
  terms: {
    key: 'terms',
    title: 'Terms of Service',
    subtitle:
      'Please read these Terms of Service carefully before accessing or enrolling in courses on the AIVORA platform.',
    lastUpdated: 'January 15, 2026',
    icon: FileText,
    path: '/terms',
    sections: [
      {
        heading: '1. Acceptance of Terms',
        body: [
          'By creating an account, browsing, purchasing, or accessing any educational courses, tutorials, downloadable prompts, project templates, or community features on AIVORA ("Platform", "we", "our", or "us"), you agree to be bound by these Terms of Service and all applicable laws and regulations.',
          'If you do not agree with any part of these Terms, you may not access or use the AIVORA platform or its educational materials.',
        ],
      },
      {
        heading: '2. Educational License & Intellectual Property Rights',
        body: [
          'All course videos, structured curricula, prompt libraries, workflow blueprints, audio assets, text lessons, graphics, and platform code on AIVORA are owned by AIVORA and its instructors and are protected by international copyright, trademark, and intellectual property laws.',
          'Upon purchasing a course, AIVORA grants you a personal, non-exclusive, non-transferable, revocable license to stream and view the course content and download included study resources solely for your own personal or professional skill development.',
          'You are strictly prohibited from recording, redistributing, reselling, sharing account credentials, uploading course videos to third-party websites, or bundling AIVORA instructional materials into competing products.',
        ],
      },
      {
        heading: '3. Ethical & Consent-Based AI Usage Policy',
        body: [
          'AIVORA teaches modern creative workflows including AI video generation, character transformation, digital avatars, and voice cloning. You agree to apply all techniques learned on AIVORA strictly in compliance with ethical standards and applicable laws.',
          'You must obtain explicit, verifiable consent before using any real individual’s voice, facial likeness, or biometric identity in AI voice cloning, character transformation, or talking avatar pipelines.',
          'You may not use AIVORA resources, templates, or community spaces to create non-consensual deepfakes, defamatory media, fraudulent impersonations, deceptive political content, or unlawful material. Violation of this policy results in immediate permanent account termination without refund.',
        ],
      },
      {
        heading: '4. User Accounts & Security',
        body: [
          'You are responsible for maintaining the confidentiality of your login credentials and for all activities that occur under your account. Each account is licensed to a single individual student.',
          'Automated scraping, simultaneous multi-region account sharing, or unauthorized attempts to bypass AIVORA video streaming controls will trigger automatic account suspension.',
        ],
      },
      {
        heading: '5. Payments, Pricing & Taxes',
        body: [
          'Course prices are displayed on the platform and processed securely via Paystack or authorized payment partners. Promotional discounts and coupon codes apply only at the time of checkout and cannot be retroactively applied to completed orders.',
          'Once payment is verified via cryptographic webhook confirmation, your course enrollment is activated immediately inside your Student Dashboard.',
        ],
      },
      {
        heading: '6. Certificates of Completion',
        body: [
          'AIVORA issues verifiable digital Certificates of Completion when a student completes 100% of required lessons in an enrolled course. Certificates represent completion of practical training on AIVORA and do not constitute formal university accreditation.',
        ],
      },
    ],
  },
  privacy: {
    key: 'privacy',
    title: 'Privacy Policy',
    subtitle:
      'How AIVORA collects, protects, and processes your personal information across our learning platform.',
    lastUpdated: 'January 15, 2026',
    icon: Lock,
    path: '/privacy',
    sections: [
      {
        heading: '1. Information We Collect',
        body: [
          'Account Information: When you register on AIVORA, we collect your full name, email address, encrypted password hash, optional profile biography, and avatar image.',
          'Enrollment & Learning Data: We record your course enrollments, lesson completion progress, watch history, submitted reviews, support tickets, and issued certificate verification codes.',
          'Payment Metadata: Payments are processed directly by PCI-DSS compliant payment gateways (such as Paystack). AIVORA stores transaction references, order amounts, and payment statuses, but never stores raw credit/debit card numbers or bank CVV codes.',
        ],
      },
      {
        heading: '2. How We Use Your Information',
        body: [
          'To authenticate your identity, deliver purchased courses, synchronize lesson progress across devices, and generate verifiable completion certificates.',
          'To send essential transactional emails including email verification links, payment receipts, password reset tokens, and support ticket updates.',
          'To improve curriculum quality, platform performance, and student learning outcomes using aggregated, anonymized analytics.',
        ],
      },
      {
        heading: '3. Data Protection & Security Measures',
        body: [
          'We implement industry-standard security controls including bcrypt password hashing, JWT authentication with strict expiration, HTTPS TLS encryption in transit, MongoDB query sanitization, and rate limiting against brute-force attacks.',
          'Media uploads are securely hosted and delivered via Cloudinary content delivery networks with strict access controls.',
        ],
      },
      {
        heading: '4. Third-Party Service Providers',
        body: [
          'We only share minimum necessary operational data with trusted infrastructure providers required to run AIVORA: Paystack (payment processing), Cloudinary (media delivery), MongoDB Atlas (database hosting), and SMTP providers (transactional email delivery).',
          'We never sell, rent, or trade your personal data or email address to third-party advertisers or data brokers.',
        ],
      },
      {
        heading: '5. Your Privacy Rights',
        body: [
          'You have the right to access, update, or correct your profile information at any time via your Account Settings page.',
          'You may request an export of your personal learning data or request account deletion by contacting support@aivora.com, subject to mandatory financial transaction retention laws.',
        ],
      },
    ],
  },
  refund: {
    key: 'refund',
    title: 'Refund Policy',
    subtitle:
      'Transparent, fair guidelines governing course purchases and refund eligibility on AIVORA.',
    lastUpdated: 'January 15, 2026',
    icon: RotateCcw,
    path: '/refund',
    sections: [
      {
        heading: '1. 7-Day Satisfaction Guarantee',
        body: [
          'We want every student to have a transformative learning experience on AIVORA. Eligible course purchases are covered by a 7-day refund window starting from the date of the original transaction.',
          'To qualify for a refund, the request must be submitted within 7 calendar days of purchase AND you must have watched or completed less than 25% of the total course lessons and not downloaded the course project/prompt bundle or generated a Certificate of Completion.',
        ],
      },
      {
        heading: '2. Non-Refundable Circumstances',
        body: [
          'Refund requests will not be approved if: (a) more than 7 calendar days have elapsed since purchase; (b) more than 25% of the course content has been accessed or streamed; (c) downloadable prompt libraries, project files, or certificates have been claimed; or (d) the account was suspended for violating our Terms of Service or Ethical AI Policy.',
        ],
      },
      {
        heading: '3. Duplicate Charges & Technical Issues',
        body: [
          'If you experience an accidental duplicate charge from our payment processor or a verified technical failure that prevents you from accessing a purchased course, we will issue a full 100% refund or immediate account credit upon verification.',
        ],
      },
      {
        heading: '4. How to Request a Refund',
        body: [
          'To request a refund, open a ticket in your Student Support Dashboard or email support@aivora.com with your registered email address, order reference number, and a brief explanation of your request.',
          'Approved refunds are processed back to the original payment method via Paystack within 5 to 10 business days, depending on your financial institution.',
        ],
      },
    ],
  },
  disclaimer: {
    key: 'disclaimer',
    title: 'Platform & AI Disclaimer',
    subtitle:
      'Important disclosures regarding third-party AI tools, creative outcomes, and responsible media production.',
    lastUpdated: 'January 15, 2026',
    icon: AlertTriangle,
    path: '/disclaimer',
    sections: [
      {
        heading: '1. Educational Purpose Only',
        body: [
          'All courses, workshops, guides, and resources provided on AIVORA are strictly for educational and informational purposes. While we teach commercial workflows for AI filmmaking, content creation, and social media monetization, AIVORA makes no guarantees regarding specific financial earnings, client acquisition, or social media growth.',
        ],
      },
      {
        heading: '2. Third-Party AI Software & Platforms',
        body: [
          'Our courses demonstrate workflows using various third-party generative AI tools (including video generators, voice synthesis engines, LLM platforms, and image diffusion models). AIVORA is an independent education platform and is not endorsed by or affiliated with those third-party software vendors unless explicitly stated.',
          'Third-party AI tools may update their user interfaces, pricing tiers, credit systems, or commercial licensing terms at any time. Students are responsible for reviewing the terms of service of any external AI software they use.',
        ],
      },
      {
        heading: '3. Likeness, Voice & Copyright Responsibility',
        body: [
          'AIVORA teaches character transformation and voice replication solely for authorized creative storytelling, original fictional characters, self-cloning, and consented client productions.',
          'You bear sole legal responsibility for ensuring that all input images, reference audio, scripts, and generated outputs you produce comply with copyright laws, right-of-publicity statutes, and platform disclosure rules in your jurisdiction.',
        ],
      },
    ],
  },
}

const NAV_TABS = [
  { key: 'terms', label: 'Terms of Service', path: '/terms', icon: FileText },
  { key: 'privacy', label: 'Privacy Policy', path: '/privacy', icon: Lock },
  { key: 'refund', label: 'Refund Policy', path: '/refund', icon: RotateCcw },
  { key: 'disclaimer', label: 'AI Disclaimer', path: '/disclaimer', icon: AlertTriangle },
]

export default function LegalPage({ type }) {
  const { pathname } = useLocation()

  const resolvedKey = (() => {
    if (type && LEGAL_SECTIONS[type]) return type
    if (pathname.includes('privacy')) return 'privacy'
    if (pathname.includes('refund')) return 'refund'
    if (pathname.includes('disclaimer')) return 'disclaimer'
    return 'terms'
  })()

  const activeDoc = LEGAL_SECTIONS[resolvedKey]
  const ActiveIcon = activeDoc.icon

  return (
    <>
      <SEO
        title={`${activeDoc.title} — AIVORA`}
        description={activeDoc.subtitle}
        url={activeDoc.path}
      />

      <div className="pt-28 pb-24 bg-[#fff5f7] min-h-screen">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          {/* Header */}
          <div className="text-center max-w-3xl mx-auto space-y-4">
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-pink-100/70 border border-pink-200 text-xs font-semibold uppercase tracking-wider text-pink-700 shadow-sm">
              <Sparkles className="w-3.5 h-3.5" />
              AIVORA Legal & Compliance Center
            </span>
            <h1 className="text-3xl sm:text-5xl font-display font-black text-slate-900">
              {activeDoc.title}
            </h1>
            <p className="text-slate-600 text-sm sm:text-base leading-relaxed">
              {activeDoc.subtitle}
            </p>
            <p className="text-xs text-slate-500">
              Last Updated: <span className="text-slate-700 font-medium">{activeDoc.lastUpdated}</span>
            </p>
          </div>

          {/* Navigation Tabs */}
          <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3">
            {NAV_TABS.map((tab) => {
              const TabIcon = tab.icon
              const isActive = tab.key === resolvedKey
              return (
                <Link
                  key={tab.key}
                  to={tab.path}
                  className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all border shadow-sm ${
                    isActive
                      ? 'bg-gradient-to-r from-pink-500 to-rose-500 text-white border-transparent'
                      : 'bg-white border-pink-200 text-slate-700 hover:text-pink-600 hover:border-pink-300'
                  }`}
                >
                  <TabIcon className="w-4 h-4" />
                  {tab.label}
                </Link>
              )
            })}
          </div>

          {/* Ethical AI Highlight Banner */}
          <div className="rounded-2xl bg-white border border-pink-100 p-5 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center gap-4 shadow-sm">
            <div className="w-11 h-11 rounded-xl bg-pink-50 border border-pink-200 flex items-center justify-center text-pink-600 shrink-0">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h2 className="text-sm sm:text-base font-semibold text-slate-900 flex items-center gap-2">
                Commitment to Responsible & Consented AI Education
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                AIVORA strictly requires explicit consent for any real-person likeness or voice synthesis workflow and prohibits deceptive or non-consensual synthetic media across all courses and student projects.
              </p>
            </div>
          </div>

          {/* Main Document Body */}
          <motion.div
            key={activeDoc.key}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25 }}
            className="rounded-3xl bg-white border border-pink-100 p-6 sm:p-10 space-y-8 shadow-sm"
          >
            <div className="flex items-center gap-3 pb-6 border-b border-pink-100">
              <div className="w-10 h-10 rounded-xl bg-pink-50 border border-pink-200 flex items-center justify-center text-pink-600">
                <ActiveIcon className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg sm:text-xl font-display font-bold text-slate-900">
                  {activeDoc.title}
                </h2>
                <p className="text-xs text-slate-500">
                  Official policy governing AIVORA courses, accounts, and creative AI tools
                </p>
              </div>
            </div>

            <div className="space-y-8">
              {activeDoc.sections.map((section) => (
                <section key={section.heading} className="space-y-3">
                  <h3 className="text-base sm:text-lg font-display font-bold text-slate-900">
                    {section.heading}
                  </h3>
                  <div className="space-y-3">
                    {section.body.map((paragraph, idx) => (
                      <p
                        key={idx}
                        className="text-sm sm:text-base text-slate-700 leading-relaxed"
                      >
                        {paragraph}
                      </p>
                    ))}
                  </div>
                </section>
              ))}
            </div>

            {/* Footer Contact Box */}
            <div className="pt-6 border-t border-pink-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <p className="text-sm font-semibold text-slate-900">
                  Have questions about our legal terms or ethical AI policies?
                </p>
                <p className="text-xs text-slate-500">
                  Our compliance and student support team responds within 24 business hours.
                </p>
              </div>
              <Link
                to="/contact"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-pink-50 hover:bg-pink-100 border border-pink-200 text-xs sm:text-sm font-semibold text-pink-700 transition-colors self-start sm:self-auto"
              >
                <Mail className="w-4 h-4 text-pink-600" />
                Contact Legal & Support
              </Link>
            </div>
          </motion.div>
        </div>
      </div>
    </>
  )
}
