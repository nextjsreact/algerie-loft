"use client"

import { useState, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { 
  Shield, 
  Database, 
  Mail, 
  MessageSquare, 
  Bell, 
  Phone,
  BarChart3,
  Target,
  Users,
  Clock,
  Save,
  AlertCircle,
  CheckCircle,
  Info
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { privacySettingsSchema, type PrivacySettingsData } from '@/lib/schemas/privacy'
import { PrivacyService } from '@/lib/services/privacy-service'
import { toast } from 'sonner'

interface PrivacySettingsPanelProps {
  userId: string
  className?: string
}

export function PrivacySettingsPanel({ userId, className }: PrivacySettingsPanelProps) {
  const t = useTranslations('privacy.settings')
  
  const [settings, setSettings] = useState<PrivacySettingsData>({
    dataProcessing: {
      essential: true,
      analytics: false,
      marketing: false,
      profiling: false
    },
    communications: {
      email: true,
      sms: false,
      push: false,
      phone: false
    },
    dataRetention: {
      bookingHistory: '3years',
      communicationLogs: '1year',
      analyticsData: '6months'
    },
    dataSharing: {
      partners: false,
      analytics: false,
      marketing: false
    }
  })
  
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadPrivacySettings()
  }, [userId])

  const loadPrivacySettings = async () => {
    try {
      setIsLoading(true)
      const userSettings = await PrivacyService.getPrivacySettings(userId)
      
      if (userSettings?.settings) {
        setSettings(userSettings.settings as PrivacySettingsData)
      }
    } catch (error) {
      console.error('Failed to load privacy settings:', error)
      setError(t('loadError'))
    } finally {
      setIsLoading(false)
    }
  }

  const handleSettingChange = (
    category: keyof PrivacySettingsData,
    key: string,
    value: boolean | string
  ) => {
    setSettings(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [key]: value
      }
    }))
    setHasChanges(true)
  }

  const handleSave = async () => {
    try {
      setIsSaving(true)
      setError(null)
      
      // Validate settings
      const validatedSettings = privacySettingsSchema.parse(settings)
      
      await PrivacyService.updatePrivacySettings(userId, validatedSettings)
      
      setHasChanges(false)
      toast.success(t('saveSuccess'))
    } catch (error) {
      console.error('Failed to save privacy settings:', error)
      const errorMessage = error instanceof Error ? error.message : t('saveError')
      setError(errorMessage)
      toast.error(errorMessage)
    } finally {
      setIsSaving(false)
    }
  }

  const getRetentionDescription = (period: string) => {
    switch (period) {
      case '3months': return t('retention.3months')
      case '6months': return t('retention.6months')
      case '1year': return t('retention.1year')
      case '2years': return t('retention.2years')
      case '3years': return t('retention.3years')
      case '5years': return t('retention.5years')
      case 'indefinite': return t('retention.indefinite')
      default: return period
    }
  }

  if (isLoading) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className={cn("space-y-6", className)}>
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Data Processing Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            {t('dataProcessing.title')}
          </CardTitle>
          <CardDescription>{t('dataProcessing.description')}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Label className="font-medium">{t('dataProcessing.essential')}</Label>
                  <Badge variant="secondary" className="text-xs">
                    {t('required')}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  {t('dataProcessing.essentialDesc')}
                </p>
              </div>
              <Switch
                checked={settings.dataProcessing.essential}
                disabled={true} // Essential processing cannot be disabled
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label className="font-medium">{t('dataProcessing.analytics')}</Label>
                <p className="text-sm text-muted-foreground">
                  {t('dataProcessing.analyticsDesc')}
                </p>
              </div>
              <Switch
                checked={settings.dataProcessing.analytics}
                onCheckedChange={(checked) => 
                  handleSettingChange('dataProcessing', 'analytics', checked)
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label className="font-medium">{t('dataProcessing.marketing')}</Label>
                <p className="text-sm text-muted-foreground">
                  {t('dataProcessing.marketingDesc')}
                </p>
              </div>
              <Switch
                checked={settings.dataProcessing.marketing}
                onCheckedChange={(checked) => 
                  handleSettingChange('dataProcessing', 'marketing', checked)
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label className="font-medium">{t('dataProcessing.profiling')}</Label>
                <p className="text-sm text-muted-foreground">
                  {t('dataProcessing.profilingDesc')}
                </p>
              </div>
              <Switch
                checked={settings.dataProcessing.profiling}
                onCheckedChange={(checked) => 
                  handleSettingChange('dataProcessing', 'profiling', checked)
                }
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Communication Preferences */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            {t('communications.title')}
          </CardTitle>
          <CardDescription>{t('communications.description')}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                <Label className="font-medium">{t('communications.email')}</Label>
              </div>
              <Switch
                checked={settings.communications.email}
                onCheckedChange={(checked) => 
                  handleSettingChange('communications', 'email', checked)
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4" />
                <Label className="font-medium">{t('communications.sms')}</Label>
              </div>
              <Switch
                checked={settings.communications.sms}
                onCheckedChange={(checked) => 
                  handleSettingChange('communications', 'sms', checked)
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bell className="h-4 w-4" />
                <Label className="font-medium">{t('communications.push')}</Label>
              </div>
              <Switch
                checked={settings.communications.push}
                onCheckedChange={(checked) => 
                  handleSettingChange('communications', 'push', checked)
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4" />
                <Label className="font-medium">{t('communications.phone')}</Label>
              </div>
              <Switch
                checked={settings.communications.phone}
                onCheckedChange={(checked) => 
                  handleSettingChange('communications', 'phone', checked)
                }
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Data Retention Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            {t('dataRetention.title')}
          </CardTitle>
          <CardDescription>{t('dataRetention.description')}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>{t('dataRetention.bookingHistory')}</Label>
              <Select
                value={settings.dataRetention.bookingHistory}
                onValueChange={(value) => 
                  handleSettingChange('dataRetention', 'bookingHistory', value)
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1year">{getRetentionDescription('1year')}</SelectItem>
                  <SelectItem value="3years">{getRetentionDescription('3years')}</SelectItem>
                  <SelectItem value="5years">{getRetentionDescription('5years')}</SelectItem>
                  <SelectItem value="indefinite">{getRetentionDescription('indefinite')}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>{t('dataRetention.communicationLogs')}</Label>
              <Select
                value={settings.dataRetention.communicationLogs}
                onValueChange={(value) => 
                  handleSettingChange('dataRetention', 'communicationLogs', value)
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="6months">{getRetentionDescription('6months')}</SelectItem>
                  <SelectItem value="1year">{getRetentionDescription('1year')}</SelectItem>
                  <SelectItem value="2years">{getRetentionDescription('2years')}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>{t('dataRetention.analyticsData')}</Label>
              <Select
                value={settings.dataRetention.analyticsData}
                onValueChange={(value) => 
                  handleSettingChange('dataRetention', 'analyticsData', value)
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="3months">{getRetentionDescription('3months')}</SelectItem>
                  <SelectItem value="6months">{getRetentionDescription('6months')}</SelectItem>
                  <SelectItem value="1year">{getRetentionDescription('1year')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Data Sharing Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            {t('dataSharing.title')}
          </CardTitle>
          <CardDescription>{t('dataSharing.description')}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  <Label className="font-medium">{t('dataSharing.partners')}</Label>
                </div>
                <p className="text-sm text-muted-foreground">
                  {t('dataSharing.partnersDesc')}
                </p>
              </div>
              <Switch
                checked={settings.dataSharing.partners}
                onCheckedChange={(checked) => 
                  handleSettingChange('dataSharing', 'partners', checked)
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <BarChart3 className="h-4 w-4" />
                  <Label className="font-medium">{t('dataSharing.analytics')}</Label>
                </div>
                <p className="text-sm text-muted-foreground">
                  {t('dataSharing.analyticsDesc')}
                </p>
              </div>
              <Switch
                checked={settings.dataSharing.analytics}
                onCheckedChange={(checked) => 
                  handleSettingChange('dataSharing', 'analytics', checked)
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Target className="h-4 w-4" />
                  <Label className="font-medium">{t('dataSharing.marketing')}</Label>
                </div>
                <p className="text-sm text-muted-foreground">
                  {t('dataSharing.marketingDesc')}
                </p>
              </div>
              <Switch
                checked={settings.dataSharing.marketing}
                onCheckedChange={(checked) => 
                  handleSettingChange('dataSharing', 'marketing', checked)
                }
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Legal Information */}
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          {t('legalNotice')}
        </AlertDescription>
      </Alert>

      {/* Save Button */}
      {hasChanges && (
        <div className="flex justify-end">
          <Button
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center gap-2"
          >
            {isSaving ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            ) : (
              <Save className="h-4 w-4" />
            )}
            {isSaving ? t('saving') : t('saveChanges')}
          </Button>
        </div>
      )}
    </div>
  )
}