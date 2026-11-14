import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const distDir = path.resolve(__dirname, '../dist')
const indexHtmlPath = path.join(distDir, 'index.html')
const serverSpaHtmlPath = path.resolve(__dirname, '../../server/src/spa-index.html')

if (fs.existsSync(indexHtmlPath)) {
  const indexHtml = fs.readFileSync(indexHtmlPath, 'utf-8')

  // Create root-level 404.html, 200.html, and _redirects
  fs.writeFileSync(path.join(distDir, '404.html'), indexHtml)
  fs.writeFileSync(path.join(distDir, '200.html'), indexHtml)
  fs.writeFileSync(path.join(distDir, '_redirects'), '/* /index.html 200\n')

  // Also sync index.html into server/src/spa-index.html so Express can serve it for SPA route reloads on Vercel & Render
  fs.writeFileSync(serverSpaHtmlPath, indexHtml)

  console.log('✅ Synced deterministic SPA index.html and fallback files.')
}
