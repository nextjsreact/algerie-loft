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

    if (session.user.role !== 'admin') {
      return NextResponse.json({ error: "Permissions insuffisantes" }, { status: 403 })
    }

    const { id } = await params
    const supabase = await createClient()

    // Vérifier les dépendances
    const { data: relatedTasks } = await supabase.from("tasks").select("id").eq("loft_id", id).limit(1)
    const { data: relatedTransactions } = await supabase.from("transactions").select("id").eq("loft_id", id).limit(1)

    if (relatedTasks?.length || relatedTransactions?.length) {
      const deps = []
      if (relatedTasks?.length) deps.push("tâches")
      if (relatedTransactions?.length) deps.push("transactions")
      return NextResponse.json(
        { error: `Impossible de supprimer: loft lié à des ${deps.join(", ")}` },
        { status: 400 }
      )
    }

    // Supprimer les photos et disponibilités
    await supabase.from("loft_photos").delete().eq("loft_id", id)
    await supabase.from("loft_availability").delete().eq("loft_id", id)

    // Supprimer le loft
    const { error } = await supabase.from("lofts").delete().eq("id", id)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error in DELETE /api/lofts/[id]/delete:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erreur serveur" },
      { status: 500 }
    )
  }
}
