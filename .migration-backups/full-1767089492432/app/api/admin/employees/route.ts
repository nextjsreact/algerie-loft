import { NextRequest, NextResponse } from 'next/server'
import { getEmployeesList } from '@/lib/admin/password-management'

export async function GET(request: NextRequest) {
  console.log('🚀 API /admin/employees appelée')
  
  try {
    console.log('📞 Appel getEmployeesList...')
    const result = await getEmployeesList()
    console.log('📊 Résultat getEmployeesList:', { 
      success: result.success, 
      employeesCount: result.employees?.length,
      error: result.error 
    })
    
    return NextResponse.json(result)
  } catch (error) {
    console.error('❌ API Error:', error)
    return NextResponse.json(
      { success: false, error: `Erreur API: ${error instanceof Error ? error.message : 'Unknown'}` },
      { status: 500 }
    )
  }
}