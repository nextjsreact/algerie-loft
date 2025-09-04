"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useTranslations, useLocale } from "next-intl"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { ArrowLeft, Plus, DollarSign } from "lucide-react"
import Link from "next/link"
import { createCurrency } from "@/app/actions/currencies"

export function NewCurrencyForm() {
  const t = useTranslations("settings.currencies")
  const tCommon = useTranslations("common")
  const locale = useLocale()
  const router = useRouter()
  
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    code: "",
    symbol: "",
    is_default: false
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      await createCurrency({
        name: formData.name,
        code: formData.code.toUpperCase(),
        symbol: formData.symbol,
        is_default: formData.is_default
      })
      
      router.push(`/${locale}/settings/currencies`)
    } catch (error) {
      console.error("Error creating currency:", error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="outline" size="sm" asChild>
          <Link href={`/${locale}/settings/currencies`}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            {tCommon("back")}
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <DollarSign className="h-8 w-8 text-primary" />
            {t("addNew")}
          </h1>
          <p className="text-muted-foreground">{t("addFirstCurrency")}</p>
        </div>
      </div>

      {/* Form */}
      <Card>
        <CardHeader>
          <CardTitle>{t("addNew")}</CardTitle>
          <CardDescription>{t("enterCurrencyDetails")}</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name">{t("name")}</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="e.g. Algerian Dinar"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="code">{t("code")}</Label>
              <Input
                id="code"
                value={formData.code}
                onChange={(e) => setFormData(prev => ({ ...prev, code: e.target.value }))}
                placeholder="e.g. DZD"
                maxLength={3}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="symbol">{t("symbol")}</Label>
              <Input
                id="symbol"
                value={formData.symbol}
                onChange={(e) => setFormData(prev => ({ ...prev, symbol: e.target.value }))}
                placeholder="e.g. DA"
                required
              />
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="is_default"
                checked={formData.is_default}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_default: checked as boolean }))}
              />
              <Label htmlFor="is_default">{t("setAsDefault")}</Label>
            </div>

            <div className="flex gap-4">
              <Button type="submit" disabled={isLoading}>
                <Plus className="h-4 w-4 mr-2" />
                {isLoading ? tCommon("saving") : t("addNew")}
              </Button>
              <Button type="button" variant="outline" asChild>
                <Link href={`/${locale}/settings/currencies`}>
                  {tCommon("cancel")}
                </Link>
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}