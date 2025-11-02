#!/usr/bin/env node

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

function deleteFolderRecursive(folderPath) {
  if (fs.existsSync(folderPath)) {
    fs.readdirSync(folderPath).forEach((file) => {
      const curPath = path.join(folderPath, file)
      if (fs.lstatSync(curPath).isDirectory()) {
        deleteFolderRecursive(curPath)
      } else {
        fs.unlinkSync(curPath)
      }
    })
    fs.rmdirSync(folderPath)
  }
}

console.log('🧹 Clearing Next.js cache...')

// Clear .next folder
const nextFolder = path.join(process.cwd(), '.next')
if (fs.existsSync(nextFolder)) {
  deleteFolderRecursive(nextFolder)
  console.log('✅ Cleared .next folder')
} else {
  console.log('ℹ️  .next folder not found')
}

// Clear node_modules/.cache if it exists
const cacheFolder = path.join(process.cwd(), 'node_modules', '.cache')
if (fs.existsSync(cacheFolder)) {
  deleteFolderRecursive(cacheFolder)
  console.log('✅ Cleared node_modules/.cache folder')
} else {
  console.log('ℹ️  node_modules/.cache folder not found')
}

console.log('🎉 Cache cleared successfully!')
console.log('💡 Run "npm run dev" to restart the development server')