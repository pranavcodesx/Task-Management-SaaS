import express from 'express'
import cors from 'cors'
import path from 'node:path'
import fs from 'node:fs'
import { fileURLToPath } from 'node:url'

const app = express()
const PORT = process.env.PORT || 5000
const dist = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'dist')

app.use(cors())
app.use(express.json())

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, product: 'TaskFlow' })
})

// Serve the production build (npm run build) with single-page-app fallback,
// so refreshing /app/tasks or opening a shared link works.
if (fs.existsSync(dist)) {
  app.use(express.static(dist))
  app.get('/{*splat}', (_req, res) => res.sendFile(path.join(dist, 'index.html')))
}

app.listen(PORT, () => {
  console.log(`TaskFlow running on http://localhost:${PORT}`)
})
