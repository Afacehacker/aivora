import { useState, useEffect } from 'react'
import {
  X,
  ExternalLink,
  Download,
  ZoomIn,
  ZoomOut,
  RotateCw,
  RefreshCw,
  Eye,
  CheckCircle2,
  XCircle,
  FileText,
  AlertCircle,
} from 'lucide-react'
import Button from '../ui/Button'
import { formatPrice } from '../home/CourseCard'
import { getReceiptFallbackUrls } from '../../utils/mediaUrl'

export default function ReceiptViewerModal({
  isOpen,
  onClose,
  receiptUrl,
  payment,
  onApprove,
  onReject,
  isProcessing = false,
}) {
  const [candidateIndex, setCandidateIndex] = useState(0)
  const [candidates, setCandidates] = useState([])
  const [zoom, setZoom] = useState(1)
  const [rotation, setRotation] = useState(0)
  const [loadError, setLoadError] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (receiptUrl) {
      const urls = getReceiptFallbackUrls(receiptUrl)
      setCandidates(urls)
      setCandidateIndex(0)
      setZoom(1)
      setRotation(0)
      setLoadError(false)
      setIsLoading(true)
    }
  }, [receiptUrl])

  if (!isOpen || !receiptUrl) return null

  const activeSrc = candidates[candidateIndex] || receiptUrl
  const isPdf = activeSrc.toLowerCase().includes('.pdf') || receiptUrl.toLowerCase().includes('.pdf')

  const handleImageError = () => {
    if (candidateIndex + 1 < candidates.length) {
      setCandidateIndex((prev) => prev + 1)
      setIsLoading(true)
    } else {
      setLoadError(true)
      setIsLoading(false)
    }
  }

  const handleImageLoad = () => {
    setIsLoading(false)
    setLoadError(false)
  }

  const handleZoomIn = () => setZoom((z) => Math.min(z + 0.25, 3))
  const handleZoomOut = () => setZoom((z) => Math.max(z - 0.25, 0.5))
  const handleRotate = () => setRotation((r) => (r + 90) % 360)
  const handleReset = () => {
    setZoom(1)
    setRotation(0)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/85 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-2xl border-2 border-pink-200 w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="px-5 py-4 border-b border-pink-100 flex items-center justify-between bg-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-pink-100 border border-pink-200 flex items-center justify-center text-pink-700">
              <Eye className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-display font-black text-slate-900">
                Payment Transfer Receipt Inspector
              </h3>
              <p className="text-xs text-slate-600 font-medium">
                {payment?.student?.name ? `${payment.student.name} (${payment.student.email})` : 'Student Transfer Proof'}
                {payment?.amount ? ` • ${formatPrice(payment.amount)}` : ''}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <a
              href={activeSrc}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 rounded-xl text-slate-700 hover:text-pink-600 hover:bg-pink-50 transition-colors"
              title="Open full size in new tab"
            >
              <ExternalLink className="w-5 h-5" />
            </a>
            <a
              href={activeSrc}
              download
              className="p-2 rounded-xl text-slate-700 hover:text-pink-600 hover:bg-pink-50 transition-colors"
              title="Download receipt file"
            >
              <Download className="w-5 h-5" />
            </a>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors ml-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Payment Summary Ribbon */}
        {payment && (
          <div className="px-5 py-2.5 bg-pink-50/70 border-b border-pink-100 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-800">
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
              <span><strong>Course:</strong> {payment.course?.title || 'Selected Course'}</span>
              <span><strong>Bank:</strong> {payment.senderBank || payment.metadata?.senderBank || 'Bank Transfer'}</span>
              <span><strong>Sender:</strong> {payment.senderName || payment.metadata?.senderName || '—'}</span>
              <span className="font-mono text-slate-600"><strong>Ref:</strong> {payment.transactionRef}</span>
            </div>
            <div className="font-bold text-slate-900 text-sm">
              {formatPrice(payment.amount)}
            </div>
          </div>
        )}

        {/* Toolbar for Zoom & Rotation */}
        {!isPdf && (
          <div className="px-5 py-2 bg-slate-50 border-b border-slate-200 flex items-center justify-between text-xs text-slate-700">
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={handleZoomIn}
                className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 hover:bg-pink-50 hover:text-pink-600 font-semibold flex items-center gap-1 transition-colors"
                title="Zoom in"
              >
                <ZoomIn className="w-3.5 h-3.5" /> <span>Zoom In</span>
              </button>
              <button
                type="button"
                onClick={handleZoomOut}
                className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 hover:bg-pink-50 hover:text-pink-600 font-semibold flex items-center gap-1 transition-colors"
                title="Zoom out"
              >
                <ZoomOut className="w-3.5 h-3.5" /> <span>Zoom Out</span>
              </button>
              <button
                type="button"
                onClick={handleRotate}
                className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 hover:bg-pink-50 hover:text-pink-600 font-semibold flex items-center gap-1 transition-colors"
                title="Rotate 90 degrees"
              >
                <RotateCw className="w-3.5 h-3.5" /> <span>Rotate</span>
              </button>
              <button
                type="button"
                onClick={handleReset}
                className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 font-semibold text-slate-600 transition-colors"
                title="Reset zoom and rotation"
              >
                <span>Reset ({Math.round(zoom * 100)}%)</span>
              </button>
            </div>

            <span className="text-[11px] text-slate-500 font-medium">
              Click &lsquo;Open Full Size&rsquo; or download if text is small
            </span>
          </div>
        )}

        {/* Receipt Display Canvas */}
        <div className="flex-1 overflow-auto bg-slate-900 p-4 sm:p-6 flex items-center justify-center min-h-[350px] max-h-[60vh] relative select-none">
          {isLoading && !loadError && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900/60 z-10 text-white gap-2">
              <RefreshCw className="w-6 h-6 animate-spin text-pink-500" />
              <span className="text-xs font-semibold">Loading receipt in full resolution...</span>
            </div>
          )}

          {loadError ? (
            <div className="p-8 text-center text-white space-y-3 max-w-md bg-slate-800/80 rounded-2xl border border-white/10">
              <AlertCircle className="w-10 h-10 text-amber-400 mx-auto" />
              <p className="text-sm font-bold text-white">Receipt preview could not be loaded directly</p>
              <p className="text-xs text-slate-300">
                The receipt file may be hosted on external cloud storage or restricted by cross-origin policies.
              </p>
              <div className="pt-2 flex items-center justify-center gap-3">
                <a
                  href={activeSrc}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 rounded-xl bg-pink-600 hover:bg-pink-700 text-white font-bold text-xs inline-flex items-center gap-1.5 shadow-md"
                >
                  <ExternalLink className="w-3.5 h-3.5" /> Open Receipt in New Tab
                </a>
              </div>
            </div>
          ) : isPdf ? (
            <div className="w-full h-full min-h-[450px] flex flex-col items-center justify-center bg-white rounded-xl overflow-hidden p-2">
              <iframe
                src={activeSrc}
                className="w-full h-[450px] rounded-lg border border-slate-200"
                title="PDF Receipt"
              />
            </div>
          ) : (
            <div className="transition-transform duration-200 flex items-center justify-center">
              <img
                src={activeSrc}
                alt="Student Bank Transfer Receipt"
                onLoad={handleImageLoad}
                onError={handleImageError}
                style={{
                  transform: `scale(${zoom}) rotate(${rotation}deg)`,
                  transformOrigin: 'center center',
                  imageRendering: 'auto',
                }}
                className="max-h-[55vh] max-w-full object-contain rounded-lg shadow-2xl bg-white border border-white/20 transition-all"
              />
            </div>
          )}
        </div>

        {/* Modal Footer with Direct Decision Buttons */}
        <div className="px-5 py-4 border-t border-pink-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white">
          <div className="text-xs text-slate-600">
            Verify that student name and transfer amount match before approving.
          </div>

          <div className="flex items-center justify-end gap-2.5">
            <Button variant="secondary" size="sm" onClick={onClose}>
              Close Preview
            </Button>

            {onReject && payment?.status === 'pending' && (
              <button
                type="button"
                disabled={isProcessing}
                onClick={() => onReject(payment._id)}
                className="px-4 py-2 rounded-xl bg-red-50 hover:bg-red-100 border border-red-300 text-xs font-bold text-red-600 transition-colors inline-flex items-center gap-1.5 disabled:opacity-50"
              >
                <XCircle className="w-4 h-4" /> Reject Payment
              </button>
            )}

            {onApprove && payment?.status !== 'success' && (
              <button
                type="button"
                disabled={isProcessing}
                onClick={() => onApprove(payment._id)}
                className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-xs font-bold text-white shadow-md transition-colors inline-flex items-center gap-2 disabled:opacity-50"
              >
                <CheckCircle2 className="w-4 h-4" /> Approve &amp; Unlock Course
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
