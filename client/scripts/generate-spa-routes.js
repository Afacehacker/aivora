import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const distDir = path.resolve(__dirname, '../dist')
const indexHtmlPath = path.join(distDir, 'index.html')
const serverSpaHtmlPath = path.resolve(__dirname, '../../server/src/spa-index.html')

const knownRoutes = [
  'auth/login',
  'auth/register',
  'auth/forgot-password',
  'login',
  'register',
  'courses',
  'about',
  'contact',
  'terms',
  'privacy',
  'refund',
  'refund-policy',
  'disclaimer',
  'dashboard',
  'dashboard/learning',
  'dashboard/certificates',
  'dashboard/purchases',
  'dashboard/settings',
  'dashboard/support',
  'admin',
  'admin/dashboard',
  'admin/courses',
  'admin/courses/create',
  'admin/students',
  'admin/orders',
  'admin/reviews',
  'admin/settings',
  'admin/support',
  'admin/coupons',
  'admin/categories',
]

if (fs.existsSync(indexHtmlPath)) {
  const indexHtml = fs.readFileSync(indexHtmlPath, 'utf-8')

  // Create root-level 404.html, 200.html, and _redirects
  fs.writeFileSync(path.join(distDir, '404.html'), indexHtml)
  fs.writeFileSync(path.join(distDir, '200.html'), indexHtml)
  fs.writeFileSync(path.join(distDir, '_redirects'), '/* /index.html 200\n')

  // Write vercel.json in distDir with safe rewrites that protect media files from being served as index.html
  const vercelConfig = {
    rewrites: [
      {
        source: '/((?!uploads/|api/|assets/|.*\\.(?:mp4|webm|mov|mkv|avi|png|jpg|jpeg|webp|gif|svg|css|js|json|xml|txt|ico)).*)',
        destination: '/index.html',
      },
    ],
    headers: [
      {
        source: '/uploads/(.*)',
        headers: [
          { key: 'Accept-Ranges', value: 'bytes' },
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'Cross-Origin-Resource-Policy', value: 'cross-origin' },
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
        ],
      },
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
        ],
      },
    ],
  }
  fs.writeFileSync(path.join(distDir, 'vercel.json'), JSON.stringify(vercelConfig, null, 2))

  // Pre-generate deterministic route folders with index.html for direct navigation & reload immunity
  for (const route of knownRoutes) {
    const routeDir = path.join(distDir, route)
    if (!fs.existsSync(routeDir)) {
      fs.mkdirSync(routeDir, { recursive: true })
    }
    fs.writeFileSync(path.join(routeDir, 'index.html'), indexHtml)
  }

  // Also sync index.html and assets into server/src so Express can serve them for SPA route reloads
  try {
    fs.writeFileSync(serverSpaHtmlPath, indexHtml)
    const serverAssetsDir = path.resolve(__dirname, '../../server/src/assets')
    const distAssetsDir = path.join(distDir, 'assets')
    if (fs.existsSync(distAssetsDir)) {
      if (!fs.existsSync(serverAssetsDir)) {
        fs.mkdirSync(serverAssetsDir, { recursive: true })
      }
      const files = fs.readdirSync(distAssetsDir)
      for (const file of files) {
        fs.copyFileSync(path.join(distAssetsDir, file), path.join(serverAssetsDir, file))
      }
    }
  } catch {}

  console.log('✅ Synced deterministic SPA index.html, route pre-generations, and fallback files.')
}
