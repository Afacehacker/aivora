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

  // Pre-generate deterministic route folders with index.html for direct navigation & reload immunity
  for (const route of knownRoutes) {
    const routeDir = path.join(distDir, route)
    if (!fs.existsSync(routeDir)) {
      fs.mkdirSync(routeDir, { recursive: true })
    }
    fs.writeFileSync(path.join(routeDir, 'index.html'), indexHtml)
  }

  // Also sync index.html into server/src/spa-index.html so Express can serve it for SPA route reloads on Vercel & Render
  try {
    fs.writeFileSync(serverSpaHtmlPath, indexHtml)
  } catch {}

  console.log('✅ Synced deterministic SPA index.html, route pre-generations, and fallback files.')
}
