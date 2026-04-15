import { NextRequest, NextResponse } from "next/server"
import { requireAuthAPI } from "@/lib/auth"
import { createClient } from "@/utils/supabase/server"

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAuthAPI()
    if (!session) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 })
    }

    if (!['admin', 'manager', 'superuser'].includes(session.user.role)) {
      return NextResponse.json({ error: "Permissions insuffisantes" }, { status: 403 })
    }

    const { id } = await params
    // Use service role to bypass RLS
    const supabase = await createClient(true)

    // Check all tables that reference lofts
    const checks = await Promise.all([
      supabase.from("reservations").select("id").eq("loft_id", id).limit(1),
      supabase.from("tasks").select("id").eq("loft_id", id).limit(1),
      supabase.from("transactions").select("id").eq("loft_id", id).limit(1),
    ])

    const [reservations, tasks, transactions] = checks
    const blockers: string[] = []
    if (reservations.data?.length) blockers.push(`${reservations.data.length} réservation(s)`)
    if (tasks.data?.length) blockers.push(`${tasks.data.length} tâche(s)`)
    if (transactions.data?.length) blockers.push(`${transactions.data.length} transaction(s)`)

    if (blockers.length > 0) {
      return NextResponse.json(
        { error: `Impossible de supprimer ce loft : il est lié à ${blockers.join(", ")}. Supprimez d'abord ces données.` },
        { status: 400 }
      )
    }

    // Delete all dependent data first
    await supabase.from("loft_photos").delete().eq("loft_id", id)
    await supabase.from("loft_availability").delete().eq("loft_id", id)

    // Also clean up pricing_rules if exists
    await supabase.from("pricing_rules").delete().eq("loft_id", id).throwOnError().catch(() => {})

    // Delete the loft
    const { error } = await supabase.from("lofts").delete().eq("id", id)

    if (error) {
      console.error("[delete loft] DB error:", error)
      return NextResponse.json(
        { error: `Erreur base de données : ${error.message}` },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true, message: "Loft supprimé avec succès" })

  } catch (error) {
    console.error("Error in DELETE /api/lofts/[id]/delete:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erreur serveur" },
      { status: 500 }
    )
  }
}
