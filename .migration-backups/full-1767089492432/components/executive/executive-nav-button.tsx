"use client"

import { Button } from "@/components/ui/button"
import { TrendingUp } from "lucide-react"
import Link from "next/link"
import { useLocale } from "next-intl"

export function ExecutiveNavButton() {
  const locale = useLocale()

  return (
    <Link href={`/${locale}/executive`}>
      <Button className="bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white">
        <TrendingUp className="h-4 w-4 mr-2" />
        Dashboard Exécutif
      </Button>
    </Link>
  )
}