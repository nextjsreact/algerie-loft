"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Settings, User, Shield, Eye, EyeOff, Zap, Database, Activity } from "lucide-react"
import { useTranslations } from 'next-intl';
import { useEffect, useState } from "react"
import { getSession } from "@/lib/auth"
import type { AuthSession } from "@/lib/types"
import "@/styles/futuristic-settings.css"

export default function ApplicationSettingsPage() {
  const t = useTranslations('settings.application');
  const t_common = useTranslations('common');
  const [session, setSession] = useState<AuthSession | null>(null)
  const [loading, setLoading] = useState(true)
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isChangingPassword, setIsChangingPassword] = useState(false)

  useEffect(() => {
    async function fetchSession() {
      try {
        const sessionData = await getSession()
        setSession(sessionData)
      } catch (error) {
        // console.error('Failed to fetch session:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchSession()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen futuristic-bg flex items-center justify-center">
        <div className="loading-shimmer h-8 w-48 rounded">{t_common('loading')}</div>
      </div>
    )
  }

  if (!session) {
    return (
      <div className="min-h-screen futuristic-bg flex items-center justify-center">
        <div className="text-center">
          <div className="gradient-text text-2xl mb-4">{t('authRequired')}</div>
          <div className="text-gray-300">{t('loginPrompt')}</div>
        </div>
      </div>
    )
  }

  const handlePasswordChange = async () => {
    if (newPassword !== confirmPassword) {
      alert("New passwords do not match")
      return
    }

    if (newPassword.length < 6) {
      alert("Password must be at least 6 characters long")
      return
    }

    setIsChangingPassword(true)
    try {
      const response = await fetch('/api/auth/update-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          new_password: newPassword,
        }),
      })

      if (response.ok) {
        alert('Password changed successfully!')
        setCurrentPassword("")
        setNewPassword("")
        setConfirmPassword("")
      } else {
        const errorData = await response.json();
        alert(`Error: ${errorData.error || 'Failed to change password'}`);
      }
    } catch (error) {
      alert('An error occurred while changing password')
    } finally {
      setIsChangingPassword(false)
    }
  }

  const handleClearCache = async () => {
    try {
      const response = await fetch('/api/admin/clear-cache', {
        method: 'POST',
      })

      if (response.ok) {
        alert('Cache cleared successfully!')
      } else {
        alert('Failed to clear cache')
      }
    } catch (error) {
      alert('An error occurred while clearing cache')
    }
  }

  return (
    <div className="min-h-screen futuristic-bg p-4 sm:p-6 lg:p-8">
      <div className="relative z-10 max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="text-center mb-8 sm:mb-12">
          <div className="inline-flex items-center gap-3 mb-4">
            <div className="p-2 bg-gradient-to-r from-cyan-500 to-purple-600 rounded-full icon-container">
              <Settings className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
              {t('title')}
            </h1>
          </div>
          <p className="text-gray-300 text-lg sm:text-xl max-w-2xl mx-auto leading-relaxed">
            {t('subtitle')}
          </p>
        </div>

        {/* Main Content Grid */}
        <div className="futuristic-grid">
          {/* User Account Settings */}
          <Card className="group futuristic-card bg-white/5 backdrop-blur-xl border-white/10 hover:bg-white/10 hover:shadow-2xl hover:shadow-cyan-500/25">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-3 text-white">
                <div className="p-2 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-lg group-hover:from-cyan-500 group-hover:to-blue-500 transition-all duration-300 icon-container">
                  <User className="h-5 w-5 text-white" />
                </div>
                <span className="text-xl">{t('accountSettings.title')}</span>
              </CardTitle>
              <CardDescription className="text-gray-300">
                {t('accountSettings.description')}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="fullName" className="text-gray-200">{t('accountSettings.fullName')}</Label>
                  <Input
                    id="fullName"
                    defaultValue={session.user.full_name || ''}
                    className="futuristic-input bg-white/10 border-white/20 text-white placeholder:text-gray-400 focus:border-cyan-400 focus:ring-cyan-400/20"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-gray-200">{t('accountSettings.email')}</Label>
                  <Input
                    id="email"
                    type="email"
                    defaultValue={session.user.email || ''}
                    className="futuristic-input bg-white/10 border-white/20 text-white placeholder:text-gray-400 focus:border-cyan-400 focus:ring-cyan-400/20"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-gray-200">{t('accountSettings.role')}</Label>
                <div className="flex items-center gap-2">
                  <Badge className="bg-gradient-to-r from-purple-500 to-pink-500 text-white border-0 px-3 py-1">
                    {session.user.role}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Password Change */}
          <Card className="group futuristic-card bg-white/5 backdrop-blur-xl border-white/10 hover:bg-white/10 hover:shadow-2xl hover:shadow-purple-500/25">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-3 text-white">
                <div className="p-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg group-hover:from-pink-500 group-hover:to-purple-500 transition-all duration-300 icon-container">
                  <Shield className="h-5 w-5 text-white" />
                </div>
                <span className="text-xl">{t('passwordChange.title')}</span>
              </CardTitle>
              <CardDescription className="text-gray-300">
                {t('passwordChange.description')}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="currentPassword" className="text-gray-200">{t('passwordChange.currentPassword')}</Label>
                  <div className="relative group">
                    <Input
                      id="currentPassword"
                      type={showCurrentPassword ? "text" : "password"}
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder={t('passwordChange.currentPasswordPlaceholder')}
                      className="futuristic-input bg-white/10 border-white/20 text-white placeholder:text-gray-400 focus:border-purple-400 focus:ring-purple-400/20 pr-12"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 p-0 hover:bg-white/20 transition-all duration-300"
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    >
                      {showCurrentPassword ? (
                        <EyeOff className="h-4 w-4 text-gray-400 hover:text-purple-400 transition-colors" />
                      ) : (
                        <Eye className="h-4 w-4 text-gray-400 hover:text-purple-400 transition-colors" />
                      )}
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="newPassword" className="text-gray-200">{t('passwordChange.newPassword')}</Label>
                  <div className="relative group">
                    <Input
                      id="newPassword"
                      type={showNewPassword ? "text" : "password"}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder={t('passwordChange.newPasswordPlaceholder')}
                      className="futuristic-input bg-white/10 border-white/20 text-white placeholder:text-gray-400 focus:border-purple-400 focus:ring-purple-400/20 pr-12"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 p-0 hover:bg-white/20 transition-all duration-300"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                    >
                      {showNewPassword ? (
                        <EyeOff className="h-4 w-4 text-gray-400 hover:text-purple-400 transition-colors" />
                      ) : (
                        <Eye className="h-4 w-4 text-gray-400 hover:text-purple-400 transition-colors" />
                      )}
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword" className="text-gray-200">{t('passwordChange.confirmNewPassword')}</Label>
                  <div className="relative group">
                    <Input
                      id="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder={t('passwordChange.confirmNewPasswordPlaceholder')}
                      className="futuristic-input bg-white/10 border-white/20 text-white placeholder:text-gray-400 focus:border-purple-400 focus:ring-purple-400/20 pr-12"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 p-0 hover:bg-white/20 transition-all duration-300"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="h-4 w-4 text-gray-400 hover:text-purple-400 transition-colors" />
                      ) : (
                        <Eye className="h-4 w-4 text-gray-400 hover:text-purple-400 transition-colors" />
                      )}
                    </Button>
                  </div>
                </div>
              </div>

              <Button
                onClick={handlePasswordChange}
                disabled={isChangingPassword || !currentPassword || !newPassword || !confirmPassword}
                className="w-full futuristic-button bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white border-0 h-12 text-base font-medium hover:scale-105 hover:shadow-lg hover:shadow-purple-500/25"
              >
                {isChangingPassword ? t('passwordChange.buttonProgress') : t('passwordChange.button')}
              </Button>
            </CardContent>
          </Card>

          {/* Application Information */}
          <Card className="group futuristic-card bg-white/5 backdrop-blur-xl border-white/10 hover:bg-white/10 hover:shadow-2xl hover:shadow-green-500/25">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-3 text-white">
                <div className="p-2 bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg group-hover:from-emerald-500 group-hover:to-green-500 transition-all duration-300 icon-container">
                  <Activity className="h-5 w-5 text-white" />
                </div>
                <span className="text-xl">{t('appInfo.title')}</span>
              </CardTitle>
              <CardDescription className="text-gray-300">
                {t('appInfo.description')}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 sm:grid-cols-1">
                <div className="space-y-2">
                  <Label className="text-gray-200">{t('appInfo.appName')}</Label>
                  <div className="p-4 bg-gradient-to-r from-green-500/20 to-emerald-500/20 border border-green-500/30 rounded-lg">
                    <p className="text-green-300 text-lg font-semibold">LoftAlgérie</p>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-gray-200">{t('appInfo.version')}</Label>
                  <div className="p-4 bg-gradient-to-r from-green-500/20 to-emerald-500/20 border border-green-500/30 rounded-lg">
                    <p className="text-green-300 text-lg font-semibold">1.0.0</p>
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-gray-200">{t('appInfo.status')}</Label>
                <div className="flex flex-wrap gap-2">
                  <Badge className="bg-gradient-to-r from-green-500 to-emerald-500 text-white border-0 px-3 py-1">
                    {t('appInfo.statusActive')}
                  </Badge>
                  <Badge className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white border-0 px-3 py-1">
                    {t('appInfo.statusProduction')}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* System Administration - Full Width on Mobile */}
          {session.user.role === 'admin' && (
            <Card className="group futuristic-card bg-white/5 backdrop-blur-xl border-white/10 hover:bg-white/10 hover:shadow-2xl hover:shadow-orange-500/25 lg:col-span-2 xl:col-span-3">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-3 text-white">
                  <div className="p-2 bg-gradient-to-r from-orange-500 to-red-500 rounded-lg group-hover:from-red-500 group-hover:to-orange-500 transition-all duration-300 icon-container">
                    <Database className="h-5 w-5 text-white" />
                  </div>
                  <span className="text-xl">{t('admin.title')}</span>
                </CardTitle>
                <CardDescription className="text-gray-300">
                  {t('admin.description')}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <Label className="text-gray-200">{t('admin.quickActions')}</Label>
                  <div className="flex flex-wrap gap-3">
                    <Button
                      variant="outline"
                      size="lg"
                      onClick={handleClearCache}
                      className="futuristic-button bg-orange-500/20 border-orange-500/30 text-orange-300 hover:bg-orange-500/30 hover:border-orange-400 hover:scale-105"
                    >
                      <Zap className="h-4 w-4 mr-2" />
                      {t('admin.clearCache')}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Save All Settings - Full Width */}
          <Card className="group futuristic-card bg-white/5 backdrop-blur-xl border-white/10 hover:bg-white/10 hover:shadow-2xl hover:shadow-cyan-500/25 lg:col-span-2 xl:col-span-3">
            <CardContent className="pt-6">
              <div className="flex flex-col sm:flex-row justify-center gap-4">
                <Button className="futuristic-button bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 text-white border-0 h-14 px-8 text-lg font-medium hover:scale-105 hover:shadow-lg hover:shadow-cyan-500/25">
                  <Settings className="h-5 w-5 mr-2 icon-container" style={{ marginRight: '0.5rem' }} />
                  {t('saveAll.button')}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

    </div>
  )
}