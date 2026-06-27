import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { verifySuperuserAPI } from '@/lib/superuser/auth'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

function crc32(buf: Buffer): number {
  let crc = 0xFFFFFFFF
  for (let i = 0; i < buf.length; i++) {
    crc ^= buf[i]
    for (let j = 0; j < 8; j++) {
      crc = (crc >>> 1) ^ (crc & 1 ? 0xEDB88320 : 0)
    }
  }
  return (crc ^ 0xFFFFFFFF) >>> 0
}

function dosDateTime(date: Date): { time: number; date: number } {
  const time = (date.getHours() << 11) | (date.getMinutes() << 5) | (date.getSeconds() >> 1)
  const d = ((date.getFullYear() - 1980) << 9) | ((date.getMonth() + 1) << 5) | date.getDate()
  return { time, date: d }
}

function buildZip(files: Array<{ name: string; data: Buffer }>): Buffer {
  const parts: Buffer[] = []
  const centralParts: Buffer[] = []
  let offset = 0
  const now = dosDateTime(new Date())

  for (const file of files) {
    const nameBuf = Buffer.from(file.name, 'utf-8')
    const crc = crc32(file.data)

    const local = Buffer.alloc(30 + nameBuf.length)
    local.writeUInt32LE(0x04034b50, 0)
    local.writeUInt16LE(20, 4)
    local.writeUInt16LE(0, 6)
    local.writeUInt16LE(0, 8)
    local.writeUInt16LE(now.time, 10)
    local.writeUInt16LE(now.date, 12)
    local.writeUInt32LE(crc, 14)
    local.writeUInt32LE(file.data.length, 18)
    local.writeUInt32LE(file.data.length, 22)
    local.writeUInt16LE(nameBuf.length, 26)
    local.writeUInt16LE(0, 28)
    nameBuf.copy(local, 30)

    parts.push(local)
    parts.push(file.data)

    const central = Buffer.alloc(46 + nameBuf.length)
    central.writeUInt32LE(0x02014b50, 0)
    central.writeUInt16LE(20, 4)
    central.writeUInt16LE(20, 6)
    central.writeUInt16LE(0, 8)
    central.writeUInt16LE(0, 10)
    central.writeUInt16LE(now.time, 12)
    central.writeUInt16LE(now.date, 14)
    central.writeUInt32LE(crc, 16)
    central.writeUInt32LE(file.data.length, 20)
    central.writeUInt32LE(file.data.length, 24)
    central.writeUInt16LE(nameBuf.length, 28)
    central.writeUInt16LE(0, 30)
    central.writeUInt16LE(0, 32)
    central.writeUInt16LE(0, 34)
    central.writeUInt16LE(0, 36)
    central.writeUInt32LE(0, 38)
    central.writeUInt32LE(offset, 42)
    nameBuf.copy(central, 46)

    centralParts.push(central)
    offset += local.length + file.data.length
  }

  const centralDirSize = centralParts.reduce((a, b) => a + b.length, 0)
  const end = Buffer.alloc(22)
  end.writeUInt32LE(0x06054b50, 0)
  end.writeUInt16LE(0, 4)
  end.writeUInt16LE(0, 6)
  end.writeUInt16LE(files.length, 8)
  end.writeUInt16LE(files.length, 10)
  end.writeUInt32LE(centralDirSize, 12)
  end.writeUInt32LE(offset, 16)
  end.writeUInt16LE(0, 20)

  return Buffer.concat([...parts, ...centralParts, end])
}

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

    const zipFiles: Array<{ name: string; data: Buffer }> = []
    const csvRows = ['loft_name,loft_id,photo_id,file_name,file_size_kb,mime_type,url,created_at']

    const grouped: Record<string, any[]> = {}
    for (const photo of photos || []) {
      const loftName = loftMap[(photo as any).loft_id] || 'Sans nom'
      if (!grouped[loftName]) grouped[loftName] = []
      grouped[loftName].push(photo)
    }

    for (const [loftName, loftPhotos] of Object.entries(grouped)) {
      const folderName = sanitize(loftName)
      let idx = 0

      for (const photo of loftPhotos as any[]) {
        idx++
        const ext = photo.file_name?.split('.').pop() || 'jpg'
        const zipName = `${folderName}/${String(idx).padStart(2, '0')}_${sanitize(photo.file_name || `photo.${ext}`)}`

        csvRows.push([
          `"${loftName.replace(/"/g, '""')}"`,
          photo.loft_id,
          photo.id,
          `"${(photo.file_name || '').replace(/"/g, '""')}"`,
          Math.round((photo.file_size || 0) / 1024),
          photo.mime_type || '',
          `"${(photo.url || '').replace(/"/g, '""')}"`,
          photo.created_at || '',
        ].join(','))

        try {
          const res = await fetch(photo.url, { signal: AbortSignal.timeout(15000) })
          if (res.ok) {
            const ab = await res.arrayBuffer()
            zipFiles.push({ name: zipName, data: Buffer.from(ab) })
          } else {
            zipFiles.push({ name: zipName + '.txt', data: Buffer.from(`HTTP ${res.status}: ${photo.url}`) })
          }
        } catch {
          zipFiles.push({ name: zipName + '.txt', data: Buffer.from(`Download failed: ${photo.url}`) })
        }
      }
    }

    zipFiles.push({ name: 'metadonnees.csv', data: Buffer.from('\uFEFF' + csvRows.join('\n'), 'utf-8') })

    const zipBuffer = buildZip(zipFiles)
    const dateStr = new Date().toISOString().split('T')[0]
    const loftSuffix = loftIdFilter ? `-${sanitize(loftMap[loftIdFilter] || loftIdFilter)}` : ''

    return new NextResponse(zipBuffer, {
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="photos${loftSuffix}-${dateStr}.zip"`,
      },
    })
  } catch (err) {
    console.error('[photos/export]', err)
    return NextResponse.json({ error: err instanceof Error ? err.message : String(err) }, { status: 500 })
  }
}
