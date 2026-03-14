import { NextRequest, NextResponse } from "next/server"
import { requireAuthAPI } from "@/lib/auth"
import { createClient } from "@/utils/supabase/server"
import { randomUUID } from "crypto"

export async function POST(request: NextRequest) {
  try {
    const session = await requireAuthAPI()
    if (!session) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 })
    }

    let body: any
    try {
      body = await request.json()
    } catch {
      return NextResponse.json({ error: "Corps de requête invalide" }, { status: 400 })
    }

    const { first_name, last_name, email, phone, status, notes } = body

    if (!first_name || !last_name || !email) {
      return NextResponse.json({ error: "Champs obligatoires manquants (prénom, nom, email)" }, { status: 400 })
    }

    const supabase = await createClient(true)
    const { data, error } = await supabase.from("customers").insert({
      id: randomUUID(),
      first_name,
      last_name,
      email,
      phone: phone || null,
      status: status || "prospect",
      notes: notes || null,
    }).select().single()

    if (error) {
      console.error("Supabase error creating customer:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, data })
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error)
    console.error("Error in POST /api/customers:", msg)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
