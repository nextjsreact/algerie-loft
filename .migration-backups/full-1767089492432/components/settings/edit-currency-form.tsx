"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { useTranslations } from "next-intl"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, Save, Loader2 } from "lucide-react"
import { updateCurrency } from "@/app/actions/currencies"
import type { Database } from "@/lib/types"
import { toast } from "sonner"

type Currency = Database['public']['Tables']['currencies']['Row']

interface EditCurrencyFormProps {
  currency: Currency
}

export function EditCurrencyForm({ currency }: EditCurrencyFormProps) {
  const t = useTranslations("settings.currencies")
  const [formData, setFormData] = useState({
    name: currency.name,
    code: currency.code,
    symbol: currency.symbol,
    ratio: currency.ratio.toString(),
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrors({})

    // Validation
    const newErrors: Record<string, string> = {}

    if (!formData.name.trim()) {
      newErrors.name = "Currency name is required"
    }

    if (!formData.code.trim()) {
      newErrors.code = "Currency code is required"
    }

    if (!formData.symbol.trim()) {
      newErrors.symbol = "Currency symbol is required"
    }

    const ratioValue = parseFloat(formData.ratio)
    if (isNaN(ratioValue) || ratioValue <= 0) {
      newErrors.ratio = "Exchange rate must be a positive number"
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    startTransition(async () => {
      try {
        await updateCurrency(currency.id, {
          name: formData.name.trim(),
          code: formData.code.trim(),
          symbol: formData.symbol.trim(),
          ratio: ratioValue,
        })

        toast.success(t("updateSuccess"))
        router.push("/settings/currencies")
      } catch (error) {
        console.error("Error updating currency:", error)
        toast.error(t("updateError"))
      }
    })
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: "" }))
    }
  }

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ArrowLeft
            className="h-4 w-4 cursor-pointer"
            onClick={() => router.back()}
          />
          {t("editCurrency")}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">{t("currencyForm.name")}</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleInputChange("name", e.target.value)}
                placeholder={t("currencyForm.namePlaceholder")}
                className={errors.name ? "border-destructive" : ""}
              />
              {errors.name && (
                <p className="text-sm text-destructive">{errors.name}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="code">{t("currencyForm.code")}</Label>
              <Input
                id="code"
                value={formData.code}
                onChange={(e) => handleInputChange("code", e.target.value.toUpperCase())}
                placeholder={t("currencyForm.codePlaceholder")}
                className={errors.code ? "border-destructive" : ""}
                maxLength={3}
              />
              {errors.code && (
                <p className="text-sm text-destructive">{errors.code}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="symbol">{t("currencyForm.symbol")}</Label>
              <Input
                id="symbol"
                value={formData.symbol}
                onChange={(e) => handleInputChange("symbol", e.target.value)}
                placeholder={t("currencyForm.symbolPlaceholder")}
                className={errors.symbol ? "border-destructive" : ""}
                maxLength={5}
              />
              {errors.symbol && (
                <p className="text-sm text-destructive">{errors.symbol}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="ratio">{t("currencyForm.ratio")}</Label>
              <Input
                id="ratio"
                type="number"
                step="0.01"
                min="0"
                value={formData.ratio}
                onChange={(e) => handleInputChange("ratio", e.target.value)}
                placeholder={t("currencyForm.ratioPlaceholder")}
                className={errors.ratio ? "border-destructive" : ""}
              />
              {errors.ratio && (
                <p className="text-sm text-destructive">{errors.ratio}</p>
              )}
              <p className="text-xs text-muted-foreground">
                {t("currencyForm.ratioHelp")}
              </p>
            </div>
          </div>


          <div className="flex gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              disabled={isPending}
            >
              {t("currencyForm.cancelButton")}
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              <Save className="mr-2 h-4 w-4" />
              {t("currencyForm.updateButton")}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}