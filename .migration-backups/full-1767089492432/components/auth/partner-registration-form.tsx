'use client'

import { useState, useRef } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { Progress } from '@/components/ui/progress'
import { Loader2, ArrowLeft, ArrowRight, Info, Upload, X, FileText, CheckCircle } from 'lucide-react'
import { useTranslations } from 'next-intl'
import type { PartnerRegistrationData, PartnerRegistrationFormErrors } from '@/types/partner'

// Enhanced validation schema with file upload support
const partnerRegistrationSchema = z.object({
  // Personal Information
  personal_info: z.object({
    full_name: z.string().min(2, 'Name must be at least 2 characters'),
    email: z.string().email('Invalid email address'),
    phone: z.string().min(10, 'Please provide a valid phone number'),
    address: z.string().min(10, 'Please provide a complete address'),
  }),
  
  // Business Information
  business_info: z.object({
    business_name: z.string().optional(),
    business_type: z.enum(['individual', 'company']),
    tax_id: z.string().optional(),
  }),
  
  // Portfolio Description
  portfolio_description: z.string().min(50, 'Please provide at least 50 characters describing your property portfolio'),
  
  // Authentication
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirm_password: z.string(),
  
  // Terms and Conditions
  terms_accepted: z.boolean().refine(val => val === true, {
    message: 'You must accept the terms and conditions'
  }),
}).refine((data) => data.password === data.confirm_password, {
  message: "Passwords don't match",
  path: ["confirm_password"]
})

type PartnerRegistrationFormData = z.infer<typeof partnerRegistrationSchema>

interface PartnerRegistrationFormProps {
  onBack?: () => void
  onSuccess?: (data: { partner_id: string; requires_approval: boolean }) => void
  onError?: (error: string) => void
}

export function PartnerRegistrationForm({ onBack, onSuccess, onError }: PartnerRegistrationFormProps) {
  const t = useTranslations('auth')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [step, setStep] = useState(1)
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    trigger,
    getValues
  } = useForm<PartnerRegistrationFormData>({
    resolver: zodResolver(partnerRegistrationSchema),
    defaultValues: {
      business_info: {
        business_type: 'individual'
      },
      terms_accepted: false
    }
  })

  const businessType = watch('business_info.business_type')
  const termsAccepted = watch('terms_accepted')

  // Calculate progress based on current step
  const getProgress = () => {
    return (step / 4) * 100
  }

  // Validate current step before proceeding
  const validateStep = async (currentStep: number): Promise<boolean> => {
    switch (currentStep) {
      case 1:
        return await trigger(['personal_info.full_name', 'personal_info.email', 'personal_info.phone', 'personal_info.address'])
      case 2:
        const fields = ['business_info.business_type']
        if (businessType === 'company') {
          fields.push('business_info.business_name', 'business_info.tax_id')
        }
        return await trigger(fields as any)
      case 3:
        return await trigger(['portfolio_description'])
      case 4:
        return await trigger(['password', 'confirm_password', 'terms_accepted'])
      default:
        return true
    }
  }

  // File upload handlers
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || [])
    const validFiles = files.filter(file => {
      const validTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg']
      const maxSize = 5 * 1024 * 1024 // 5MB
      return validTypes.includes(file.type) && file.size <= maxSize
    })

    if (validFiles.length !== files.length) {
      setError('Some files were rejected. Please upload only PDF, JPEG, or PNG files under 5MB.')
    }

    setUploadedFiles(prev => [...prev, ...validFiles])
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const removeFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index))
  }

  const onSubmit = async (data: PartnerRegistrationFormData) => {
    setIsLoading(true)
    setError(null)

    try {
      // Prepare registration data
      const registrationData: PartnerRegistrationData = {
        personal_info: data.personal_info,
        business_info: data.business_info,
        portfolio_description: data.portfolio_description,
        verification_documents: uploadedFiles
      }

      // Call registration API
      const response = await fetch('/api/partner/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...registrationData,
          password: data.password,
          confirm_password: data.confirm_password,
          terms_accepted: data.terms_accepted
        })
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Registration failed')
      }

      if (result.success) {
        onSuccess?.({
          partner_id: result.partner_id,
          requires_approval: result.validation_required
        })
      } else {
        setError(result.error || 'Registration failed')
        onError?.(result.error || 'Registration failed')
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred'
      setError(errorMessage)
      onError?.(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  const nextStep = async () => {
    const isValid = await validateStep(step)
    if (isValid) {
      setStep(prev => Math.min(prev + 1, 4))
      setError(null)
    }
  }

  const prevStep = () => {
    setStep(prev => Math.max(prev - 1, 1))
    setError(null)
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <div className="flex items-center gap-4">
          {onBack && step === 1 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onBack}
              className="p-1"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
          )}
          {step > 1 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={prevStep}
              className="p-1"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
          )}
          <div className="flex-1">
            <CardTitle>Partner Registration</CardTitle>
            <CardDescription>
              Step {step} of 4 - {getStepTitle(step)}
            </CardDescription>
          </div>
        </div>
        <Progress value={getProgress()} className="w-full" />
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Step 1: Personal Information */}
          {step === 1 && (
            <div className="space-y-4">
              <div className="text-center mb-6">
                <h3 className="text-lg font-semibold">Personal Information</h3>
                <p className="text-sm text-gray-600">Please provide your personal details</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="full_name">Full Name *</Label>
                  <Input
                    id="full_name"
                    {...register('personal_info.full_name')}
                    placeholder="Enter your full name"
                  />
                  {errors.personal_info?.full_name && (
                    <p className="text-sm text-red-600">{errors.personal_info.full_name.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email Address *</Label>
                  <Input
                    id="email"
                    type="email"
                    {...register('personal_info.email')}
                    placeholder="Enter your email address"
                  />
                  {errors.personal_info?.email && (
                    <p className="text-sm text-red-600">{errors.personal_info.email.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number *</Label>
                  <Input
                    id="phone"
                    {...register('personal_info.phone')}
                    placeholder="Enter your phone number"
                  />
                  {errors.personal_info?.phone && (
                    <p className="text-sm text-red-600">{errors.personal_info.phone.message}</p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">Address *</Label>
                <Textarea
                  id="address"
                  {...register('personal_info.address')}
                  placeholder="Enter your complete address"
                  rows={3}
                />
                {errors.personal_info?.address && (
                  <p className="text-sm text-red-600">{errors.personal_info.address.message}</p>
                )}
              </div>

              <Button
                type="button"
                onClick={nextStep}
                className="w-full"
              >
                Next Step <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          )}

          {/* Step 2: Business Information */}
          {step === 2 && (
            <div className="space-y-4">
              <div className="text-center mb-6">
                <h3 className="text-lg font-semibold">Business Information</h3>
                <p className="text-sm text-gray-600">Tell us about your business</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="business_type">Business Type *</Label>
                <Select
                  value={businessType}
                  onValueChange={(value: 'individual' | 'company') => setValue('business_info.business_type', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="individual">Individual Property Owner</SelectItem>
                    <SelectItem value="company">Company/Business</SelectItem>
                  </SelectContent>
                </Select>
                {errors.business_info?.business_type && (
                  <p className="text-sm text-red-600">{errors.business_info.business_type.message}</p>
                )}
              </div>

              {businessType === 'company' && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="business_name">Business Name *</Label>
                    <Input
                      id="business_name"
                      {...register('business_info.business_name')}
                      placeholder="Enter your business name"
                    />
                    {errors.business_info?.business_name && (
                      <p className="text-sm text-red-600">{errors.business_info.business_name.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="tax_id">Tax ID / Registration Number</Label>
                    <Input
                      id="tax_id"
                      {...register('business_info.tax_id')}
                      placeholder="Enter your tax ID or business registration number"
                    />
                    {errors.business_info?.tax_id && (
                      <p className="text-sm text-red-600">{errors.business_info.tax_id.message}</p>
                    )}
                  </div>
                </>
              )}

              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={prevStep}
                  className="flex-1"
                >
                  <ArrowLeft className="mr-2 h-4 w-4" /> Previous
                </Button>
                <Button
                  type="button"
                  onClick={nextStep}
                  className="flex-1"
                >
                  Next Step <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          {/* Step 3: Portfolio & Documents */}
          {step === 3 && (
            <div className="space-y-4">
              <div className="text-center mb-6">
                <h3 className="text-lg font-semibold">Property Portfolio & Documents</h3>
                <p className="text-sm text-gray-600">Describe your properties and upload verification documents</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="portfolio_description">Property Portfolio Description *</Label>
                <Textarea
                  id="portfolio_description"
                  {...register('portfolio_description')}
                  placeholder="Please describe your property portfolio, including types of properties, locations, and any relevant experience in property management..."
                  rows={4}
                />
                {errors.portfolio_description && (
                  <p className="text-sm text-red-600">{errors.portfolio_description.message}</p>
                )}
                <p className="text-xs text-gray-500">Minimum 50 characters required</p>
              </div>

              <div className="space-y-4">
                <Label>Verification Documents</Label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
                  <div className="text-center">
                    <Upload className="mx-auto h-12 w-12 text-gray-400" />
                    <div className="mt-4">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => fileInputRef.current?.click()}
                      >
                        Upload Documents
                      </Button>
                      <input
                        ref={fileInputRef}
                        type="file"
                        multiple
                        accept=".pdf,.jpg,.jpeg,.png"
                        onChange={handleFileUpload}
                        className="hidden"
                      />
                    </div>
                    <p className="mt-2 text-sm text-gray-500">
                      Upload ID, property documents, or business registration (PDF, JPG, PNG - Max 5MB each)
                    </p>
                  </div>
                </div>

                {uploadedFiles.length > 0 && (
                  <div className="space-y-2">
                    <Label>Uploaded Files ({uploadedFiles.length})</Label>
                    <div className="space-y-2">
                      {uploadedFiles.map((file, index) => (
                        <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                          <div className="flex items-center gap-2">
                            <FileText className="h-4 w-4 text-blue-600" />
                            <span className="text-sm">{file.name}</span>
                            <span className="text-xs text-gray-500">({(file.size / 1024 / 1024).toFixed(2)} MB)</span>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeFile(index)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  Document upload is optional but recommended for faster approval. You can upload additional documents later.
                </AlertDescription>
              </Alert>

              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={prevStep}
                  className="flex-1"
                >
                  <ArrowLeft className="mr-2 h-4 w-4" /> Previous
                </Button>
                <Button
                  type="button"
                  onClick={nextStep}
                  className="flex-1"
                >
                  Next Step <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          {/* Step 4: Account Security & Terms */}
          {step === 4 && (
            <div className="space-y-4">
              <div className="text-center mb-6">
                <h3 className="text-lg font-semibold">Account Security & Terms</h3>
                <p className="text-sm text-gray-600">Set up your account password and accept terms</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="password">Password *</Label>
                  <Input
                    id="password"
                    type="password"
                    {...register('password')}
                    placeholder="Enter a secure password"
                  />
                  {errors.password && (
                    <p className="text-sm text-red-600">{errors.password.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirm_password">Confirm Password *</Label>
                  <Input
                    id="confirm_password"
                    type="password"
                    {...register('confirm_password')}
                    placeholder="Confirm your password"
                  />
                  {errors.confirm_password && (
                    <p className="text-sm text-red-600">{errors.confirm_password.message}</p>
                  )}
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-start space-x-2">
                  <Checkbox
                    id="terms_accepted"
                    checked={termsAccepted}
                    onCheckedChange={(checked) => setValue('terms_accepted', checked as boolean)}
                  />
                  <div className="grid gap-1.5 leading-none">
                    <Label
                      htmlFor="terms_accepted"
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      I accept the terms and conditions *
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      By registering, you agree to our{' '}
                      <a href="/terms" className="text-blue-600 hover:underline" target="_blank">
                        Terms of Service
                      </a>{' '}
                      and{' '}
                      <a href="/privacy" className="text-blue-600 hover:underline" target="_blank">
                        Privacy Policy
                      </a>
                    </p>
                  </div>
                </div>
                {errors.terms_accepted && (
                  <p className="text-sm text-red-600">{errors.terms_accepted.message}</p>
                )}
              </div>

              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>
                  Your application will be reviewed by our team. You'll receive an email notification once approved, typically within 1-2 business days.
                </AlertDescription>
              </Alert>

              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={prevStep}
                  className="flex-1"
                >
                  <ArrowLeft className="mr-2 h-4 w-4" /> Previous
                </Button>
                <Button
                  type="submit"
                  className="flex-1"
                  disabled={isLoading || !termsAccepted}
                >
                  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Complete Registration
                </Button>
              </div>
            </div>
          )}
        </form>
      </CardContent>
    </Card>
  )
}

// Helper function to get step titles
function getStepTitle(step: number): string {
  const titles = {
    1: 'Personal Information',
    2: 'Business Details',
    3: 'Portfolio & Documents',
    4: 'Security & Terms'
  }
  return titles[step as keyof typeof titles] || ''
}