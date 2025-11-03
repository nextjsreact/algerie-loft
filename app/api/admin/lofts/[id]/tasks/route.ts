import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'


// GET /api/admin/lofts/[id]/tasks - Get tasks for a property
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient()

    // Check if user is admin
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify admin role
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile || profile.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const { id } = params
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') || 'all'
    const priority = searchParams.get('priority')
    const category = searchParams.get('category')

    // Verify property exists
    const { data: property, error: propertyError } = await supabase
      .from('lofts')
      .select('id, name')
      .eq('id', id)
      .single()

    if (propertyError || !property) {
      return NextResponse.json({ error: 'Property not found' }, { status: 404 })
    }

    // Build query
    let query = supabase
      .from('tasks')
      .select(`
        id,
        title,
        description,
        status,
        priority,
        category,
        due_date,
        estimated_cost,
        actual_cost,
        assigned_to,
        created_at,
        updated_at,
        assignee:profiles!tasks_assigned_to_fkey(
          id,
          full_name,
          email
        )
      `)
      .eq('loft_id', id)
      .order('created_at', { ascending: false })

    // Apply filters
    if (status !== 'all') {
      if (status === 'pending') {
        query = query.in('status', ['pending', 'in_progress'])
      } else {
        query = query.eq('status', status)
      }
    }

    if (priority) {
      query = query.eq('priority', priority)
    }

    if (category) {
      query = query.eq('category', category)
    }

    const { data: tasks, error } = await query

    if (error) {
      console.error('Error fetching tasks:', error)
      return NextResponse.json({ error: 'Failed to fetch tasks' }, { status: 500 })
    }

    // Categorize tasks
    const categorizedTasks = {
      pending: tasks?.filter(t => ['pending', 'in_progress'].includes(t.status)) || [],
      completed: tasks?.filter(t => t.status === 'completed') || [],
      cancelled: tasks?.filter(t => t.status === 'cancelled') || [],
      overdue: tasks?.filter(t => 
        ['pending', 'in_progress'].includes(t.status) && 
        t.due_date && 
        new Date(t.due_date) < new Date()
      ) || []
    }

    // Calculate cost summary
    const costSummary = {
      estimated_total: tasks?.reduce((sum, task) => sum + (task.estimated_cost || 0), 0) || 0,
      actual_total: tasks?.reduce((sum, task) => sum + (task.actual_cost || 0), 0) || 0,
      pending_estimated: categorizedTasks.pending.reduce((sum, task) => sum + (task.estimated_cost || 0), 0),
      completed_actual: categorizedTasks.completed.reduce((sum, task) => sum + (task.actual_cost || 0), 0)
    }

    // Priority breakdown
    const priorityBreakdown = {
      high: tasks?.filter(t => t.priority === 'high' && ['pending', 'in_progress'].includes(t.status)).length || 0,
      medium: tasks?.filter(t => t.priority === 'medium' && ['pending', 'in_progress'].includes(t.status)).length || 0,
      low: tasks?.filter(t => t.priority === 'low' && ['pending', 'in_progress'].includes(t.status)).length || 0
    }

    // Category breakdown
    const categoryBreakdown = tasks?.reduce((acc, task) => {
      if (['pending', 'in_progress'].includes(task.status)) {
        const cat = task.category || 'uncategorized'
        acc[cat] = (acc[cat] || 0) + 1
      }
      return acc
    }, {} as Record<string, number>) || {}

    return NextResponse.json({
      success: true,
      property: {
        id: property.id,
        name: property.name
      },
      tasks: tasks || [],
      categorized: categorizedTasks,
      summary: {
        total: tasks?.length || 0,
        pending: categorizedTasks.pending.length,
        completed: categorizedTasks.completed.length,
        cancelled: categorizedTasks.cancelled.length,
        overdue: categorizedTasks.overdue.length
      },
      cost_summary: costSummary,
      priority_breakdown: priorityBreakdown,
      category_breakdown: categoryBreakdown
    })

  } catch (error) {
    console.error('Property tasks API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}