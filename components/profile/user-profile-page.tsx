'use client'

import { useState } from 'react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { 
  User, 
  Mail, 
  Phone, 
  Calendar, 
  Shield, 
  Building2, 
  Home,
  Edit,
  Settings,
  ArrowLeft
} from 'lucide-react'
import Link from 'next/link'

interface UserProfile {
  id: string
  email: string
  full_name: string
  role: string
  avatar_url: string
  phone: string
  created_at: string
}

interface UserProfilePageProps {
  user: UserProfile
  locale: string
}

export function UserProfilePage({ user, locale }: UserProfilePageProps) {
  const getRoleConfig = (role: string) => {
    switch (role) {
      case 'client':
        return {
          label: 'Client',
          color: 'bg-blue-500',
          icon: Home,
          description: 'Réservation de lofts et gestion des séjours'
        }
      case 'partner':
        return {
          label: 'Partenaire',
          color: 'bg-green-500',
          icon: Building2,
          description: 'Gestion de propriétés et partenariats'
        }
      case 'admin':
        return {
          label: 'Administrateur',
          color: 'bg-red-500',
          icon: Shield,
          description: 'Administration complète de la plateforme'
        }
      case 'manager':
        return {
          label: 'Manager',
          color: 'bg-blue-500',
          icon: Shield,
          description: 'Gestion des opérations et équipes'
        }
      case 'executive':
        return {
          label: 'Exécutif',
          color: 'bg-purple-500',
          icon: Shield,
          description: 'Direction et supervision'
        }
      case 'superuser':
        return {
          label: 'Superuser',
          color: 'bg-purple-600',
          icon: Shield,
          description: 'Accès système complet et administration avancée'
        }
      default:
        return {
          label: 'Utilisateur',
          color: 'bg-gray-500',
          icon: User,
          description: 'Utilisateur de la plateforme'
        }
    }
  }

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const roleConfig = getRoleConfig(user.role)
  const RoleIcon = roleConfig.icon

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <Link 
            href={`/${locale}`}
            className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-4"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Retour à l'accueil
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Mon Profil
          </h1>
          <p className="text-muted-foreground mt-2">
            Gérez vos informations personnelles et vos préférences
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Profile Card */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader className="text-center">
                <div className="flex justify-center mb-4">
                  <div className="relative">
                    <Avatar className="h-24 w-24 border-4 border-white shadow-lg">
                      <AvatarImage src={user.avatar_url} alt={user.full_name || user.email} />
                      <AvatarFallback className={`${roleConfig.color} text-white text-2xl font-bold`}>
                        {getInitials(user.full_name || user.email)}
                      </AvatarFallback>
                    </Avatar>
                    {/* Role indicator */}
                    <div className={`absolute -bottom-2 -right-2 h-8 w-8 ${roleConfig.color} rounded-full flex items-center justify-center shadow-lg`}>
                      <RoleIcon className="h-4 w-4 text-white" />
                    </div>
                  </div>
                </div>
                <CardTitle className="text-xl">
                  {user.full_name || 'Utilisateur'}
                </CardTitle>
                <Badge variant="secondary" className={`${roleConfig.color} text-white w-fit mx-auto`}>
                  <RoleIcon className="h-3 w-3 mr-1" />
                  {roleConfig.label}
                </Badge>
                <p className="text-sm text-muted-foreground mt-2">
                  {roleConfig.description}
                </p>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <Button asChild className="w-full">
                    <Link href={`/${locale}/profile/edit`}>
                      <Edit className="mr-2 h-4 w-4" />
                      Modifier le profil
                    </Link>
                  </Button>
                  <Button variant="outline" asChild className="w-full">
                    <Link href={`/${locale}/settings`}>
                      <Settings className="mr-2 h-4 w-4" />
                      Paramètres
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Information Details */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <User className="mr-2 h-5 w-5" />
                  Informations personnelles
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Email */}
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0">
                    <div className="h-10 w-10 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
                      <Mail className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    </div>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-sm font-medium text-gray-900 dark:text-white">
                      Adresse email
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {user.email}
                    </p>
                  </div>
                </div>

                <Separator />

                {/* Phone */}
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0">
                    <div className="h-10 w-10 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center">
                      <Phone className="h-5 w-5 text-green-600 dark:text-green-400" />
                    </div>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-sm font-medium text-gray-900 dark:text-white">
                      Numéro de téléphone
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {user.phone || 'Non renseigné'}
                    </p>
                  </div>
                </div>

                <Separator />

                {/* Role */}
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0">
                    <div className={`h-10 w-10 ${roleConfig.color.replace('bg-', 'bg-').replace('500', '100')} dark:${roleConfig.color.replace('bg-', 'bg-').replace('500', '900')} rounded-lg flex items-center justify-center`}>
                      <RoleIcon className={`h-5 w-5 ${roleConfig.color.replace('bg-', 'text-').replace('500', '600')} dark:${roleConfig.color.replace('bg-', 'text-').replace('500', '400')}`} />
                    </div>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-sm font-medium text-gray-900 dark:text-white">
                      Type de compte
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {roleConfig.label} - {roleConfig.description}
                    </p>
                  </div>
                </div>

                <Separator />

                {/* Member since */}
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0">
                    <div className="h-10 w-10 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center">
                      <Calendar className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                    </div>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-sm font-medium text-gray-900 dark:text-white">
                      Membre depuis
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {formatDate(user.created_at)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}