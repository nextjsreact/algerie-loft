"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { 
  Users, 
  Key, 
  Mail, 
  Shield, 
  Clock, 
  CheckCircle, 
  XCircle,
  RefreshCw,
  Eye,
  EyeOff
} from "lucide-react"
import { toast } from "react-hot-toast"
import type { AuthSession } from "@/lib/types"
import { validatePasswordStrength } from "@/lib/utils/password-validation"

interface Employee {
  id: string
  email: string
  full_name?: string
  role: string
  last_sign_in?: string
  email_confirmed: boolean
}

interface EmployeeManagementProps {
  session: AuthSession
}

export function EmployeeManagement({ session }: EmployeeManagementProps) {
  const [employees, setEmployees] = useState<Employee[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedEmployee, setSelectedEmployee] = useState<string>("")
  const [newPassword, setNewPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [actionLoading, setActionLoading] = useState<string>("")
  const [passwordErrors, setPasswordErrors] = useState<string[]>([])

  // Validation du mot de passe en temps réel
  useEffect(() => {
    if (newPassword) {
      const validation = validatePasswordStrength(newPassword)
      setPasswordErrors(validation.errors)
    } else {
      setPasswordErrors([])
    }
  }, [newPassword])

  // Charger la liste des employés
  useEffect(() => {
    loadEmployees()
  }, [])

  const loadEmployees = async () => {
    try {
      console.log('🔄 Chargement des employés...')
      setLoading(true)
      
      const response = await fetch('/api/admin/employees')
      console.log('📡 Réponse API:', response.status, response.statusText)
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }
      
      const data = await response.json()
      console.log('📊 Données reçues:', data)
      
      if (data.success) {
        setEmployees(data.employees || [])
        toast.success(`${data.employees?.length || 0} employés chargés`)
      } else {
        console.error('❌ Erreur API:', data.error)
        toast.error(data.error || 'Erreur lors du chargement')
      }
    } catch (error) {
      console.error('❌ Erreur loadEmployees:', error)
      toast.error(`Erreur de connexion: ${error instanceof Error ? error.message : 'Unknown'}`)
    } finally {
      setLoading(false)
    }
  }

  // Réinitialiser le mot de passe
  const handleResetPassword = async (email: string, customPassword?: string) => {
    try {
      setActionLoading(email)
      
      const response = await fetch('/api/admin/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          email, 
          newPassword: customPassword 
        })
      })
      
      const data = await response.json()
      
      if (data.success) {
        toast.success(
          customPassword 
            ? 'Mot de passe mis à jour avec succès' 
            : `Mot de passe temporaire: ${data.tempPassword}`
        )
        setNewPassword("")
        setSelectedEmployee("")
      } else {
        toast.error(data.error || 'Erreur lors de la réinitialisation')
      }
    } catch (error) {
      toast.error('Erreur de connexion')
    } finally {
      setActionLoading("")
    }
  }

  // Envoyer un email de réinitialisation
  const handleSendResetEmail = async (email: string) => {
    try {
      setActionLoading(email)
      
      const response = await fetch('/api/admin/send-reset-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      })
      
      const data = await response.json()
      
      if (data.success) {
        toast.success('Email de réinitialisation envoyé')
      } else {
        toast.error(data.error || 'Erreur lors de l\'envoi')
      }
    } catch (error) {
      toast.error('Erreur de connexion')
    } finally {
      setActionLoading("")
    }
  }

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-red-100 text-red-800'
      case 'executive': return 'bg-purple-100 text-purple-800'
      case 'manager': return 'bg-blue-100 text-blue-800'
      case 'member': return 'bg-green-100 text-green-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin': return <Shield className="h-4 w-4" />
      case 'executive': return <Users className="h-4 w-4" />
      case 'manager': return <Key className="h-4 w-4" />
      default: return <Users className="h-4 w-4" />
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <RefreshCw className="h-8 w-8 animate-spin text-blue-600" />
        <span className="ml-2">Chargement des employés...</span>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Employés</p>
                <p className="text-2xl font-bold">{employees.length}</p>
              </div>
              <Users className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Admins</p>
                <p className="text-2xl font-bold">
                  {employees.filter(e => e.role === 'admin').length}
                </p>
              </div>
              <Shield className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Managers</p>
                <p className="text-2xl font-bold">
                  {employees.filter(e => e.role === 'manager').length}
                </p>
              </div>
              <Key className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Membres</p>
                <p className="text-2xl font-bold">
                  {employees.filter(e => e.role === 'member').length}
                </p>
              </div>
              <Users className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Réinitialisation personnalisée */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="h-5 w-5" />
            Réinitialisation Personnalisée
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Sélectionner un employé
              </label>
              <select
                value={selectedEmployee}
                onChange={(e) => setSelectedEmployee(e.target.value)}
                className="w-full p-2 border rounded-lg"
              >
                <option value="">Choisir un employé...</option>
                {employees.map(emp => (
                  <option key={emp.id} value={emp.email}>
                    {emp.full_name || emp.email} ({emp.role})
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">
                Nouveau mot de passe (optionnel)
              </label>
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Laisser vide pour auto-générer"
                  className={passwordErrors.length > 0 ? "border-red-300" : ""}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {passwordErrors.length > 0 && (
                <div className="mt-2 space-y-1">
                  {passwordErrors.map((error, index) => (
                    <p key={index} className="text-xs text-red-600 flex items-center gap-1">
                      <XCircle className="h-3 w-3" />
                      {error}
                    </p>
                  ))}
                </div>
              )}
            </div>
            
            <div className="flex items-end">
              <Button
                onClick={() => handleResetPassword(selectedEmployee, newPassword || undefined)}
                disabled={!selectedEmployee || actionLoading === selectedEmployee}
                className="w-full"
              >
                {actionLoading === selectedEmployee ? (
                  <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Key className="h-4 w-4 mr-2" />
                )}
                Réinitialiser
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Liste des employés */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Liste des Employés
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {employees.map(employee => (
              <div key={employee.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-4">
                  <div className={`p-2 rounded-lg ${getRoleColor(employee.role)}`}>
                    {getRoleIcon(employee.role)}
                  </div>
                  
                  <div>
                    <h3 className="font-semibold">
                      {employee.full_name || employee.email}
                    </h3>
                    <p className="text-sm text-gray-600">{employee.email}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`px-2 py-1 rounded-full text-xs ${getRoleColor(employee.role)}`}>
                        {employee.role}
                      </span>
                      {employee.email_confirmed ? (
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      ) : (
                        <XCircle className="h-4 w-4 text-red-600" />
                      )}
                      {employee.last_sign_in && (
                        <span className="text-xs text-gray-500 flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {new Date(employee.last_sign_in).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleSendResetEmail(employee.email)}
                    disabled={actionLoading === employee.email}
                  >
                    {actionLoading === employee.email ? (
                      <RefreshCw className="h-4 w-4 animate-spin" />
                    ) : (
                      <Mail className="h-4 w-4" />
                    )}
                  </Button>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleResetPassword(employee.email)}
                    disabled={actionLoading === employee.email}
                  >
                    {actionLoading === employee.email ? (
                      <RefreshCw className="h-4 w-4 animate-spin" />
                    ) : (
                      <Key className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}