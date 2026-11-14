import { useState, useEffect } from 'react'
import { Award, Download, Sparkles, CheckCircle2 } from 'lucide-react'
import SEO from '../../components/common/SEO'
import Button from '../../components/ui/Button'
import EmptyState from '../../components/ui/EmptyState'
import Modal from '../../components/ui/Modal'
import useAuthStore from '../../store/authStore'
import api from '../../services/api'

export default function CertificatesPage() {
  const { user } = useAuthStore()
  const [certificates, setCertificates] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedCert, setSelectedCert] = useState(null)

  useEffect(() => {
    let isMounted = true
    api
      .get('/certificates/my')
      .then((res) => {
        if (isMounted) setCertificates(res?.data || [])
      })
      .catch(() => {})
      .finally(() => {
        if (isMounted) setLoading(false)
      })
    return () => {
      isMounted = false
    }
  }, [])

  return (
    <>
      <SEO title="My Certificates — AIVORA" />

      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-display font-bold text-white">My Certificates</h1>
          <p className="text-sm text-slate-400">
            Official verifiable certificates earned upon 100% course completion.
          </p>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[1, 2].map((i) => (
              <div key={i} className="h-48 rounded-2xl glass animate-pulse" />
            ))}
          </div>
        ) : certificates.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {certificates.map((cert) => (
              <div
                key={cert._id}
                className="glass rounded-2xl p-6 border border-aivora-indigo/30 flex flex-col justify-between space-y-4"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <span className="text-xs font-mono text-aivora-cyan">
                      ID: {cert.certificateId}
                    </span>
                    <h3 className="text-lg font-display font-bold text-white mt-1">
                      {cert.course?.title || 'AIVORA Course'}
                    </h3>
                    <p className="text-xs text-slate-400 mt-1">
                      Issued on {new Date(cert.issuedAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="w-12 h-12 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center flex-shrink-0">
                    <Award className="w-6 h-6 text-amber-400" />
                  </div>
                </div>

                <div className="flex items-center gap-3 pt-2">
                  <Button
                    size="sm"
                    onClick={() => setSelectedCert(cert)}
                    iconLeft={<Download className="w-4 h-4" />}
                  >
                    View & Print Certificate
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState
            icon={Award}
            title="No certificates earned yet"
            description="Complete 100% of the lessons in any enrolled course to unlock your verifiable AIVORA Certificate."
            ctaLabel="Go to My Learning"
            ctaHref="/dashboard/learning"
          />
        )}
      </div>

      {/* Printable Certificate Preview Modal */}
      <Modal
        isOpen={!!selectedCert}
        onClose={() => setSelectedCert(null)}
        title="AIVORA Certificate of Completion"
        maxWidth="max-w-3xl"
      >
        {selectedCert && (
          <div className="space-y-6">
            <div className="p-8 sm:p-12 rounded-2xl bg-gradient-to-br from-aivora-dark via-aivora-navy to-indigo-950 border-2 border-aivora-indigo/50 text-center space-y-5 relative overflow-hidden">
              <div className="inline-flex items-center gap-2 text-aivora-cyan font-display font-black text-xl">
                <Sparkles className="w-5 h-5" />
                AIVORA
              </div>
              <p className="text-xs uppercase tracking-[0.25em] text-slate-400">
                Certificate of Completion
              </p>
              <p className="text-sm text-slate-300">This is to certify that</p>
              <h2 className="text-2xl sm:text-4xl font-display font-black gradient-text">
                {user?.name}
              </h2>
              <p className="text-sm text-slate-300">
                has successfully completed the professional AI curriculum
              </p>
              <h3 className="text-xl sm:text-2xl font-display font-bold text-white">
                &ldquo;{selectedCert.course?.title}&rdquo;
              </h3>
              <div className="pt-6 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-400 border-t border-white/10">
                <span>Certificate ID: {selectedCert.certificateId}</span>
                <span className="flex items-center gap-1 text-emerald-400">
                  <CheckCircle2 className="w-4 h-4" /> Verified by AIVORA
                </span>
                <span>Date: {new Date(selectedCert.issuedAt).toLocaleDateString()}</span>
              </div>
            </div>

            <div className="flex justify-end">
              <Button onClick={() => window.print()} iconLeft={<Download className="w-4 h-4" />}>
                Print / Save as PDF
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </>
  )
}
