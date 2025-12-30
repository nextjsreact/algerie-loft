'use client'

import { useState } from 'react'
import { RoleSelector, UserRoleType } from '@/components/auth/role-selector'
import { ClientRegistrationForm } from '@/components/auth/client-registration-form'
import { PartnerRegistrationForm } from '@/components/auth/partner-registration-form'

interface RegisterPageClientProps {
  locale: string
}

export function RegisterPageClient({ locale }: RegisterPageClientProps) {
  const [selectedRole, setSelectedRole] = useState<UserRoleType | null>(null)

  const handleRoleSelect = (role: UserRoleType) => {
    setSelectedRole(role)
  }

  const handleBack = () => {
    setSelectedRole(null)
  }

  if (selectedRole === 'client') {
    return <ClientRegistrationForm onBack={handleBack} locale={locale} />
  }

  if (selectedRole === 'partner') {
    return <PartnerRegistrationForm onBack={handleBack} locale={locale} />
  }

  if (selectedRole === 'employee') {
    // Redirect to existing employee registration or login
    window.location.href = `/${locale}/login?type=employee`
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 flex items-center justify-center p-4">
      <RoleSelector 
        onRoleSelect={handleRoleSelect} 
        selectedRole={selectedRole || undefined}
      />
    </div>
  )
}