'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Users, Building, UserCheck } from 'lucide-react'
import { useTranslations } from 'next-intl'

interface RoleSelectorProps {
  onRoleSelect: (role: 'client' | 'partner' | 'employee') => void
}

export function RoleSelector({ onRoleSelect }: RoleSelectorProps) {
  const t = useTranslations('auth')
  const [selectedRole, setSelectedRole] = useState<'client' | 'partner' | 'employee' | null>(null)

  const roles = [
    {
      id: 'client' as const,
      title: t('roleSelector.client.title'),
      description: t('roleSelector.client.description'),
      icon: Users,
      color: 'bg-blue-50 border-blue-200 hover:bg-blue-100',
      iconColor: 'text-blue-600'
    },
    {
      id: 'partner' as const,
      title: t('roleSelector.partner.title'),
      description: t('roleSelector.partner.description'),
      icon: Building,
      color: 'bg-green-50 border-green-200 hover:bg-green-100',
      iconColor: 'text-green-600'
    },
    {
      id: 'employee' as const,
      title: t('roleSelector.employee.title'),
      description: t('roleSelector.employee.description'),
      icon: UserCheck,
      color: 'bg-purple-50 border-purple-200 hover:bg-purple-100',
      iconColor: 'text-purple-600'
    }
  ]

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900">
          {t('roleSelector.title')}
        </h2>
        <p className="mt-2 text-gray-600">
          {t('roleSelector.subtitle')}
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {roles.map((role) => {
          const Icon = role.icon
          const isSelected = selectedRole === role.id
          
          return (
            <Card
              key={role.id}
              className={`cursor-pointer transition-all duration-200 ${role.color} ${
                isSelected ? 'ring-2 ring-offset-2 ring-blue-500' : ''
              }`}
              onClick={() => setSelectedRole(role.id)}
            >
              <CardHeader className="text-center pb-4">
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-white">
                  <Icon className={`h-6 w-6 ${role.iconColor}`} />
                </div>
                <CardTitle className="text-lg">{role.title}</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <CardDescription className="text-center text-sm">
                  {role.description}
                </CardDescription>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {selectedRole && (
        <div className="flex justify-center">
          <Button
            onClick={() => onRoleSelect(selectedRole)}
            size="lg"
            className="px-8"
          >
            {t('roleSelector.continue')}
          </Button>
        </div>
      )}
    </div>
  )
}