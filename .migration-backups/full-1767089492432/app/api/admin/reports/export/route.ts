import { NextRequest, NextResponse } from 'next/server'
import { requireRoleAPI } from '@/lib/auth'
import { createClient } from '@/utils/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const session = await requireRoleAPI(['admin', 'manager', 'executive'])
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { reportType, format, dateRange, period } = await request.json()

    if (!reportType || !format) {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 })
    }

    const supabase = await createClient()

    // Get report data
    const reportData = await getReportData(supabase, reportType, period, dateRange)

    switch (format) {
      case 'csv':
        return generateCSVExport(reportData, reportType)
      
      case 'excel':
        return generateExcelExport(reportData, reportType)
      
      case 'pdf':
        return generatePDFExport(reportData, reportType)
      
      default:
        return NextResponse.json({ error: 'Invalid export format' }, { status: 400 })
    }
  } catch (error) {
    console.error('Error exporting report:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

async function getReportData(supabase: any, reportType: string, period: string, dateRange: any) {
  const startDate = dateRange?.from ? new Date(dateRange.from).toISOString() : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
  const endDate = dateRange?.to ? new Date(dateRange.to).toISOString() : new Date().toISOString()

  switch (reportType) {
    case 'financial':
      return await getFinancialReportData(supabase, startDate, endDate)
    
    case 'users':
      return await getUserActivityReportData(supabase, startDate, endDate)
    
    case 'analytics':
      return await getPlatformAnalyticsData(supabase, startDate, endDate)
    
    default:
      throw new Error('Invalid report type')
  }
}

async function getFinancialReportData(supabase: any, startDate: string, endDate: string) {
  // Get bookings data
  const { data: bookings, error: bookingsError } = await supabase
    .from('bookings')
    .select(`
      id,
      total_price,
      status,
      created_at,
      check_in,
      check_out,
      lofts (
        name
      ),
      client:profiles!bookings_client_id_fkey (
        full_name,
        email
      ),
      partner:profiles!bookings_partner_id_fkey (
        full_name,
        email
      )
    `)
    .gte('created_at', startDate)
    .lte('created_at', endDate)
    .order('created_at', { ascending: false })

  if (bookingsError) {
    console.error('Error fetching bookings for export:', bookingsError)
  }

  // Get transactions data
  const { data: transactions, error: transactionsError } = await supabase
    .from('transactions')
    .select(`
      id,
      amount,
      type,
      description,
      created_at,
      lofts (
        name
      )
    `)
    .gte('created_at', startDate)
    .lte('created_at', endDate)
    .order('created_at', { ascending: false })

  if (transactionsError) {
    console.error('Error fetching transactions for export:', transactionsError)
  }

  return {
    bookings: bookings || [],
    transactions: transactions || [],
    summary: {
      totalRevenue: bookings?.reduce((sum, b) => sum + (b.total_price || 0), 0) || 0,
      totalBookings: bookings?.length || 0,
      averageBookingValue: bookings?.length ? (bookings.reduce((sum, b) => sum + (b.total_price || 0), 0) / bookings.length) : 0
    }
  }
}

async function getUserActivityReportData(supabase: any, startDate: string, endDate: string) {
  // Get users data
  const { data: users, error: usersError } = await supabase
    .from('profiles')
    .select(`
      id,
      full_name,
      email,
      role,
      created_at,
      last_sign_in_at,
      is_active
    `)
    .gte('created_at', startDate)
    .lte('created_at', endDate)
    .order('created_at', { ascending: false })

  if (usersError) {
    console.error('Error fetching users for export:', usersError)
  }

  // Get user activity stats
  const { data: userStats } = await supabase.rpc('get_user_management_stats')

  return {
    users: users || [],
    summary: {
      totalUsers: users?.length || 0,
      activeUsers: users?.filter(u => u.is_active).length || 0,
      clientUsers: users?.filter(u => u.role === 'client').length || 0,
      partnerUsers: users?.filter(u => u.role === 'partner').length || 0,
      employeeUsers: users?.filter(u => ['admin', 'manager', 'executive', 'member'].includes(u.role)).length || 0
    }
  }
}

async function getPlatformAnalyticsData(supabase: any, startDate: string, endDate: string) {
  // Get properties data
  const { data: properties, error: propertiesError } = await supabase
    .from('lofts')
    .select(`
      id,
      name,
      address,
      is_active,
      created_at,
      bookings (
        id,
        total_price,
        created_at
      )
    `)
    .order('created_at', { ascending: false })

  if (propertiesError) {
    console.error('Error fetching properties for export:', propertiesError)
  }

  // Calculate property performance
  const propertyPerformance = properties?.map(property => {
    const bookings = property.bookings || []
    const periodBookings = bookings.filter(b => 
      new Date(b.created_at) >= new Date(startDate) && 
      new Date(b.created_at) <= new Date(endDate)
    )
    const revenue = periodBookings.reduce((sum, b) => sum + (b.total_price || 0), 0)
    
    return {
      id: property.id,
      name: property.name,
      address: property.address,
      isActive: property.is_active,
      totalBookings: bookings.length,
      periodBookings: periodBookings.length,
      totalRevenue: bookings.reduce((sum, b) => sum + (b.total_price || 0), 0),
      periodRevenue: revenue,
      createdAt: property.created_at
    }
  }) || []

  return {
    properties: propertyPerformance,
    summary: {
      totalProperties: properties?.length || 0,
      activeProperties: properties?.filter(p => p.is_active).length || 0,
      totalBookings: propertyPerformance.reduce((sum, p) => sum + p.periodBookings, 0),
      totalRevenue: propertyPerformance.reduce((sum, p) => sum + p.periodRevenue, 0)
    }
  }
}

function generateCSVExport(data: any, reportType: string) {
  let csvContent = ''
  
  switch (reportType) {
    case 'financial':
      csvContent = generateFinancialCSV(data)
      break
    case 'users':
      csvContent = generateUsersCSV(data)
      break
    case 'analytics':
      csvContent = generateAnalyticsCSV(data)
      break
  }

  return new NextResponse(csvContent, {
    headers: {
      'Content-Type': 'text/csv',
      'Content-Disposition': `attachment; filename="${reportType}-report.csv"`
    }
  })
}

function generateFinancialCSV(data: any) {
  const headers = [
    'Booking ID',
    'Property Name',
    'Client Name',
    'Client Email',
    'Partner Name',
    'Partner Email',
    'Amount',
    'Status',
    'Check-in',
    'Check-out',
    'Created At'
  ]

  const rows = data.bookings.map((booking: any) => [
    booking.id,
    booking.lofts?.name || '',
    booking.client?.full_name || '',
    booking.client?.email || '',
    booking.partner?.full_name || '',
    booking.partner?.email || '',
    booking.total_price || 0,
    booking.status,
    booking.check_in,
    booking.check_out,
    new Date(booking.created_at).toLocaleDateString()
  ])

  return [headers, ...rows].map(row => row.join(',')).join('\n')
}

function generateUsersCSV(data: any) {
  const headers = [
    'User ID',
    'Full Name',
    'Email',
    'Role',
    'Active',
    'Created At',
    'Last Sign In'
  ]

  const rows = data.users.map((user: any) => [
    user.id,
    user.full_name || '',
    user.email,
    user.role,
    user.is_active ? 'Yes' : 'No',
    new Date(user.created_at).toLocaleDateString(),
    user.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleDateString() : 'Never'
  ])

  return [headers, ...rows].map(row => row.join(',')).join('\n')
}

function generateAnalyticsCSV(data: any) {
  const headers = [
    'Property ID',
    'Property Name',
    'Address',
    'Active',
    'Total Bookings',
    'Period Bookings',
    'Total Revenue',
    'Period Revenue',
    'Created At'
  ]

  const rows = data.properties.map((property: any) => [
    property.id,
    property.name,
    property.address,
    property.isActive ? 'Yes' : 'No',
    property.totalBookings,
    property.periodBookings,
    property.totalRevenue,
    property.periodRevenue,
    new Date(property.createdAt).toLocaleDateString()
  ])

  return [headers, ...rows].map(row => row.join(',')).join('\n')
}

function generateExcelExport(data: any, reportType: string) {
  // For now, return CSV format with Excel MIME type
  // In a real implementation, you would use a library like xlsx to generate proper Excel files
  const csvContent = generateCSVExport(data, reportType)
  
  return new NextResponse(csvContent.body, {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="${reportType}-report.xlsx"`
    }
  })
}

function generatePDFExport(data: any, reportType: string) {
  // For now, return a simple text format
  // In a real implementation, you would use a library like puppeteer or jsPDF to generate proper PDFs
  let pdfContent = `${reportType.toUpperCase()} REPORT\n`
  pdfContent += `Generated on: ${new Date().toLocaleDateString()}\n\n`
  
  switch (reportType) {
    case 'financial':
      pdfContent += `SUMMARY:\n`
      pdfContent += `Total Revenue: ${data.summary.totalRevenue}\n`
      pdfContent += `Total Bookings: ${data.summary.totalBookings}\n`
      pdfContent += `Average Booking Value: ${data.summary.averageBookingValue}\n\n`
      break
    case 'users':
      pdfContent += `SUMMARY:\n`
      pdfContent += `Total Users: ${data.summary.totalUsers}\n`
      pdfContent += `Active Users: ${data.summary.activeUsers}\n`
      pdfContent += `Client Users: ${data.summary.clientUsers}\n`
      pdfContent += `Partner Users: ${data.summary.partnerUsers}\n\n`
      break
    case 'analytics':
      pdfContent += `SUMMARY:\n`
      pdfContent += `Total Properties: ${data.summary.totalProperties}\n`
      pdfContent += `Active Properties: ${data.summary.activeProperties}\n`
      pdfContent += `Total Bookings: ${data.summary.totalBookings}\n`
      pdfContent += `Total Revenue: ${data.summary.totalRevenue}\n\n`
      break
  }

  return new NextResponse(pdfContent, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${reportType}-report.pdf"`
    }
  })
}