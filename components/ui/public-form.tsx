"use client"

import { useState } from "react"
import { useForm, FormProvider } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Button } from "./button"
import { FormLoadingOverlay } from "./loading-states"
import { InlineError } from "./error-fallback"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./card"

interface PublicFormProps<T extends z.ZodType> {
  schema: T
  onSubmit: (data: z.infer<T>) => Promise<void>
  children: React.ReactNode
  title?: string
  description?: string
  submitText?: string
  successMessage?: string
  className?: string
}

export function PublicForm<T extends z.ZodType>({
  schema,
  onSubmit,
  children,
  title,
  description,
  submitText = "Submit",
  successMessage = "Form submitted successfully!",
  className
}: PublicFormProps<T>) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [isSuccess, setIsSuccess] = useState(false)

  const form = useForm<z.infer<T>>({
    resolver: zodResolver(schema)
  })

  const handleSubmit = async (data: z.infer<T>) => {
    setIsSubmitting(true)
    setSubmitError(null)
    
    try {
      await onSubmit(data)
      setIsSuccess(true)
      form.reset()
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : "An error occurred")
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
              <h3 className="text-lg font-semibold">Success!</h3>
              <p className="text-muted-foreground">{successMessage}</p>
            </div>
            <Button onClick={() => setIsSuccess(false)} variant="outline">
              Submit another
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={className}>
      {(title || description) && (
        <CardHeader>
          {title && <CardTitle>{title}</CardTitle>}
          {description && <CardDescription>{description}</CardDescription>}
        </CardHeader>
      )}
      <CardContent className="relative">
        <FormLoadingOverlay isLoading={isSubmitting} />
        
        <FormProvider {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            {children}
            
            {submitError && (
              <InlineError 
                message={submitError} 
                retry={() => setSubmitError(null)}
              />
            )}
            
            <Button 
              type="submit" 
              disabled={isSubmitting}
              className="w-full"
            >
              {isSubmitting ? "Submitting..." : submitText}
            </Button>
          </form>
        </FormProvider>
      </CardContent>
    </Card>
  )
}

// Pre-configured form schemas for common use cases
export const contactFormSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email address"),
  phone: z.string().optional(),
  subject: z.string().min(5, "Subject must be at least 5 characters"),
  message: z.string().min(10, "Message must be at least 10 characters"),
  preferredContact: z.enum(["email", "phone"]).default("email")
})

export const newsletterSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  interests: z.array(z.string()).optional()
})

export const propertyInquirySchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email address"),
  phone: z.string().optional(),
  propertyId: z.string(),
  inquiryType: z.enum(["viewing", "information", "rental", "purchase"]),
  message: z.string().min(10, "Please provide more details about your inquiry"),
  preferredContactTime: z.string().optional()
})

export type ContactFormData = z.infer<typeof contactFormSchema>
export type NewsletterData = z.infer<typeof newsletterSchema>
export type PropertyInquiryData = z.infer<typeof propertyInquirySchema>