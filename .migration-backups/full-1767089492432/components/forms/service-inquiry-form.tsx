"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useTranslations } from "next-intl"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { serviceInquirySchema, type ServiceInquiryData } from "@/lib/schemas/contact"
import { toast } from "sonner"

interface ServiceInquiryFormProps {
  serviceType?: string
  onSubmit?: (data: ServiceInquiryData) => Promise<void>
  className?: string
  showTitle?: boolean
}

export function ServiceInquiryForm({ 
  serviceType, 
  onSubmit, 
  className, 
  showTitle = true 
}: ServiceInquiryFormProps) {
  const t = useTranslations("serviceInquiry")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [isSuccess, setIsSuccess] = useState(false)

  const form = useForm<ServiceInquiryData>({
    resolver: zodResolver(serviceInquirySchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      serviceType: (serviceType as any) || "property_management",
      propertyType: undefined,
      propertyCount: undefined,
      location: "",
      currentSituation: undefined,
      timeline: undefined,
      message: "",
      budget: "",
      consentToContact: false,
      website: "" // Honeypot field
    }
  })

  const handleSubmit = async (data: ServiceInquiryData) => {
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
        const response = await fetch('/api/service-inquiry', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(data),
        })

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.message || 'Failed to submit inquiry')
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
              <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-semibold">{t("form.successTitle")}</h3>
              <p className="text-muted-foreground">{t("form.successMessage")}</p>
              <p className="text-sm text-muted-foreground mt-2">{t("form.responseTime")}</p>
            </div>
            <Button onClick={() => setIsSuccess(false)} variant="outline">
              {t("form.submitAnother")}
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={className}>
      {showTitle && (
        <CardHeader>
          <CardTitle>{t("form.title")}</CardTitle>
          <CardDescription>{t("form.description")}</CardDescription>
        </CardHeader>
      )}
      <CardContent>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
          {/* Honeypot field - hidden from users */}
          <input
            type="text"
            {...form.register("website")}
            style={{ display: "none" }}
            tabIndex={-1}
            autoComplete="off"
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
              <Label htmlFor="email">{t("form.email")} *</Label>
              <Input
                id="email"
                type="email"
                {...form.register("email")}
                placeholder={t("form.emailPlaceholder")}
                className={form.formState.errors.email ? "border-red-500" : ""}
              />
              {form.formState.errors.email && (
                <p className="text-sm text-red-500">{form.formState.errors.email.message}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="phone">{t("form.phone")}</Label>
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

            <div className="space-y-2">
              <Label htmlFor="serviceType">{t("form.serviceType")} *</Label>
              <Select
                value={form.watch("serviceType")}
                onValueChange={(value) => form.setValue("serviceType", value as any)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="property_management">{t("form.serviceTypes.property_management")}</SelectItem>
                  <SelectItem value="rental_services">{t("form.serviceTypes.rental_services")}</SelectItem>
                  <SelectItem value="maintenance">{t("form.serviceTypes.maintenance")}</SelectItem>
                  <SelectItem value="consultation">{t("form.serviceTypes.consultation")}</SelectItem>
                  <SelectItem value="other">{t("form.serviceTypes.other")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="propertyType">{t("form.propertyType")}</Label>
              <Select
                value={form.watch("propertyType") || ""}
                onValueChange={(value) => form.setValue("propertyType", value as any)}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t("form.selectOption")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="apartment">{t("form.propertyTypes.apartment")}</SelectItem>
                  <SelectItem value="house">{t("form.propertyTypes.house")}</SelectItem>
                  <SelectItem value="commercial">{t("form.propertyTypes.commercial")}</SelectItem>
                  <SelectItem value="multiple">{t("form.propertyTypes.multiple")}</SelectItem>
                  <SelectItem value="other">{t("form.propertyTypes.other")}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="propertyCount">{t("form.propertyCount")}</Label>
              <Input
                id="propertyCount"
                type="number"
                min="1"
                max="100"
                {...form.register("propertyCount", { valueAsNumber: true })}
                placeholder="1"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="location">{t("form.location")}</Label>
              <Input
                id="location"
                {...form.register("location")}
                placeholder={t("form.locationPlaceholder")}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="currentSituation">{t("form.currentSituation")}</Label>
              <Select
                value={form.watch("currentSituation") || ""}
                onValueChange={(value) => form.setValue("currentSituation", value as any)}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t("form.selectOption")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="new_owner">{t("form.situations.new_owner")}</SelectItem>
                  <SelectItem value="current_owner">{t("form.situations.current_owner")}</SelectItem>
                  <SelectItem value="looking_to_buy">{t("form.situations.looking_to_buy")}</SelectItem>
                  <SelectItem value="property_manager">{t("form.situations.property_manager")}</SelectItem>
                  <SelectItem value="other">{t("form.situations.other")}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="timeline">{t("form.timeline")}</Label>
              <Select
                value={form.watch("timeline") || ""}
                onValueChange={(value) => form.setValue("timeline", value as any)}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t("form.selectOption")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="immediate">{t("form.timelines.immediate")}</SelectItem>
                  <SelectItem value="within_month">{t("form.timelines.within_month")}</SelectItem>
                  <SelectItem value="within_3months">{t("form.timelines.within_3months")}</SelectItem>
                  <SelectItem value="within_6months">{t("form.timelines.within_6months")}</SelectItem>
                  <SelectItem value="planning">{t("form.timelines.planning")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="budget">{t("form.budget")}</Label>
            <Input
              id="budget"
              {...form.register("budget")}
              placeholder={t("form.budgetPlaceholder")}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="message">{t("form.message")} *</Label>
            <Textarea
              id="message"
              {...form.register("message")}
              placeholder={t("form.messagePlaceholder")}
              rows={4}
              className={form.formState.errors.message ? "border-red-500" : ""}
            />
            {form.formState.errors.message && (
              <p className="text-sm text-red-500">{form.formState.errors.message.message}</p>
            )}
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