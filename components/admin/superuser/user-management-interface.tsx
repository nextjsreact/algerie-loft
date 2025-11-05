"use client";

import { useState, useEffect, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Search, 
  Plus, 
  Edit, 
  Trash2, 
  Shield, 
  Key, 
  Mail,
  AlertTriangle,
  CheckCircle,
  Clock,
  Filter
} from 'lucide-react';
import type { User, UserRole } from '@/lib/types';

interface ExtendedUser extends User {
  created_at: string;
  updated_at: string | null;
  last_login?: string | null;
  is_active: boolean;
  email_verified: boolean;
}

interface UserFilters {
  search: string;
  role: UserRole | 'all';
  status: 'all' | 'active' | 'inactive';
  emailVerified: 'all' | 'verified' | 'unverified';
}

interface BulkAction {
  type: 'activate' | 'deactivate' | 'delete' | 'change_role';
  userIds: string[];
  newRole?: UserRole;
}

export function UserManagementInterface() {
  const t = useTranslations('superuser.userManagement');
  const [users, setUsers] = useState<ExtendedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [filters, setFilters] = useState<UserFilters>({
    search: '',
    role: 'all',
    status: 'all',
    emailVerified: 'all'
  });
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editingUser, setEditingUser] = useState<ExtendedUser | null>(null);
  const [showBulkActions, setShowBulkActions] = useState(false);
  const [newPassword, setNewPassword] = useState('');

  // Debounce search input
  useEffect(() => {
    if (filters.search !== debouncedSearch) {
      setIsSearching(true);
    }
    
    const timer = setTimeout(() => {
      setDebouncedSearch(filters.search);
      setIsSearching(false);
    }, 500); // 500ms delay

    return () => clearTimeout(timer);
  }, [filters.search]);

  // Helper function to handle filter changes with slight delay for better UX
  const handleFilterChange = (filterType: keyof UserFilters, value: any) => {
    setFilters(prev => ({ ...prev, [filterType]: value }));
  };

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams();
      
      if (debouncedSearch) queryParams.set('search', debouncedSearch);
      if (filters.role !== 'all') queryParams.set('role', filters.role);
      if (filters.status !== 'all') queryParams.set('status', filters.status);
      if (filters.emailVerified !== 'all') queryParams.set('emailVerified', filters.emailVerified);

      const response = await fetch(`/api/superuser/users?${queryParams}`);
      if (!response.ok) {
        throw new Error('Failed to fetch users');
      }
      
      const data = await response.json();
      setUsers(data.users || []);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, filters.role, filters.status, filters.emailVerified]);

  // Initial load
  useEffect(() => {
    fetchUsers();
  }, []);

  const handleUserSelect = (userId: string, selected: boolean) => {
    if (selected) {
      setSelectedUsers(prev => [...prev, userId]);
    } else {
      setSelectedUsers(prev => prev.filter(id => id !== userId));
    }
  };

  const handleSelectAll = (selected: boolean) => {
    if (selected) {
      setSelectedUsers(users.map(user => user.id));
    } else {
      setSelectedUsers([]);
    }
  };

  const handleBulkAction = async (action: BulkAction) => {
    try {
      const response = await fetch('/api/superuser/users/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(action)
      });

      if (!response.ok) {
        throw new Error('Bulk action failed');
      }

      await fetchUsers();
      setSelectedUsers([]);
      setShowBulkActions(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Bulk action failed');
    }
  };

  const handlePasswordReset = async (userId: string) => {
    try {
      const response = await fetch(`/api/superuser/users/${userId}/reset-password`, {
        method: 'POST'
      });

      if (!response.ok) {
        throw new Error('Password reset failed');
      }

      alert('Mot de passe réinitialisé avec succès. Un email a été envoyé à l\'utilisateur.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Password reset failed');
    }
  };

  const handleGenerateTemporaryPassword = async (userId: string) => {
    try {
      // Générer un mot de passe temporaire sécurisé
      const tempPassword = generateSecurePassword();
      
      const response = await fetch(`/api/superuser/users/${userId}/set-temporary-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ temporaryPassword: tempPassword })
      });

      if (!response.ok) {
        throw new Error('Failed to set temporary password');
      }

      // Afficher le mot de passe temporaire une seule fois
      alert(`Mot de passe temporaire généré pour l'utilisateur :\n\n${tempPassword}\n\nCe mot de passe sera affiché une seule fois. L'utilisateur devra le changer à sa prochaine connexion.`);
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate temporary password');
    }
  };

  const generateSecurePassword = (): string => {
    const length = 12;
    const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*";
    let password = "";
    
    // Assurer au moins un caractère de chaque type
    password += "ABCDEFGHIJKLMNOPQRSTUVWXYZ"[Math.floor(Math.random() * 26)]; // Majuscule
    password += "abcdefghijklmnopqrstuvwxyz"[Math.floor(Math.random() * 26)]; // Minuscule
    password += "0123456789"[Math.floor(Math.random() * 10)]; // Chiffre
    password += "!@#$%^&*"[Math.floor(Math.random() * 8)]; // Symbole
    
    // Compléter avec des caractères aléatoires
    for (let i = password.length; i < length; i++) {
      password += charset[Math.floor(Math.random() * charset.length)];
    }
    
    // Mélanger les caractères
    return password.split('').sort(() => Math.random() - 0.5).join('');
  };

  const handleSaveUser = async () => {
    if (!editingUser) return;

    try {
      const updateData: any = {
        name: editingUser.full_name,
        email: editingUser.email,
        role: editingUser.role,
        is_active: editingUser.is_active,
        email_verified: editingUser.email_verified
      };

      // Ajouter le mot de passe seulement s'il est fourni
      if (newPassword.trim()) {
        updateData.password = newPassword;
      }

      const response = await fetch(`/api/superuser/users/${editingUser.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData)
      });

      if (!response.ok) {
        throw new Error('Failed to update user');
      }

      await fetchUsers();
      setShowEditDialog(false);
      setEditingUser(null);
      setNewPassword(''); // Réinitialiser le champ mot de passe
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update user');
    }
  };

  const handleCreateUser = async () => {
    const nameInput = document.getElementById('create-name') as HTMLInputElement;
    const emailInput = document.getElementById('create-email') as HTMLInputElement;
    const roleSelect = document.querySelector('[id*="create-role"]') as HTMLSelectElement;

    if (!nameInput?.value || !emailInput?.value) {
      setError('Veuillez remplir tous les champs obligatoires');
      return;
    }

    try {
      const response = await fetch('/api/superuser/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: nameInput.value,
          email: emailInput.value,
          role: roleSelect?.value || 'member'
        })
      });

      if (!response.ok) {
        throw new Error('Failed to create user');
      }

      await fetchUsers();
      setShowCreateDialog(false);
      
      // Reset form
      nameInput.value = '';
      emailInput.value = '';
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create user');
    }
  };

  const getRoleBadgeVariant = (role: UserRole) => {
    switch (role) {
      case 'superuser': return 'destructive';
      case 'admin': return 'default';
      case 'manager': return 'secondary';
      case 'executive': return 'outline';
      default: return 'secondary';
    }
  };

  const getStatusIcon = (user: ExtendedUser) => {
    if (!user.is_active) {
      return <AlertTriangle className="h-4 w-4 text-red-500" />;
    }
    if (!user.email_verified) {
      return <Clock className="h-4 w-4 text-yellow-500" />;
    }
    return <CheckCircle className="h-4 w-4 text-green-500" />;
  };

  const filteredUsers = users.filter(user => {
    if (filters.search && !user.full_name?.toLowerCase().includes(filters.search.toLowerCase()) && 
        !user.email?.toLowerCase().includes(filters.search.toLowerCase())) {
      return false;
    }
    if (filters.role !== 'all' && user.role !== filters.role) {
      return false;
    }
    if (filters.status === 'active' && !user.is_active) {
      return false;
    }
    if (filters.status === 'inactive' && user.is_active) {
      return false;
    }
    if (filters.emailVerified === 'verified' && !user.email_verified) {
      return false;
    }
    if (filters.emailVerified === 'unverified' && user.email_verified) {
      return false;
    }
    return true;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">

      
      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Filters and Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>{t('title')}</span>
            <div className="flex gap-2">
              {selectedUsers.length > 0 && (
                <button 
                  onClick={() => setShowBulkActions(true)}
                  className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded font-medium"
                >
                  🔧 {t('actions.bulkActions')} ({selectedUsers.length})
                </button>
              )}
              <button 
                onClick={() => setShowCreateDialog(true)}
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded font-medium"
              >
                ➕ {t('actions.createUser')}
              </button>

            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
            <div className="relative">
              <Search className={`absolute left-3 top-3 h-4 w-4 text-muted-foreground ${isSearching ? 'animate-pulse' : ''}`} />
              <Input
                placeholder="Rechercher par nom ou email..."
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                className="pl-10"
              />
              {isSearching && (
                <div className="absolute right-3 top-3">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                </div>
              )}
            </div>
            
            <Select 
              value={filters.role} 
              onValueChange={(value) => handleFilterChange('role', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Filtrer par rôle" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les rôles</SelectItem>
                <SelectItem value="superuser">Superuser</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="manager">Manager</SelectItem>
                <SelectItem value="executive">Executive</SelectItem>
                <SelectItem value="member">Member</SelectItem>
                <SelectItem value="client">Client</SelectItem>
                <SelectItem value="partner">Partner</SelectItem>
                <SelectItem value="guest">Guest</SelectItem>
              </SelectContent>
            </Select>

            <Select 
              value={filters.status} 
              onValueChange={(value) => handleFilterChange('status', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Filtrer par statut" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les statuts</SelectItem>
                <SelectItem value="active">Actif</SelectItem>
                <SelectItem value="inactive">Inactif</SelectItem>
              </SelectContent>
            </Select>

            <Select 
              value={filters.emailVerified} 
              onValueChange={(value) => handleFilterChange('emailVerified', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Email vérifié" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous</SelectItem>
                <SelectItem value="verified">Vérifié</SelectItem>
                <SelectItem value="unverified">Non vérifié</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Bulk Actions Bar */}
          {selectedUsers.length > 0 && (
            <div className="flex items-center justify-between p-4 bg-blue-50 border-t">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">
                  {selectedUsers.length} utilisateur{selectedUsers.length > 1 ? 's' : ''} sélectionné{selectedUsers.length > 1 ? 's' : ''}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedUsers([])}
                >
                  {t('actions.deselectAll')}
                </Button>
              </div>
              <Button
                variant="default"
                size="sm"
                onClick={() => setShowBulkActions(true)}
              >
                {t('actions.bulkActions')}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">
                  <input 
                    type="checkbox" 
                    checked={selectedUsers.length === filteredUsers.length && filteredUsers.length > 0}
                    onChange={(e) => handleSelectAll(e.target.checked)}
                    className="w-4 h-4 cursor-pointer"
                    title="Sélectionner tout"
                  />
                </TableHead>
                <TableHead>{t('table.user')}</TableHead>
                <TableHead>{t('table.role')}</TableHead>
                <TableHead>{t('table.status')}</TableHead>
                <TableHead>{t('table.lastLogin')}</TableHead>
                <TableHead>{t('table.createdAt')}</TableHead>
                <TableHead className="text-right">{t('table.actions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>
                    <input 
                      type="checkbox" 
                      checked={selectedUsers.includes(user.id)}
                      onChange={(e) => handleUserSelect(user.id, e.target.checked)}
                      className="w-4 h-4 cursor-pointer"
                    />
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      {getStatusIcon(user)}
                      <div>
                        <div className="font-medium">{user.full_name || 'Sans nom'}</div>
                        <div className="text-sm text-muted-foreground">{user.email}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={getRoleBadgeVariant(user.role)}>
                      {user.role}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Badge variant={user.is_active ? 'default' : 'secondary'}>
                        {user.is_active ? t('table.active') : t('table.inactive')}
                      </Badge>
                      {!user.email_verified && (
                        <Badge variant="outline">Email non vérifié</Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {user.last_login ? new Date(user.last_login).toLocaleDateString() : t('table.never')}
                  </TableCell>
                  <TableCell>
                    {new Date(user.created_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => {
                          setEditingUser(user);
                          setShowEditDialog(true);
                        }}
                        className="px-2 py-1 bg-blue-100 hover:bg-blue-200 border border-blue-300 rounded text-sm"
                        title="Modifier l'utilisateur"
                      >
                        ✏️ {t('actions.edit')}
                      </button>
                      <button
                        onClick={() => handlePasswordReset(user.id)}
                        className="px-2 py-1 bg-orange-100 hover:bg-orange-200 border border-orange-300 rounded text-sm"
                        title="Réinitialiser le mot de passe"
                      >
                        🔑 {t('actions.reset')}
                      </button>
                      <button
                        onClick={() => handleGenerateTemporaryPassword(user.id)}
                        className="px-2 py-1 bg-yellow-100 hover:bg-yellow-200 border border-yellow-300 rounded text-sm"
                        title="Générer un mot de passe temporaire"
                      >
                        🎲 {t('actions.temp')}
                      </button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Bulk Actions Dialog */}
      {showBulkActions && (
        <Dialog open={showBulkActions} onOpenChange={setShowBulkActions}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t('actions.bulkActions')}</DialogTitle>
              <DialogDescription>
                Sélectionnez une action à appliquer aux {selectedUsers.length} utilisateurs sélectionnés
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <Button 
                variant="outline" 
                className="w-full justify-start"
                onClick={() => handleBulkAction({ type: 'activate', userIds: selectedUsers })}
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Activer les utilisateurs
              </Button>
              <Button 
                variant="outline" 
                className="w-full justify-start"
                onClick={() => handleBulkAction({ type: 'deactivate', userIds: selectedUsers })}
              >
                <AlertTriangle className="h-4 w-4 mr-2" />
                Désactiver les utilisateurs
              </Button>
              <Button 
                variant="destructive" 
                className="w-full justify-start"
                onClick={() => handleBulkAction({ type: 'delete', userIds: selectedUsers })}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Supprimer les utilisateurs
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Edit User Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Modifier l'utilisateur</DialogTitle>
            <DialogDescription>
              Modifiez les informations de l'utilisateur sélectionné
            </DialogDescription>
          </DialogHeader>
          {editingUser && (
            <div className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="edit-name" className="block text-sm font-medium">Nom complet</label>
                <input
                  id="edit-name"
                  type="text"
                  value={editingUser.full_name || ''}
                  onChange={(e) => setEditingUser(prev => prev ? {...prev, full_name: e.target.value} : null)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="edit-email" className="block text-sm font-medium">Email</label>
                <input
                  id="edit-email"
                  type="email"
                  value={editingUser.email || ''}
                  onChange={(e) => setEditingUser(prev => prev ? {...prev, email: e.target.value} : null)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="edit-password" className="block text-sm font-medium">Nouveau mot de passe (optionnel)</label>
                <input
                  id="edit-password"
                  type="password"
                  placeholder="Laissez vide pour ne pas changer"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-xs text-gray-500">
                  Laissez ce champ vide si vous ne voulez pas changer le mot de passe
                </p>
              </div>
              <div className="space-y-2">
                <label htmlFor="edit-role" className="block text-sm font-medium">Rôle</label>
                <select 
                  id="edit-role"
                  value={editingUser.role} 
                  onChange={(e) => setEditingUser(prev => prev ? {...prev, role: e.target.value as UserRole} : null)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="superuser">Superuser</option>
                  <option value="admin">Admin</option>
                  <option value="manager">Manager</option>
                  <option value="executive">Executive</option>
                  <option value="member">Member</option>
                  <option value="client">Client</option>
                  <option value="partner">Partner</option>
                  <option value="guest">Guest</option>
                </select>
              </div>
              <div className="flex items-center space-x-2">
                <input
                  id="edit-active"
                  type="checkbox"
                  checked={editingUser.is_active}
                  onChange={(e) => setEditingUser(prev => prev ? {...prev, is_active: e.target.checked} : null)}
                  className="w-4 h-4"
                />
                <label htmlFor="edit-active" className="text-sm">Compte actif</label>
              </div>
              <div className="flex items-center space-x-2">
                <input
                  id="edit-verified"
                  type="checkbox"
                  checked={editingUser.email_verified}
                  onChange={(e) => setEditingUser(prev => prev ? {...prev, email_verified: e.target.checked} : null)}
                  className="w-4 h-4"
                />
                <label htmlFor="edit-verified" className="text-sm">Email vérifié</label>
              </div>
            </div>
          )}
          <div className="flex justify-end gap-2 pt-4">
            <button 
              onClick={() => {
                setShowEditDialog(false);
                setNewPassword('');
              }}
              className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Annuler
            </button>
            <button 
              onClick={handleSaveUser}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Sauvegarder
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Create User Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Créer un nouvel utilisateur</DialogTitle>
            <DialogDescription>
              Ajoutez un nouvel utilisateur au système
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="create-name">Nom complet</Label>
              <Input
                id="create-name"
                placeholder="Nom complet de l'utilisateur"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="create-email">Email</Label>
              <Input
                id="create-email"
                type="email"
                placeholder="email@exemple.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="create-role">Rôle</Label>
              <Select defaultValue="member">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="manager">Manager</SelectItem>
                  <SelectItem value="executive">Executive</SelectItem>
                  <SelectItem value="member">Member</SelectItem>
                  <SelectItem value="client">Client</SelectItem>
                  <SelectItem value="partner">Partner</SelectItem>
                  <SelectItem value="guest">Guest</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
              Annuler
            </Button>
            <Button onClick={handleCreateUser}>
              Créer l'utilisateur
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}