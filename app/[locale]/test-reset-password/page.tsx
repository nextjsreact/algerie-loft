"use client"

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Eye, EyeOff, Lock, CheckCircle } from "lucide-react"
import { z } from "zod"
import { useRouter } from "next/navigation"

const resetPasswordSchema = z.object({
  password: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
})

type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>

export default function TestResetPasswordPage({ params }: { params: Promise<{ locale: string }> }) {
  const [isLoading, setIsLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [locale, setLocale] = useState('fr')

  const router = useRouter()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
  })

  useEffect(() => {
    const getLocale = async () => {
      const { locale } = await params
      setLocale(locale)
    }
    getLocale()
  }, [params])

  const onSubmit = async (data: ResetPasswordFormData) => {
    setIsLoading(true)
    setError("")

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000))

      console.log('Test password reset successful')
      setSuccess(true)

      setTimeout(() => {
        router.push(`/${locale}/login`)
      }, 3000)
    } catch (err) {
      setError("An unexpected error occurred. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  if (success) {
    return (
      <div style={{ padding: '20px', maxWidth: '500px', margin: '0 auto', textAlign: 'center' }}>
        <div style={{ padding: '40px 20px', border: '1px solid #4caf50', borderRadius: '8px', backgroundColor: '#f1f8e9' }}>
          <div style={{ color: '#2e7d32', fontSize: '24px', marginBottom: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
            <CheckCircle style={{ height: '24px', width: '24px' }} />
            Password Reset Successful
          </div>
          <p style={{ color: '#558b2f', marginBottom: '24px' }}>
            Your password has been successfully updated. You will be redirected to the login page shortly.
          </p>
          <Button
            onClick={() => router.push(`/${locale}/login`)}
            style={{ backgroundColor: '#4caf50', color: 'white', border: 'none', padding: '12px 24px', borderRadius: '4px', cursor: 'pointer' }}
          >
            Go to Login
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div style={{ padding: '20px', maxWidth: '500px', margin: '0 auto' }}>
      <h1>Reset Your Password</h1>
      <p style={{ marginBottom: '20px', color: '#666' }}>
        Enter your new password below
      </p>

      <div style={{ marginBottom: '20px', padding: '15px', backgroundColor: '#e3f2fd', border: '1px solid #2196f3', borderRadius: '4px' }}>
        <p style={{ margin: 0, color: '#1976d2', fontSize: '14px' }}>
          🔧 This is a simple test page for the reset password functionality
        </p>
      </div>

      <div style={{ marginBottom: '20px', padding: '15px', backgroundColor: '#fff3e0', border: '1px solid #ff9800', borderRadius: '4px' }}>
        <p style={{ margin: 0, color: '#f57c00', fontSize: '14px', fontWeight: 'bold' }}>
          🧪 Test Link (use this if email doesn't work):
        </p>
        <p style={{ margin: '8px 0 0 0', color: '#f57c00', fontSize: '12px', wordBreak: 'break-all' }}>
          <a href="/fr/reset-password?access_token=test_access_token&refresh_token=test_refresh_token"
             style={{ color: '#f57c00', textDecoration: 'underline' }}>
            http://localhost:3000/fr/reset-password?access_token=test_access_token&refresh_token=test_refresh_token
          </a>
        </p>
      </div>

      <div style={{ marginBottom: '20px', padding: '15px', backgroundColor: '#e8f5e8', border: '1px solid #4caf50', borderRadius: '4px' }}>
        <p style={{ margin: 0, color: '#2e7d32', fontSize: '14px', fontWeight: 'bold' }}>
          🎯 Complete Test Flow (No Email Needed):
        </p>
        <p style={{ margin: '8px 0 0 0', color: '#2e7d32', fontSize: '12px' }}>
          1. Click the test link above<br/>
          2. Enter a new password<br/>
          3. Confirm the password<br/>
          4. Click "Update Password"<br/>
          5. You should be redirected to login page
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div>
          <Label htmlFor="password">New Password</Label>
          <div style={{ position: 'relative' }}>
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              placeholder="Enter your new password"
              {...register("password")}
            />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              style={{
                position: 'absolute',
                right: '8px',
                top: '50%',
                transform: 'translateY(-50%)',
                height: '32px',
                width: '32px',
                padding: 0
              }}
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? (
                <EyeOff style={{ height: '16px', width: '16px' }} />
              ) : (
                <Eye style={{ height: '16px', width: '16px' }} />
              )}
            </Button>
          </div>
          {errors.password && (
            <p style={{ color: '#d32f2f', fontSize: '14px', marginTop: '4px' }}>{errors.password.message}</p>
          )}
        </div>

        <div>
          <Label htmlFor="confirmPassword">Confirm New Password</Label>
          <div style={{ position: 'relative' }}>
            <Input
              id="confirmPassword"
              type={showConfirmPassword ? "text" : "password"}
              placeholder="Confirm your new password"
              {...register("confirmPassword")}
            />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              style={{
                position: 'absolute',
                right: '8px',
                top: '50%',
                transform: 'translateY(-50%)',
                height: '32px',
                width: '32px',
                padding: 0
              }}
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            >
              {showConfirmPassword ? (
                <EyeOff style={{ height: '16px', width: '16px' }} />
              ) : (
                <Eye style={{ height: '16px', width: '16px' }} />
              )}
            </Button>
          </div>
          {errors.confirmPassword && (
            <p style={{ color: '#d32f2f', fontSize: '14px', marginTop: '4px' }}>{errors.confirmPassword.message}</p>
          )}
        </div>

        <Button
          type="submit"
          disabled={isLoading}
          style={{ height: '48px', fontSize: '16px' }}
        >
          {isLoading ? "Updating Password..." : "Update Password"}
        </Button>
      </form>

      <div style={{ marginTop: '24px', paddingTop: '16px', borderTop: '1px solid #ddd' }}>
        <Button
          onClick={() => router.push(`/${locale}/login`)}
          variant="outline"
          style={{ width: '100%' }}
        >
          Back to Login
        </Button>
      </div>
    </div>
  )
}