import { createClient } from "@/utils/supabase/server"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get("code")

  if (code) {
    // Exchange code for access token
    const response = await fetch("https://api.airbnb.com/v2/oauth2/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        client_id: process.env.AIRBNB_CLIENT_ID!,
        client_secret: process.env.AIRBNB_CLIENT_SECRET!,
        code,
        grant_type: "authorization_code",
        redirect_uri: process.env.AIRBNB_REDIRECT_URI!,
      }),
    })

    const data = await response.json()

    if (data.error) {
      return NextResponse.redirect(new URL("/settings/integrations?error=airbnb-auth-failed", request.url))
    }

    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (user) {
      await supabase
        .from("profiles")
        .update({
          airbnb_access_token: data.access_token,
          airbnb_refresh_token: data.refresh_token,
        })
        .eq("id", user.id)
    }

    return NextResponse.redirect(new URL("/settings/integrations", request.url))
  }

  // Redirect to Airbnb for authorization
  const authUrl = new URL("https://api.airbnb.com/v2/oauth2/authorize")
  authUrl.searchParams.set("client_id", process.env.AIRBNB_CLIENT_ID!)
  authUrl.searchParams.set("redirect_uri", process.env.AIRBNB_REDIRECT_URI!)
  authUrl.searchParams.set("response_type", "code")
  authUrl.searchParams.set("scope", "read")

  return NextResponse.redirect(authUrl)
}
