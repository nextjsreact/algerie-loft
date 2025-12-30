import { NextResponse } from 'next/server'
import path from 'path'
import { promises as fs } from 'fs'

export async function GET(request: Request, { params }: { params: { lang: string, ns: string } }) {
  const { lang, ns } = await params

  try {
    const filePath = path.join(process.cwd(), 'public', 'locales', lang, `${ns}.json`)
    const fileContents = await fs.readFile(filePath, 'utf8')
    return new NextResponse(fileContents, {
      headers: {
        'Content-Type': 'application/json',
      },
    })
  } catch (error) {
    console.error(`Failed to load translation file: ${lang}/${ns}.json`, error)
    return new NextResponse(JSON.stringify({ error: 'Translation file not found' }), {
      status: 404,
      headers: {
        'Content-Type': 'application/json',
      },
    })
  }
}