'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { 
  Users, 
  Search, 
  Filter, 
  UserCheck, 
  UserX, 
  Shield, 
  Mail, 
  Calendar,
  MoreHorizontal,
  Edit,
  Trash2,
  Loader2
} from 'lucide-react'
import { useTranslations } from 'next-intl'
import { UserRole } from '@/lib/types'

interface UserProfile {
  id: string
  full_name: string
  email: string
  role: UserRole
  created_at: string
  last_sign_in_at?: string
  email_confirmed_at?: string
  is_active: boolean
  partner_profile?: {
    id: string
    verification_status: string
    business_name?: string
  }
}

interface UserFilters {
  role?: UserRole | 'all'
  status?: 'active' | 'inactive' | 'all'
  search?: string
}

export function UserManagement() {
  const t = useTranslations('admin.users')
  const [users, setUsers] = useState<UserProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState<UserFilters>({ role: 'all', status: 'all' })
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [processing, setProcessing] = useState(false)

  useEffect(() => {
    fetchUsers()
  }, [filters])

  const fetchUsers = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (filters.role && filters.role !== 'all') params.append('role', filters.role)
      if (filters.status && filters.status !== 'all') params.append('status', filters.status)
      if (filters.search) params.append('search', filters.search)

      const response = await fetch(`/api/admin/users?${params.toString()}`)
      if (response.ok) {
        const data = await response.json()
        setUsers(data)
      }
    } catch (error) {
      console.error('Error fetching users:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleRoleChange = async (userId: string, newRole: UserRole) => {
    setProcessing(true)
    try {
      const response = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, role: newRole })
      })

      if (response.ok) {
        await fetchUsers()
      }
    } catch (error) {
      console.error('Error updating user role:', error)
    } finally {
      setProcessing(false)
    }
  }

  const handleUserStatusToggle = async (userId: string, isActive: boolean) => {
    setProcessing(true)
    try {
      const response = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, is_active: !isActive })
      })

      if (response.ok) {
        await fetchUsers()
      }
    } catch (error) {
      console.error('Error updating user status:', error)
    } finally {
      setProcessing(false)
    }
  }

  const handleDeleteUser = async () => {
    if (!selectedUser) return
    
    setProcessing(true)
    try {
      const response = await fetch('/api/admin/users', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: selectedUser.id })
      })

      if (response.ok) {
        await fetchUsers()
        setIsDeleteDialogOpen(false)
        setSelectedUser(null)
      }
    } catch (error) {
      console.error('Error deleting user:', error)
    } finally {
      setProcessing(false)
    }
  }

  const getRoleBadge = (role: UserRole) => {
    const roleColors = {
      admin: 'bg-red-100 text-red-800 border-red-200',
      manager: 'bg-blue-100 text-blue-800 border-blue-200',
      executive: 'bg-purple-100 text-purple-800 border-purple-200',
      member: 'bg-green-100 text-green-800 border-green-200',
      client: 'bg-orange-100 text-orange-800 border-orange-200',
      partner: 'bg-indigo-100 text-indigo-800 border-indigo-200',
      guest: 'bg-gray-100 text-gray-800 border-gray-200'
    }

    return (
      <Badge variant="outline" className={roleColors[role]}>
        <Shield className="w-3 h-3 mr-1" />
        {t(`roles.${role}`)}
      </Badge>
    )
  }

  const getStatusBadge = (user: UserProfile) => {
    if (!user.is_active) {
      return <Badge variant="outline" className="text-red-600 border-red-600">
        <UserX className="w-3 h-3 mr-1" />
        {t('status.inactive')}
      </Badge>
    }

    if (!user.email_confirmed_at) {
      return <Badge variant="outline" className="text-yellow-600 border-yellow-600">
        <Mail className="w-3 h-3 mr-1" />
        {t('status.unverified')}
      </Badge>
    }

    return <Badge variant="outline" className="text-green-600 border-green-600">
      <UserCheck className="w-3 h-3 mr-1" />
      {t('status.active')}
    </Badge>
  }

  const filteredUsers = users.filter(user => {
    if (filters.role && filters.role !== 'all' && user.role !== filters.role) return false
    if (filters.status && filters.status !== 'all') {
      if (filters.status === 'active' && !user.is_active) return false
      if (filters.status === 'inactive' && user.is_active) return false
    }
    if (filters.search) {
      const searchLower = filters.search.toLowerCase()
      return (
        user.full_name?.toLowerCase().includes(searchLower) ||
        user.email.toLowerCase().includes(searchLower) ||
        user.partner_profile?.business_name?.toLowerCase().includes(searchLower)
      )
    }
    return true
  })

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Users className="w-6 h-6" />
            {t('title')}
          </h2>
          <p className="text-gray-600">{t('description')}</p>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="w-4 h-4" />
            {t('filters.title')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="search">{t('filters.search')}</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  id="search"
                  placeholder={t('filters.searchPlaceholder')}
                  value={filters.search || ''}
                  onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                  className="pl-10"
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor="role">{t('filters.role')}</Label>
              <Select value={filters.role || 'all'} onValueChange={(value) => setFilters(prev => ({ ...prev, role: value as UserRole | 'all' }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('filters.allRoles')}</SelectItem>
                  <SelectItem value="admin">{t('roles.admin')}</SelectItem>
                  <SelectItem value="manager">{t('roles.manager')}</SelectItem>
                  <SelectItem value="executive">{t('roles.executive')}</SelectItem>
                  <SelectItem value="member">{t('roles.member')}</SelectItem>
                  <SelectItem value="client">{t('roles.client')}</SelectItem>
                  <SelectItem value="partner">{t('roles.partner')}</SelectItem>
                  <SelectItem value="guest">{t('roles.guest')}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="status">{t('filters.status')}</Label>
              <Select value={filters.status || 'all'} onValueChange={(value) => setFilters(prev => ({ ...prev, status: value as 'active' | 'inactive' | 'all' }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('filters.allStatuses')}</SelectItem>
                  <SelectItem value="active">{t('status.active')}</SelectItem>
                  <SelectItem value="inactive">{t('status.inactive')}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-end">
              <Button onClick={fetchUsers} disabled={loading}>
                {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Search className="w-4 h-4 mr-2" />}
                {t('filters.apply')}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Users List */}
      <Card>
        <CardHeader>
          <CardTitle>{t('usersList.title')} ({filteredUsers.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin" />
            </div>
          ) : filteredUsers.length === 0 ? (
            <Alert>
              <AlertDescription>{t('usersList.noUsers')}</AlertDescription>
            </Alert>
          ) : (
            <div className="space-y-4">
              {filteredUsers.map((user) => (
                <div key={user.id} className="border rounded-lg p-4 hover:bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold">{user.full_name || user.email}</h3>
                        {getRoleBadge(user.role)}
                        {getStatusBadge(user)}
                        {user.partner_profile && (
                          <Badge variant="outline" className="text-purple-600 border-purple-600">
                            {t('partnerStatus', { status: user.partner_profile.verification_status })}
                          </Badge>
                        )}
                      </div>
                      
                      <div className="text-sm text-gray-600 space-y-1">
                        <div className="flex items-center gap-2">
                          <Mail className="w-3 h-3" />
                          {user.email}
                        </div>
                        <div className="flex items-center gap-2">
                          <Calendar className="w-3 h-3" />
                          {t('joinedOn')} {new Date(user.created_at).toLocaleDateString()}
                        </div>
                        {user.last_sign_in_at && (
                          <div className="flex items-center gap-2">
                            <UserCheck className="w-3 h-3" />
                            {t('lastLogin')} {new Date(user.last_sign_in_at).toLocaleDateString()}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Select
                        value={user.role}
                        onValueChange={(newRole) => handleRoleChange(user.id, newRole as UserRole)}
                        disabled={processing}
                      >
                        <SelectTrigger className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="admin">{t('roles.admin')}</SelectItem>
                          <SelectItem value="manager">{t('roles.manager')}</SelectItem>
                          <SelectItem value="executive">{t('roles.executive')}</SelectItem>
                          <SelectItem value="member">{t('roles.member')}</SelectItem>
                          <SelectItem value="client">{t('roles.client')}</SelectItem>
                          <SelectItem value="partner">{t('roles.partner')}</SelectItem>
                          <SelectItem value="guest">{t('roles.guest')}</SelectItem>
                        </SelectContent>
                      </Select>

                      <Button
                        variant={user.is_active ? "destructive" : "default"}
                        size="sm"
                        onClick={() => handleUserStatusToggle(user.id, user.is_active)}
                        disabled={processing}
                      >
                        {user.is_active ? <UserX className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
                      </Button>

                      <Dialog open={isDeleteDialogOpen && selectedUser?.id === user.id} onOpenChange={setIsDeleteDialogOpen}>
                        <DialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedUser(user)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>{t('deleteDialog.title')}</DialogTitle>
                            <DialogDescription>
                              {t('deleteDialog.description', { name: user.full_name || user.email })}
                            </DialogDescription>
                          </DialogHeader>
                          <DialogFooter>
                            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
                              {t('deleteDialog.cancel')}
                            </Button>
                            <Button variant="destructive" onClick={handleDeleteUser} disabled={processing}>
                              {processing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                              {t('deleteDialog.confirm')}
                            </Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}