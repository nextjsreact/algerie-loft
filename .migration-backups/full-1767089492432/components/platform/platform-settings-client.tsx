"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  Cog, 
  Save, 
  Globe, 
  DollarSign, 
  Mail, 
  Shield, 
  Database,
  Bell,
  Users,
  Settings
} from "lucide-react"
import { useTranslations } from "next-intl"

interface PlatformSettings {
  general: {
    platform_name: string
    platform_description: string
    contact_email: string
    support_phone: string
    maintenance_mode: boolean
    registration_enabled: boolean
  }
  financial: {
    commission_rate: number
    currency: string
    payment_methods: string[]
    auto_payout: boolean
    minimum_payout: number
  }
  notifications: {
    email_notifications: boolean
    sms_notifications: boolean
    push_notifications: boolean
    notification_frequency: string
  }
  security: {
    two_factor_required: boolean
    password_expiry_days: number
    max_login_attempts: number
    session_timeout_minutes: number
  }
  features: {
    partner_registration: boolean
    dispute_system: boolean
    review_system: boolean
    chat_system: boolean
    reporting_system: boolean
  }
}

export function PlatformSettingsClient() {
  const [settings, setSettings] = useState<PlatformSettings>({
    general: {
      platform_name: "Algerie Loft",
      platform_description: "Plateforme de gestion d'appartements en Algérie",
      contact_email: "contact@algerieloft.com",
      support_phone: "+213 56 03 62 543",
      maintenance_mode: false,
      registration_enabled: true
    },
    financial: {
      commission_rate: 5,
      currency: "DZD",
      payment_methods: ["card", "bank_transfer", "mobile_money"],
      auto_payout: false,
      minimum_payout: 10000
    },
    notifications: {
      email_notifications: true,
      sms_notifications: false,
      push_notifications: true,
      notification_frequency: "immediate"
    },
    security: {
      two_factor_required: false,
      password_expiry_days: 90,
      max_login_attempts: 5,
      session_timeout_minutes: 60
    },
    features: {
      partner_registration: true,
      dispute_system: true,
      review_system: true,
      chat_system: true,
      reporting_system: true
    }
  })
  
  const [loading, setLoading] = useState(false)
  const [saved, setSaved] = useState(false)
  const t = useTranslations('platform')

  const handleSave = async () => {
    setLoading(true)
    try {
      // Ici vous implémenterez la sauvegarde des paramètres
      await new Promise(resolve => setTimeout(resolve, 1000)) // Simulation
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error)
    } finally {
      setLoading(false)
    }
  }

  const updateSetting = (category: keyof PlatformSettings, key: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [key]: value
      }
    }))
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Cog className="h-8 w-8 text-gray-600" />
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Paramètres de la plateforme</h1>
            <p className="text-gray-600">Configuration générale de la plateforme</p>
          </div>
        </div>
        <Button 
          onClick={handleSave} 
          disabled={loading}
          className={saved ? "bg-green-600 hover:bg-green-700" : ""}
        >
          <Save className="h-4 w-4 mr-2" />
          {loading ? "Sauvegarde..." : saved ? "Sauvegardé !" : "Sauvegarder"}
        </Button>
      </div>

      <Tabs defaultValue="general" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="general" className="flex items-center gap-2">
            <Globe className="h-4 w-4" />
            Général
          </TabsTrigger>
          <TabsTrigger value="financial" className="flex items-center gap-2">
            <DollarSign className="h-4 w-4" />
            Financier
          </TabsTrigger>
          <TabsTrigger value="notifications" className="flex items-center gap-2">
            <Bell className="h-4 w-4" />
            Notifications
          </TabsTrigger>
          <TabsTrigger value="security" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Sécurité
          </TabsTrigger>
          <TabsTrigger value="features" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Fonctionnalités
          </TabsTrigger>
        </TabsList>

        {/* Paramètres généraux */}
        <TabsContent value="general">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5" />
                Paramètres généraux
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="platform_name">Nom de la plateforme</Label>
                  <Input
                    id="platform_name"
                    value={settings.general.platform_name}
                    onChange={(e) => updateSetting('general', 'platform_name', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contact_email">Email de contact</Label>
                  <Input
                    id="contact_email"
                    type="email"
                    value={settings.general.contact_email}
                    onChange={(e) => updateSetting('general', 'contact_email', e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="platform_description">Description de la plateforme</Label>
                <Textarea
                  id="platform_description"
                  value={settings.general.platform_description}
                  onChange={(e) => updateSetting('general', 'platform_description', e.target.value)}
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="support_phone">Téléphone de support</Label>
                <Input
                  id="support_phone"
                  value={settings.general.support_phone}
                  onChange={(e) => updateSetting('general', 'support_phone', e.target.value)}
                />
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Mode maintenance</Label>
                    <p className="text-sm text-gray-600">Activer le mode maintenance pour la plateforme</p>
                  </div>
                  <Switch
                    checked={settings.general.maintenance_mode}
                    onCheckedChange={(checked) => updateSetting('general', 'maintenance_mode', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Inscription activée</Label>
                    <p className="text-sm text-gray-600">Permettre aux nouveaux utilisateurs de s'inscrire</p>
                  </div>
                  <Switch
                    checked={settings.general.registration_enabled}
                    onCheckedChange={(checked) => updateSetting('general', 'registration_enabled', checked)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Paramètres financiers */}
        <TabsContent value="financial">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Paramètres financiers
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="commission_rate">Taux de commission (%)</Label>
                  <Input
                    id="commission_rate"
                    type="number"
                    min="0"
                    max="100"
                    step="0.1"
                    value={settings.financial.commission_rate}
                    onChange={(e) => updateSetting('financial', 'commission_rate', parseFloat(e.target.value))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="currency">Devise</Label>
                  <select
                    id="currency"
                    value={settings.financial.currency}
                    onChange={(e) => updateSetting('financial', 'currency', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="DZD">Dinar Algérien (DZD)</option>
                    <option value="EUR">Euro (EUR)</option>
                    <option value="USD">Dollar US (USD)</option>
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="minimum_payout">Montant minimum de retrait (DZD)</Label>
                <Input
                  id="minimum_payout"
                  type="number"
                  min="0"
                  value={settings.financial.minimum_payout}
                  onChange={(e) => updateSetting('financial', 'minimum_payout', parseInt(e.target.value))}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Paiement automatique</Label>
                  <p className="text-sm text-gray-600">Activer les paiements automatiques aux partenaires</p>
                </div>
                <Switch
                  checked={settings.financial.auto_payout}
                  onCheckedChange={(checked) => updateSetting('financial', 'auto_payout', checked)}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Paramètres de notifications */}
        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Paramètres de notifications
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Notifications par email</Label>
                    <p className="text-sm text-gray-600">Envoyer des notifications par email</p>
                  </div>
                  <Switch
                    checked={settings.notifications.email_notifications}
                    onCheckedChange={(checked) => updateSetting('notifications', 'email_notifications', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Notifications SMS</Label>
                    <p className="text-sm text-gray-600">Envoyer des notifications par SMS</p>
                  </div>
                  <Switch
                    checked={settings.notifications.sms_notifications}
                    onCheckedChange={(checked) => updateSetting('notifications', 'sms_notifications', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Notifications push</Label>
                    <p className="text-sm text-gray-600">Envoyer des notifications push</p>
                  </div>
                  <Switch
                    checked={settings.notifications.push_notifications}
                    onCheckedChange={(checked) => updateSetting('notifications', 'push_notifications', checked)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notification_frequency">Fréquence des notifications</Label>
                <select
                  id="notification_frequency"
                  value={settings.notifications.notification_frequency}
                  onChange={(e) => updateSetting('notifications', 'notification_frequency', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="immediate">Immédiate</option>
                  <option value="hourly">Toutes les heures</option>
                  <option value="daily">Quotidienne</option>
                  <option value="weekly">Hebdomadaire</option>
                </select>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Paramètres de sécurité */}
        <TabsContent value="security">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Paramètres de sécurité
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="password_expiry_days">Expiration du mot de passe (jours)</Label>
                  <Input
                    id="password_expiry_days"
                    type="number"
                    min="0"
                    value={settings.security.password_expiry_days}
                    onChange={(e) => updateSetting('security', 'password_expiry_days', parseInt(e.target.value))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="max_login_attempts">Tentatives de connexion max</Label>
                  <Input
                    id="max_login_attempts"
                    type="number"
                    min="1"
                    value={settings.security.max_login_attempts}
                    onChange={(e) => updateSetting('security', 'max_login_attempts', parseInt(e.target.value))}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="session_timeout_minutes">Timeout de session (minutes)</Label>
                <Input
                  id="session_timeout_minutes"
                  type="number"
                  min="5"
                  value={settings.security.session_timeout_minutes}
                  onChange={(e) => updateSetting('security', 'session_timeout_minutes', parseInt(e.target.value))}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Authentification à deux facteurs obligatoire</Label>
                  <p className="text-sm text-gray-600">Exiger la 2FA pour tous les utilisateurs</p>
                </div>
                <Switch
                  checked={settings.security.two_factor_required}
                  onCheckedChange={(checked) => updateSetting('security', 'two_factor_required', checked)}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Paramètres des fonctionnalités */}
        <TabsContent value="features">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Fonctionnalités de la plateforme
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Inscription des partenaires</Label>
                    <p className="text-sm text-gray-600">Permettre l'inscription de nouveaux partenaires</p>
                  </div>
                  <Switch
                    checked={settings.features.partner_registration}
                    onCheckedChange={(checked) => updateSetting('features', 'partner_registration', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Système de litiges</Label>
                    <p className="text-sm text-gray-600">Activer le système de gestion des litiges</p>
                  </div>
                  <Switch
                    checked={settings.features.dispute_system}
                    onCheckedChange={(checked) => updateSetting('features', 'dispute_system', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Système d'avis</Label>
                    <p className="text-sm text-gray-600">Permettre aux utilisateurs de laisser des avis</p>
                  </div>
                  <Switch
                    checked={settings.features.review_system}
                    onCheckedChange={(checked) => updateSetting('features', 'review_system', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Système de chat</Label>
                    <p className="text-sm text-gray-600">Activer le chat en temps réel</p>
                  </div>
                  <Switch
                    checked={settings.features.chat_system}
                    onCheckedChange={(checked) => updateSetting('features', 'chat_system', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Système de rapports</Label>
                    <p className="text-sm text-gray-600">Activer la génération de rapports</p>
                  </div>
                  <Switch
                    checked={settings.features.reporting_system}
                    onCheckedChange={(checked) => updateSetting('features', 'reporting_system', checked)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}