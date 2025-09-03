"use server"

import { cookies } from "next/headers"
import { redirect } from "next/navigation"

export async function setLanguageCookie(lang: string) {
  (await cookies()).set("language", lang, { path: "/", maxAge: 31536000, sameSite: "lax" })
  redirect("/")
}