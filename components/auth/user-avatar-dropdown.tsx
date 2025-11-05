'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  User, 
  Settings, 
  LogOut, 
  Shield, 
  Building2, 
  Home,
  Phone,
  Mail,
  Edit
} from 'lucide-react'
import { createClient } from '@/utils/supabase/client'

interface UserAvatarDropdownProps {
  locale: string
}

interface UserProfile {
  id: string
  email: string
  full_name?: string
  role: string
  avatar_url?: string
  phone?: string
}

export function UserAvatarDropdown({ locale }: UserAvatarDropdownProps) {
  const [user, setUser] = useState<UserProfile | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const getUser = async () => {
      try {
        // Use our enhanced authentication system instead of raw Supabase auth
        const response = await fetch('/api/auth/session')
        const sessionData = await response.json()
        
        if (!sessionData.user) {
          setIsLoading(false)
          return
        }

        console.log('🔄 Avatar: Loading user with enhanced auth, role:', sessionData.user.role)

        setUser({
          id: sessionData.user.id,
          email: sessionData.user.email || '',
          full_name: sessionData.user.full_name,
          role: sessionData.user.role, // Use the role from our enhanced auth system
          avatar_url: sessionData.user.avatar_url,
          phone: sessionData.user.phone
        })
      } catch (err) {
        console.error('Error fetching user session:', err)
        setIsLoading(false)
      } finally {
        setIsLoading(false)
      }
    }

    getUser()
    
    // Also refresh when component mounts or when URL changes
    const handleFocus = () => getUser()
    window.addEventListener('focus', handleFocus)
    
    return () => window.removeEventListener('focus', handleFocus)

    // Listen for auth changes and refresh user data
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('🔄 Auth state change:', event)
        
        if (event === 'SIGNED_IN' || event === 'USER_UPDATED') {
          // Refresh user data using our enhanced auth system
          await getUser()
        } else if (event === 'SIGNED_OUT') {
          setUser(null)
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [supabase])

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut()
      router.push(`/${locale}`)
    } catch (error) {
      console.error('Logout error:', error)
    }
  }

  const getRoleConfig = (role: string) => {
    switch (role) {
      case 'superuser':
        return {
          label: 'Superuser',
          color: 'bg-purple-600',
          icon: Shield,
          dashboard: `/${locale}/admin/superuser/dashboard`
        }
      case 'client':
        return {
          label: 'Client',
          color: 'bg-blue-500',
          icon: Home,
          dashboard: `/${locale}/client/dashboard`
        }
      case 'partner':
        return {
          label: 'Partenaire',
          color: 'bg-green-500',
          icon: Building2,
          dashboard: `/${locale}/partner/dashboard`
        }
      case 'admin':
      case 'manager':
      case 'executive':
        return {
          label: 'Admin',
          color: 'bg-red-500',
          icon: Shield,
          dashboard: `/${locale}/app/dashboard`
        }
      case 'member':
        // If role is 'member', check URL to determine actual role
        if (typeof window !== 'undefined') {
          if (window.location.pathname.includes('/client/')) {
            return {
              label: 'Client',
              color: 'bg-blue-500',
              icon: Home,
              dashboard: `/${locale}/client/dashboard`
            }
          }
          if (window.location.pathname.includes('/partner/')) {
            return {
              label: 'Partenaire',
              color: 'bg-green-500',
              icon: Building2,
              dashboard: `/${locale}/partner/dashboard`
            }
          }
        }
        // Default to client for members
        return {
          label: 'Client',
          color: 'bg-blue-500',
          icon: Home,
          dashboard: `/${locale}/client/dashboard`
        }
      default:
        return {
          label: 'Client',
          color: 'bg-blue-500',
          icon: Home,
          dashboard: `/${locale}/client/dashboard`
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

  if (isLoading) {
    return (
      <div className="h-10 w-10 rounded-full bg-gray-200 dark:bg-gray-700 animate-pulse" />
    )
  }

  if (!user) {
    return null
  }

  const roleConfig = getRoleConfig(user.role)
  const RoleIcon = roleConfig.icon

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-10 w-10 rounded-full p-0">
          <Avatar className={`h-10 w-10 border-2 border-${roleConfig.color.replace('bg-', '')}`}>
            <AvatarImage src={user.avatar_url} alt={user.full_name || user.email} />
            <AvatarFallback className={`${roleConfig.color} text-white font-semibold`}>
              {getInitials(user.full_name || user.email)}
            </AvatarFallback>
          </Avatar>
          {/* Role indicator */}
          <div className={`absolute -bottom-1 -right-1 h-4 w-4 ${roleConfig.color} rounded-full flex items-center justify-center`}>
            <RoleIcon className="h-2.5 w-2.5 text-white" />
          </div>
        </Button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent className="w-80" align="end" forceMount>
        {/* User Info Header */}
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-2">
            <div className="flex items-center space-x-3">
              <Avatar className="h-12 w-12">
                <AvatarImage src={user.avatar_url} alt={user.full_name || user.email} />
                <AvatarFallback className={`${roleConfig.color} text-white`}>
                  {getInitials(user.full_name || user.email)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <p className="text-sm font-medium leading-none">
                  {user.full_name || 'Utilisateur'}
                </p>
                <div className="flex items-center gap-2 mt-1">
                  <Mail className="h-3 w-3 text-muted-foreground" />
                  <p className="text-xs text-muted-foreground truncate">
                    {user.email}
                  </p>
                </div>
                {user.phone && (
                  <div className="flex items-center gap-2 mt-1">
                    <Phone className="h-3 w-3 text-muted-foreground" />
                    <p className="text-xs text-muted-foreground">
                      {user.phone}
                    </p>
                  </div>
                )}
              </div>
            </div>
            <Badge variant="secondary" className={`${roleConfig.color} text-white w-fit`}>
              <RoleIcon className="h-3 w-3 mr-1" />
              {roleConfig.label}
            </Badge>
          </div>
        </DropdownMenuLabel>
        
        <DropdownMenuSeparator />
        
        {/* Navigation Items */}
        <DropdownMenuItem onClick={() => router.push(roleConfig.dashboard)}>
          <RoleIcon className="mr-2 h-4 w-4" />
          <span>Mon Dashboard</span>
        </DropdownMenuItem>
        
        <DropdownMenuItem onClick={() => router.push(`/${locale}/profile`)}>
          <User className="mr-2 h-4 w-4" />
          <span>Mon Profil</span>
        </DropdownMenuItem>
        
        <DropdownMenuItem onClick={() => router.push(`/${locale}/profile/edit`)}>
          <Edit className="mr-2 h-4 w-4" />
          <span>Modifier le Profil</span>
        </DropdownMenuItem>
        
        <DropdownMenuItem onClick={() => router.push(`/${locale}/settings`)}>
          <Settings className="mr-2 h-4 w-4" />
          <span>Paramètres</span>
        </DropdownMenuItem>
        
        <DropdownMenuSeparator />
        
        <DropdownMenuItem onClick={handleLogout} className="text-red-600 dark:text-red-400">
          <LogOut className="mr-2 h-4 w-4" />
          <span>Se déconnecter</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}