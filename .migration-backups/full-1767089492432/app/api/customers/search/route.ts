import { NextRequest, NextResponse } from "next/server";
import { requireAuthAPI } from "@/lib/auth";
import { createClient } from "@/utils/supabase/server";
import { PostgrestError } from "@supabase/supabase-js";

export async function GET(request: NextRequest) {
  try {
    const session = await requireAuthAPI();

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');
    const phone = searchParams.get('phone');

    let customer = null;
    let error: PostgrestError | null = null;

    if (email) {
      const { data, error: fetchError } = await supabase
        .from("customers")
        .select("*")
        .eq("email", email)
        .single();
      customer = data;
      error = fetchError;
    } else if (phone) {
      const { data, error: fetchError } = await supabase
        .from("customers")
        .select("*")
        .eq("phone", phone)
        .single();
      customer = data;
      error = fetchError;
    } else {
      return NextResponse.json({ error: "Email or phone parameter is required" }, { status: 400 });
    }

    if (error && error.code && error.code !== 'PGRST116') { // PGRST116 means no rows found
      console.error("Error fetching customer:", error);
      return NextResponse.json(
        { error: "Error fetching customer data" },
        { status: 500 }
      );
    }

    return NextResponse.json({ customer });
  } catch (error) {
    console.error("API Error (customers search):", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}