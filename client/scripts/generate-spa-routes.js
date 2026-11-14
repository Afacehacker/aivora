import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const distDir = path.resolve(__dirname, '../dist')
const indexHtmlPath = path.join(distDir, 'index.html')

if (fs.existsSync(indexHtmlPath)) {
  const indexHtml = fs.readFileSync(indexHtmlPath, 'utf-8')

  // Create root-level 404.html, 200.html, and _redirects ONLY (never route subdirectories, which cause trailing-slash redirect loops)
  fs.writeFileSync(path.join(distDir, '404.html'), indexHtml)
  fs.writeFileSync(path.join(distDir, '200.html'), indexHtml)
  fs.writeFileSync(path.join(distDir, '_redirects'), '/* /index.html 200\n')

  console.log('✅ Generated root SPA fallback files (404.html, 200.html, _redirects).')
}
