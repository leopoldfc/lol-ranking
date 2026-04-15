import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

export default defineConfig({
  plugins: [
    react(),
    {
      name: 'serve-data-dir',
      // Dev mode
      configureServer(server) {
        server.middlewares.use('/data', (req, res, next) => {
          const filePath = path.resolve(__dirname, '..', 'data', (req.url ?? '').replace(/^\//, ''))
          if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
            res.setHeader('Content-Type', 'application/json')
            res.end(fs.readFileSync(filePath))
          } else {
            next()
          }
        })
      },
      // Preview / Docker mode
      configurePreviewServer(server) {
        server.middlewares.use('/data', (req, res, next) => {
          const filePath = path.resolve(__dirname, '..', 'data', (req.url ?? '').replace(/^\//, ''))
          if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
            res.setHeader('Content-Type', 'application/json')
            res.end(fs.readFileSync(filePath))
          } else {
            next()
          }
        })
      },
    },
  ],
  server: {
    fs: { allow: ['..'] },
  },
})
