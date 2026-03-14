import { NextRequest, NextResponse } from "next/server"
import { requireAuthAPI } from "@/lib/auth"
import { createClient } from "@/utils/supabase/server"

export async function POST(request: NextRequest) {
  try {
    const session = await requireAuthAPI()
    if (!session) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 })
    }

    const body = await request.json()
    const { first_name, last_name, email, phone, status, notes } = body

    if (!first_name || !last_name || !email) {
      return NextResponse.json({ error: "Champs obligatoires manquants" }, { status: 400 })
    }

    const supabase = await createClient()
    const { data, error } = await supabase.from("customers").insert({
      first_name,
      last_name,
      email,
      phone: phone || null,
      status: status || "prospect",
      notes: notes || null,
    }).select().single()

    if (error) {
      console.error("Error creating customer:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error("Error in POST /api/customers:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erreur serveur" },
      { status: 500 }
    )
  }
}
