'use client'

import { useState } from 'react'
import { RoleSelector } from './role-selector'
import { ClientRegistrationForm } from './client-registration-form'
import { PartnerRegistrationForm } from './partner-registration-form'
import { PartnerRegistrationSuccess } from './partner-registration-success'
import { ClientRegistrationSuccess } from './client-registration-success'
import { useRouter } from 'next/navigation'
import { useParams } from 'next/navigation'

export type UserRoleType = 'client' | 'partner' | 'employee'

export function RegistrationFlow() {
  const [selectedRole, setSelectedRole] = useState<UserRoleType | null>(null)
  const [registrationComplete, setRegistrationComplete] = useState(false)
  const [requiresApproval, setRequiresApproval] = useState(false)
  const router = useRouter()
  const params = useParams()
  const locale = params.locale as string

  const handleRoleSelect = (role: UserRoleType) => {
    if (role === 'employee') {
      // Redirect to existing employee login/registration
      router.push(`/${locale}/login?type=employee`)
      return
    }
    setSelectedRole(role)
  }

  const handleBack = () => {
    setSelectedRole(null)
    setRegistrationComplete(false)
    setRequiresApproval(false)
  }

  const handleRegistrationSuccess = (needsApproval: boolean = false) => {
    setRegistrationComplete(true)
    setRequiresApproval(needsApproval)
  }

  // Show success page after registration
  if (registrationComplete) {
    if (selectedRole === 'partner') {
      return <PartnerRegistrationSuccess locale={locale} />
    } else if (selectedRole === 'client') {
      return <ClientRegistrationSuccess locale={locale} />
    }
  }

  // Show role-specific registration form
  if (selectedRole === 'client') {
    return (
      <ClientRegistrationForm 
        onBack={handleBack} 
        onSuccess={() => handleRegistrationSuccess(false)}
      />
    )
  }

  if (selectedRole === 'partner') {
    return (
      <PartnerRegistrationForm 
        onBack={handleBack} 
        onSuccess={() => handleRegistrationSuccess(true)}
      />
    )
  }

  // Show role selector by default
  return <RoleSelector onRoleSelect={handleRoleSelect} />
}