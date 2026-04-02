import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

export const dynamic = 'force-dynamic'

interface ICalEvent {
  uid: string
  dtstart: string
  dtend: string
  summary: string
  description: string
}

function parseICS(icsText: string): ICalEvent[] {
  const events: ICalEvent[] = []
  const lines = icsText.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n')

  let current: Partial<ICalEvent> | null = null

  for (const line of lines) {
    if (line === 'BEGIN:VEVENT') {
      current = {}
    } else if (line === 'END:VEVENT' && current) {
      if (current.uid && current.dtstart && current.dtend) {
        events.push(current as ICalEvent)
      }
      current = null
    } else if (current) {
      if (line.startsWith('UID:')) current.uid = line.slice(4).trim()
      else if (line.startsWith('DTSTART') && line.includes(':')) {
        current.dtstart = line.split(':')[1].trim().slice(0, 8) // YYYYMMDD
      }
      else if (line.startsWith('DTEND') && line.includes(':')) {
        current.dtend = line.split(':')[1].trim().slice(0, 8)
      }
      else if (line.startsWith('SUMMARY:')) current.summary = line.slice(8).trim()
      else if (line.startsWith('DESCRIPTION:')) current.description = line.slice(12).trim()
    }
  }

  return events
}

function icsDateToISO(icsDate: string): string {
  // YYYYMMDD → YYYY-MM-DD
  return `${icsDate.slice(0, 4)}-${icsDate.slice(4, 6)}-${icsDate.slice(6, 8)}`
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient(true)
    const body = await request.json()
    const { loft_id } = body

    // Get loft with ical url
    const query = supabase
      .from('lofts')
      .select('id, name, airbnb_ical_url')

    const { data: lofts } = loft_id
      ? await query.eq('id', loft_id)
      : await query.not('airbnb_ical_url', 'is', null).neq('airbnb_ical_url', '')

    if (!lofts || lofts.length === 0) {
      return NextResponse.json({ message: 'No lofts with iCal URL found' })
    }

    const results = []

    for (const loft of lofts) {
      if (!loft.airbnb_ical_url) continue

      try {
        // Fetch the iCal file
        const response = await fetch(loft.airbnb_ical_url, {
          headers: { 'User-Agent': 'LoftAlgerie/1.0' },
          signal: AbortSignal.timeout(10000),
        })

        if (!response.ok) {
          results.push({ loft: loft.name, error: `HTTP ${response.status}` })
          continue
        }

        const icsText = await response.text()
        const events = parseICS(icsText)

        let reservationsCreated = 0
        let blocksCreated = 0

        for (const event of events) {
          const checkIn = icsDateToISO(event.dtstart)
          const checkOut = icsDateToISO(event.dtend)
          const isReservation = event.summary?.toLowerCase().includes('reserved')
          const isBlock = event.summary?.toLowerCase().includes('not available') || event.summary?.toLowerCase().includes('airbnb')

          if (isReservation) {
            // Extract phone last 4 digits from description
            const phoneMatch = event.description?.match(/Phone Number \(Last 4 Digits\): (\d{4})/)
            const phoneLast4 = phoneMatch ? phoneMatch[1] : '0000'

            // Extract reservation code from URL
            const urlMatch = event.description?.match(/reservations\/details\/([A-Z0-9]+)/)
            const reservationCode = urlMatch ? urlMatch[1] : event.uid.slice(0, 10)

            // Check if already exists (by UID stored in special_requests or guest_email)
            const { data: existing } = await supabase
              .from('reservations')
              .select('id')
              .eq('loft_id', loft.id)
              .eq('check_in_date', checkIn)
              .eq('check_out_date', checkOut)
              .limit(1)

            if (!existing || existing.length === 0) {
              await supabase.from('reservations').insert({
                loft_id: loft.id,
                guest_name: `Airbnb ${reservationCode}`,
                guest_email: `airbnb+${reservationCode.toLowerCase()}@airbnb.com`,
                guest_phone: `xxxx${phoneLast4}`,
                guest_nationality: 'XX',
                check_in_date: checkIn,
                check_out_date: checkOut,
                base_price: 0,
                total_amount: 0,
                status: 'confirmed',
                special_requests: `Airbnb UID: ${event.uid}`,
              })
              reservationsCreated++
            }
          } else if (isBlock) {
            // Block dates in loft_availability
            const start = new Date(checkIn)
            const end = new Date(checkOut)
            const datesToBlock = []

            for (let d = new Date(start); d < end; d.setDate(d.getDate() + 1)) {
              datesToBlock.push({
                loft_id: loft.id,
                date: d.toISOString().split('T')[0],
                is_available: false,
                blocked_reason: 'personal_use',
              })
            }

            if (datesToBlock.length > 0) {
              await supabase
                .from('loft_availability')
                .upsert(datesToBlock, { onConflict: 'loft_id,date', ignoreDuplicates: true })
              blocksCreated += datesToBlock.length
            }
          }
        }

        // Update last sync timestamp
        await supabase
          .from('lofts')
          .update({ updated_at: new Date().toISOString() })
          .eq('id', loft.id)

        results.push({
          loft: loft.name,
          events: events.length,
          reservationsCreated,
          blocksCreated,
        })
      } catch (err) {
        results.push({ loft: loft.name, error: err instanceof Error ? err.message : 'Unknown error' })
      }
    }

    return NextResponse.json({ success: true, results })
  } catch (err) {
    console.error('[airbnb-sync]', err)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

// GET — sync all lofts (for cron)
export async function GET(request: NextRequest) {
  // Verify cron secret
  const authHeader = request.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET || 'loft-algerie-cron'
  if (authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  return POST(new NextRequest(request.url, { method: 'POST', body: JSON.stringify({}) }))
}
