"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Search, User, Shield, Key, AlertCircle } from "lucide-react"
import { useTranslations } from 'next-intl';
import { useEffect, useState } from "react"
import { getSession } from "@/lib/auth"
import type { AuthSession } from "@/lib/types"
import { RoleBasedAccess } from "@/components/auth/role-based-access"

export default function UserPasswordManagementPage() {
  const t = useTranslations('settings.userPasswords');
  const [session, setSession] = useState<AuthSession | null>(null)
  const [loading, setLoading] = useState(true)
  const [users, setUsers] = useState<Array<{id: string, full_name: string, email: string, role: string}>>([])
  const [filteredUsers, setFilteredUsers] = useState<Array<{id: string, full_name: string, email: string, role: string}>>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedUser, setSelectedUser] = useState<string>("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [isChangingPassword, setIsChangingPassword] = useState(false)
  const [message, setMessage] = useState<{type: 'success' | 'error' | null, text: string}>({type: null, text: ""})

  useEffect(() => {
    async function fetchSession() {
      try {
        const sessionData = await getSession()
        setSession(sessionData)
        if (sessionData) {
          await fetchUsers()
        }
      } catch (error) {
        console.error('Failed to fetch session:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchSession()
  }, [])

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/users/search?q=')
      if (response.ok) {
        const allUsers = await response.json()
        // Exclure l'administrateur lui-même de la liste
        const filteredUsers = allUsers.filter((user: any) => user.id !== session?.user.id)
        setUsers(filteredUsers)
        setFilteredUsers(filteredUsers)
      }
    } catch (error) {
      console.error('Error fetching users:', error)
    }
  }

  const handleSearch = (term: string) => {
    setSearchTerm(term)
    if (term.trim() === "") {
      setFilteredUsers(users)
    } else {
      const filtered = users.filter(user => 
        user.full_name?.toLowerCase().includes(term.toLowerCase()) ||
        user.email.toLowerCase().includes(term.toLowerCase())
      )
      setFilteredUsers(filtered)
    }
  }

  const handlePasswordChange = async () => {
    if (!selectedUser) {
      setMessage({type: 'error', text: t('selectUserError')})
      return
    }

    if (newPassword !== confirmPassword) {
      setMessage({type: 'error', text: t('passwordMismatchError')})
      return
    }

    if (newPassword.length < 6) {
      setMessage({type: 'error', text: t('passwordLengthError')})
      return
    }

    setIsChangingPassword(true)
    setMessage({type: null, text: ""})

    try {
      const response = await fetch('/api/admin/update-user-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: selectedUser,
          new_password: newPassword,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        setMessage({type: 'success', text: t('passwordUpdateSuccess', { 
          name: users.find(u => u.id === selectedUser)?.full_name || users.find(u => u.id === selectedUser)?.email 
        })})
        setNewPassword("")
        setConfirmPassword("")
        setSelectedUser("")
        // Rafraîchir la liste des utilisateurs
        await fetchUsers()
      } else {
        setMessage({type: 'error', text: data.error || t('passwordUpdateError')})
      }
    } catch (error) {
      setMessage({type: 'error', text: t('passwordUpdateError')})
    } finally {
      setIsChangingPassword(false)
    }
  }

  if (loading) {
    return <div className="p-8">{t('common.loading')}</div>
  }

  return (
    <RoleBasedAccess 
      userRole={session?.user.role || 'guest'}
      allowedRoles={['admin']}
      showFallback={true}
    >
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t('title')}</h1>
          <p className="text-muted-foreground">{t('subtitle')}</p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                {t('userSelection.title')}
              </CardTitle>
              <CardDescription>{t('userSelection.description')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="search">{t('userSelection.searchLabel')}</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="search"
                    value={searchTerm}
                    onChange={(e) => handleSearch(e.target.value)}
                    placeholder={t('userSelection.searchPlaceholder')}
                    className="pl-10"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="userSelect">{t('userSelection.selectLabel')}</Label>
                <div className="space-y-1 max-h-64 overflow-y-auto">
                  {filteredUsers.map((user) => (
                    <label
                      key={user.id}
                      className={`flex items-center space-x-3 p-3 border rounded-lg cursor-pointer hover:bg-muted transition-colors ${
                        selectedUser === user.id ? 'border-primary bg-primary/10' : 'border-border'
                      }`}
                    >
                      <input
                        type="radio"
                        name="selectedUser"
                        value={user.id}
                        checked={selectedUser === user.id}
                        onChange={(e) => setSelectedUser(e.target.value)}
                        className="h-4 w-4"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">{user.full_name || user.email}</span>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {user.email} • <span className="capitalize">{t(`roles.${user.role}`)}</span>
                        </div>
                      </div>
                    </label>
                  ))}
                  {filteredUsers.length === 0 && searchTerm && (
                    <div className="text-center py-8 text-muted-foreground">
                      {t('userSelection.noResults')}
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Key className="h-5 w-5" />
                {t('passwordForm.title')}
              </CardTitle>
              <CardDescription>{t('passwordForm.description')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {selectedUser && (
                <div className="p-3 bg-muted rounded-lg">
                  <p className="text-sm">
                    {t('passwordForm.selectedUser', { 
                      name: users.find(u => u.id === selectedUser)?.full_name || users.find(u => u.id === selectedUser)?.email 
                    })}
                  </p>
                </div>
              )}
              
              <div className="space-y-2">
                <Label htmlFor="newPassword">{t('passwordForm.newPassword')}</Label>
                <Input
                  id="newPassword"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder={t('passwordForm.newPasswordPlaceholder')}
                  disabled={!selectedUser}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">{t('passwordForm.confirmPassword')}</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder={t('passwordForm.confirmPasswordPlaceholder')}
                  disabled={!selectedUser}
                />
              </div>
              
              {message.type && (
                <div className={`flex items-center space-x-2 p-3 rounded-lg ${
                  message.type === 'success' ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-800 border border-red-200'
                }`}>
                  {message.type === 'error' ? (
                    <AlertCircle className="h-4 w-4 flex-shrink-0" />
                  ) : (
                    <div className="h-4 w-4 rounded-full bg-green-400 flex-shrink-0" />
                  )}
                  <span className="text-sm">{message.text}</span>
                </div>
              )}
              
              <Button
                onClick={handlePasswordChange}
                disabled={!selectedUser || isChangingPassword || !newPassword || !confirmPassword}
                className="w-full"
              >
                {isChangingPassword ? t('passwordForm.buttonProgress') : t('passwordForm.button')}
              </Button>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>{t('security.title')}</CardTitle>
            <CardDescription>{t('security.description')}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4" />
                {t('security.warning1')}
              </div>
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4" />
                {t('security.warning2')}
              </div>
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4" />
                {t('security.warning3')}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </RoleBasedAccess>
  )
}
