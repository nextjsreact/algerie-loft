import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { verifySuperuserAPI } from '@/lib/superuser/auth'
import { Readable } from 'stream'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

export async function GET(request: NextRequest) {
  try {
    const auth = await verifySuperuserAPI()
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.error }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const loftIdFilter = searchParams.get('loft_id')
    const format = searchParams.get('format') || 'csv'

    const supabase = await createClient(true)

    if (format === 'lofts') {
      const { data: lofts } = await supabase
        .from('lofts')
        .select('id, name')
        .order('name')

      const { data: counts } = await supabase
        .from('loft_photos')
        .select('loft_id')

      const countMap: Record<string, number> = {}
      for (const p of counts || []) {
        countMap[p.loft_id] = (countMap[p.loft_id] || 0) + 1
      }

      return NextResponse.json(
        (lofts || []).map(l => ({
          id: l.id,
          name: l.name,
          photo_count: countMap[l.id] || 0,
        })).filter(l => l.photo_count > 0)
      )
    }

    let query = supabase
      .from('loft_photos')
      .select('*')
      .order('created_at', { ascending: true })

    if (loftIdFilter) {
      query = query.eq('loft_id', loftIdFilter)
    }

    const { data: photos, error: photosError } = await query
    if (photosError) throw photosError

    if (!photos || photos.length === 0) {
      return NextResponse.json({ error: 'Aucune photo trouvée' }, { status: 404 })
    }

    const loftIds = [...new Set(photos.map((p: any) => p.loft_id))]
    const { data: lofts, error: loftsError } = await supabase
      .from('lofts')
      .select('id, name')
      .in('id', loftIds)

    if (loftsError) throw loftsError

    const loftMap: Record<string, string> = {}
    for (const l of lofts || []) {
      loftMap[l.id] = l.name || 'Sans nom'
    }

    const sanitize = (s: string) =>
      s.replace(/[<>:"/\\|?*]/g, '_').replace(/\s+/g, ' ').trim()

    if (format === 'json' || format === 'csv') {
      const rows = (photos || []).map((p: any) => ({
        loft_id: p.loft_id,
        loft_name: loftMap[p.loft_id] || 'Sans nom',
        photo_id: p.id,
        file_name: p.file_name,
        file_size_kb: Math.round((p.file_size || 0) / 1024),
        mime_type: p.mime_type,
        url: p.url,
        created_at: p.created_at,
      }))

      if (format === 'csv') {
        const headers = Object.keys(rows[0])
        const csvLines = [headers.join(',')]
        for (const row of rows) {
          csvLines.push(
            headers.map(h => {
              const val = (row as any)[h]
              if (typeof val === 'string' && val.includes(',')) return `"${val.replace(/"/g, '""')}"`
              return val ?? ''
            }).join(',')
          )
        }
        return new NextResponse(csvLines.join('\n'), {
          headers: {
            'Content-Type': 'text/csv; charset=utf-8',
            'Content-Disposition': `attachment; filename="photos-metadata-${new Date().toISOString().split('T')[0]}.csv"`,
          },
        })
      }

      return NextResponse.json(rows, {
        headers: {
          'Content-Disposition': `attachment; filename="photos-metadata-${new Date().toISOString().split('T')[0]}.json"`,
        },
      })
    }

    let archiver: any
    try {
      archiver = (await import('archiver')).default
    } catch {
      return NextResponse.json(
        { error: 'archiver library not installed. Run: npm install archiver' },
        { status: 500 }
      )
    }

    const chunks: Buffer[] = []
    const archive = archiver('zip', { zlib: { level: 5 } })
    archive.on('data', (chunk: Buffer) => chunks.push(chunk))
    archive.on('warning', () => {})

    const archiveDone = new Promise<void>((resolve, reject) => {
      archive.on('end', () => resolve())
      archive.on('error', (err: Error) => reject(err))
    })

    const grouped: Record<string, any[]> = {}
    for (const photo of photos || []) {
      const loftName = sanitize(loftMap[(photo as any).loft_id] || 'Sans nom')
      if (!grouped[loftName]) grouped[loftName] = []
      grouped[loftName].push(photo)
    }

    let csvBuffer = '\uFEFFloft_name,loft_id,photo_id,file_name,file_size_kb,mime_type,url,created_at\n'
    const allEntries: Array<{ photo: any; zipName: string }> = []

    for (const [loftName, loftPhotos] of Object.entries(grouped)) {
      const folderName = sanitize(loftName)
      let idx = 0

      for (const photo of loftPhotos as any[]) {
        idx++
        const ext = photo.file_name?.split('.').pop() || 'jpg'
        const zipName = `${folderName}/${String(idx).padStart(2, '0')}_${sanitize(photo.file_name || `photo.${ext}`)}`

        csvBuffer += [
          `"${loftName.replace(/"/g, '""')}"`,
          photo.loft_id,
          photo.id,
          `"${(photo.file_name || '').replace(/"/g, '""')}"`,
          Math.round((photo.file_size || 0) / 1024),
          photo.mime_type || '',
          `"${(photo.url || '').replace(/"/g, '""')}"`,
          photo.created_at || '',
        ].join(',') + '\n'

        allEntries.push({ photo, zipName })
      }
    }

    for (let i = 0; i < allEntries.length; i += 10) {
      const batch = allEntries.slice(i, i + 10)
      await Promise.allSettled(
        batch.map(async ({ photo, zipName }) => {
          try {
            const res = await fetch(photo.url, { signal: AbortSignal.timeout(15000) })
            if (res.ok && res.body) {
              const nodeStream = Readable.fromWeb(res.body as any)
              archive.append(nodeStream, { name: zipName })
            }
          } catch {
            archive.append(`Download failed: ${photo.url}`, { name: zipName + '.txt' })
          }
        })
      )
    }

    archive.append(csvBuffer, { name: 'metadonnees.csv' })
    archive.finalize()
    await archiveDone

    const buffer = Buffer.concat(chunks)
    const dateStr = new Date().toISOString().split('T')[0]

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="photos-export-${dateStr}.zip"`,
        'Content-Length': String(buffer.length),
      },
    })
  } catch (err) {
    console.error('[photos/export]', err)
    return NextResponse.json({ error: err instanceof Error ? err.message : String(err) }, { status: 500 })
  }
}
