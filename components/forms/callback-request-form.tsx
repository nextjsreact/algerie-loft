"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useTranslations } from "next-intl"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { callbackRequestSchema, type CallbackRequestData } from "@/lib/schemas/contact"
import { toast } from "sonner"
import { Phone } from "lucide-react"

interface CallbackRequestFormProps {
  onSubmit?: (data: CallbackRequestData) => Promise<void>
  className?: string
  showTitle?: boolean
  compact?: boolean
}

export function CallbackRequestForm({ 
  onSubmit, 
  className, 
  showTitle = true,
  compact = false 
}: CallbackRequestFormProps) {
  const t = useTranslations("callbackRequest")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [isSuccess, setIsSuccess] = useState(false)

  const form = useForm<CallbackRequestData>({
    resolver: zodResolver(callbackRequestSchema),
    defaultValues: {
      name: "",
      phone: "",
      preferredTime: "morning",
      topic: undefined,
      consentToContact: false,
      website: "" // Honeypot field
    }
  })

  const handleSubmit = async (data: CallbackRequestData) => {
    // Check honeypot field
    if (data.website) {
      console.log("Spam detected via honeypot field")
      return
    }

    setIsSubmitting(true)
    setSubmitError(null)
    
    try {
      if (onSubmit) {
        await onSubmit(data)
      } else {
        // Default submission to API
        const response = await fetch('/api/callback-request', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(data),
        })

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.message || 'Failed to submit callback request')
        }
      }
      
      setIsSuccess(true)
      form.reset()
      toast.success(t("form.successMessage"))
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : t("form.submitError")
      setSubmitError(errorMessage)
      toast.error(errorMessage)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isSuccess) {
    return (
      <Card className={className}>
        <CardContent className="pt-6">
          <div className="text-center space-y-4">
            <div className="mx-auto h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
              <Phone className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold">{t("form.successTitle")}</h3>
              <p className="text-muted-foreground">{t("form.successMessage")}</p>
              <p className="text-sm text-muted-foreground mt-2">{t("form.callbackTime")}</p>
            </div>
            <Button onClick={() => setIsSuccess(false)} variant="outline">
              {t("form.requestAnother")}
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={className}>
      {showTitle && (
        <CardHeader className={compact ? "pb-4" : ""}>
          <div className="flex items-center space-x-2">
            <Phone className="h-5 w-5 text-primary" />
            <CardTitle className={compact ? "text-lg" : ""}>{t("form.title")}</CardTitle>
          </div>
          <CardDescription>{t("form.description")}</CardDescription>
        </CardHeader>
      )}
      <CardContent className={compact ? "pt-0" : ""}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
          {/* Honeypot field - hidden from users */}
          <input
            type="text"
            {...form.register("website")}
            style={{ display: "none" }}
            tabIndex={-1}
            autoComplete="off"
          />

          <div className={compact ? "space-y-3" : "grid grid-cols-1 md:grid-cols-2 gap-4"}>
            <div className="space-y-2">
              <Label htmlFor="name">{t("form.name")} *</Label>
              <Input
                id="name"
                {...form.register("name")}
                placeholder={t("form.namePlaceholder")}
                className={form.formState.errors.name ? "border-red-500" : ""}
              />
              {form.formState.errors.name && (
                <p className="text-sm text-red-500">{form.formState.errors.name.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">{t("form.phone")} *</Label>
              <Input
                id="phone"
                type="tel"
                {...form.register("phone")}
                placeholder={t("form.phonePlaceholder")}
                className={form.formState.errors.phone ? "border-red-500" : ""}
              />
              {form.formState.errors.phone && (
                <p className="text-sm text-red-500">{form.formState.errors.phone.message}</p>
              )}
            </div>
          </div>

          <div className={compact ? "space-y-3" : "grid grid-cols-1 md:grid-cols-2 gap-4"}>
            <div className="space-y-2">
              <Label htmlFor="preferredTime">{t("form.preferredTime")} *</Label>
              <Select
                value={form.watch("preferredTime")}
                onValueChange={(value) => form.setValue("preferredTime", value as any)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="morning">{t("form.times.morning")}</SelectItem>
                  <SelectItem value="afternoon">{t("form.times.afternoon")}</SelectItem>
                  <SelectItem value="evening">{t("form.times.evening")}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="topic">{t("form.topic")}</Label>
              <Select
                value={form.watch("topic") || ""}
                onValueChange={(value) => form.setValue("topic", value as any)}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t("form.selectTopic")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="property_management">{t("form.topics.property_management")}</SelectItem>
                  <SelectItem value="rental_inquiry">{t("form.topics.rental_inquiry")}</SelectItem>
                  <SelectItem value="general_inquiry">{t("form.topics.general_inquiry")}</SelectItem>
                  <SelectItem value="other">{t("form.topics.other")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex items-start space-x-2">
            <Checkbox
              id="consent"
              checked={form.watch("consentToContact")}
              onCheckedChange={(checked) => form.setValue("consentToContact", checked as boolean)}
              className={form.formState.errors.consentToContact ? "border-red-500" : ""}
            />
            <div className="grid gap-1.5 leading-none">
              <Label
                htmlFor="consent"
                className="text-sm font-normal leading-snug peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                {t("form.consentText")} *
              </Label>
              {form.formState.errors.consentToContact && (
                <p className="text-sm text-red-500">{form.formState.errors.consentToContact.message}</p>
              )}
            </div>
          </div>

          {submitError && (
            <Alert variant="destructive">
              <AlertDescription>{submitError}</AlertDescription>
            </Alert>
          )}

          <Button 
            type="submit" 
            disabled={isSubmitting}
            className="w-full"
          >
            <Phone className="h-4 w-4 mr-2" />
            {isSubmitting ? t("form.submitting") : t("form.submit")}
          </Button>

          <p className="text-xs text-muted-foreground text-center">
            {t("form.privacyNotice")}
          </p>
        </form>
      </CardContent>
    </Card>
  )
}