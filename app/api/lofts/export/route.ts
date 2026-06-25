import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

export const dynamic = 'force-dynamic'

const COMPANY_NAME = 'Loft Algérie'
const COMPANY_PHONE = '+213 560 36 25 43'
const COMPANY_EMAIL = 'contact@loftalgerie.com'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const format = searchParams.get('format') || 'json'

    const supabase = await createClient(true)

    const { data: lofts, error } = await supabase
      .from('lofts')
      .select(`
        *,
        owner:owners(name, business_name),
        zone_area:zone_areas(name),
        loft_photos(url, is_cover, order_index)
      `)
      .order('name')

    if (error) throw error

    const exported = (lofts || []).map(loft => {
      const photos = (loft.loft_photos || [])
        .sort((a: any, b: any) => {
          if (a.is_cover && !b.is_cover) return -1
          if (!a.is_cover && b.is_cover) return 1
          return (a.order_index || 999) - (b.order_index || 999)
        })
        .map((p: any) => p.url)

      const isPartner = !!loft.partner_id

      return {
        id: loft.id,
        name: loft.name,
        description: loft.description || '',
        address: loft.address || '',
        zone: loft.zone_area?.name || '',
        price_per_night: loft.price_per_night || null,
        price_per_month: loft.price_per_month || null,
        max_guests: loft.max_guests || null,
        bedrooms: loft.bedrooms || null,
        bathrooms: loft.bathrooms || null,
        area_sqm: loft.area_sqm || null,
        amenities: loft.amenities || [],
        status: loft.status || 'available',
        is_published: loft.is_published ?? true,
        check_in_time: loft.check_in_time || null,
        check_out_time: loft.check_out_time || null,
        cleaning_fee: loft.cleaning_fee || null,
        gps_coordinates: loft.gps_coordinates || null,
        wifi_password: loft.wifi_password || null,
        photos,
        owner_name: isPartner ? COMPANY_NAME : (loft.owner?.business_name || loft.owner?.name || COMPANY_NAME),
        company_name: COMPANY_NAME,
        company_phone: COMPANY_PHONE,
        company_email: COMPANY_EMAIL,
        exported_at: new Date().toISOString(),
      }
    })

    if (format === 'csv') {
      const headers = Object.keys(exported[0] || {})
      const csvRows = [headers.join(',')]
      for (const row of exported) {
        csvRows.push(headers.map(h => {
          const val = (row as any)[h]
          if (Array.isArray(val)) return `"${val.join('; ')}"`
          if (typeof val === 'string') return `"${val.replace(/"/g, '""')}"`
          return val ?? ''
        }).join(','))
      }
      return new NextResponse(csvRows.join('\n'), {
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="lofts-export-${new Date().toISOString().split('T')[0]}.csv"`,
        },
      })
    }

    return NextResponse.json(exported, {
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Content-Disposition': format === 'json' ? `attachment; filename="lofts-export-${new Date().toISOString().split('T')[0]}.json"` : '',
      },
    })
  } catch (err) {
    console.error('[lofts/export]', err)
    return NextResponse.json({ error: err instanceof Error ? err.message : String(err) }, { status: 500 })
  }
}
