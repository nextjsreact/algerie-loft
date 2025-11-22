/**
 * Environment Selector Component
 * 
 * Allows selection of source and target environments with support for
 * both pre-configured and manual entry
 */

'use client'

import { useState, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { CloneEnvironment, ConfiguredEnvironment, SupabaseCredentials, CloneOptions } from '@/lib/database-cloner/types'

interface Props {
    onEnvironmentsSelected: (source: CloneEnvironment, target: CloneEnvironment) => void
    cloneOptions: CloneOptions
    onOptionsChange: (options: CloneOptions) => void
}

type SelectionMode = 'configured' | 'manual'

export default function EnvironmentSelector({ onEnvironmentsSelected, cloneOptions, onOptionsChange }: Props) {
    const t = useTranslations('databaseCloner.selectEnvironment')
    const [sourceMode, setSourceMode] = useState<SelectionMode>('manual')
    const [targetMode, setTargetMode] = useState<SelectionMode>('manual')

    const [configuredEnvs, setConfiguredEnvs] = useState<ConfiguredEnvironment[]>([])
    const [selectedSourceId, setSelectedSourceId] = useState<string>('')
    const [selectedTargetId, setSelectedTargetId] = useState<string>('')

    const [manualSource, setManualSource] = useState({
        name: 'Production',
        url: 'https://mhngbluefyucoesgcjoy.supabase.co',
        anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1obmdibHVlZnl1Y29lc2djam95Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDYxMzE3MjIsImV4cCI6MjA2MTcwNzcyMn0.buEObYOAzS8eCKZ6tti0gER1Xh1pjmEAMbDJVnX5WDU',
        serviceKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1obmdibHVlZnl1Y29lc2djam95Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NjEzMTcyMiwiZXhwIjoyMDYxNzA3NzIyfQ.GWP_COePfH8YlwuEX7zRc55U5p4XSlCJE5hJehGIurw',
        password: 'Canada!2025Mosta',
        host: 'aws-0-eu-central-1.pooler.supabase.com',
        port: '6543'
    })
    const [manualTarget, setManualTarget] = useState({
        name: 'Training',
        url: 'https://zgazjxmtcxgqmxxjrvsh.supabase.co',
        anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpnYXpqeG10Y3hncW14eGpydnNoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY2MTg1ODQsImV4cCI6MjA2MjE5NDU4NH0.dU17M9-7ftYxUh4JbkndGKsWikXlzI5COSUTFP7unHI',
        serviceKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpnYXpqeG10Y3hncW14eGpydnNoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NjYxODU4NCwiZXhwIjoyMDYyMTk0NTg0fQ.sEqFZT6IE3qJOi7e357oHZJoPbSECKpapAM9bk-CaIY',
        password: 'Canada!2025Mosta',
        host: 'aws-0-eu-central-1.pooler.supabase.com',
        port: '6543'
    })

    useEffect(() => {
        loadConfiguredEnvironments()
    }, [])

    const loadConfiguredEnvironments = async () => {
        try {
            const response = await fetch('/api/database-cloner/environments')
            const data = await response.json()
            if (data.success) {
                setConfiguredEnvs(data.environments)
            }
        } catch (error) {
            console.error('Failed to load environments:', error)
        }
    }

    const handleContinue = () => {
        const source = sourceMode === 'configured'
            ? buildConfiguredEnvironment(selectedSourceId, 'source')
            : buildManualEnvironment(manualSource, 'source')

        const target = targetMode === 'configured'
            ? buildConfiguredEnvironment(selectedTargetId, 'target')
            : buildManualEnvironment(manualTarget, 'target')

        if (source && target) {
            onEnvironmentsSelected(source, target)
        } else {
            alert('Please select or configure both source and target environments')
        }
    }

    const buildConfiguredEnvironment = (envId: string, type: 'source' | 'target'): CloneEnvironment | null => {
        const env = configuredEnvs.find(e => e.id === envId)
        if (!env) return null

        // In a real implementation, we would fetch the actual credentials from the .env file
        // For now, we'll use placeholder credentials
        return {
            id: env.id,
            name: env.name,
            type: 'configured',
            credentials: {
                url: `https://${env.id}.supabase.co`,
                anonKey: 'placeholder-anon-key',
                serviceKey: process.env[`${env.id.toUpperCase()}_SERVICE_KEY`] || 'placeholder-service-key'
            },
            description: env.description
        }
    }

    const buildManualEnvironment = (data: typeof manualSource, type: 'source' | 'target'): CloneEnvironment | null => {
        if (!data.name || !data.url || !data.serviceKey || !data.password) return null

        return {
            id: `manual-${type}`,
            name: data.name,
            type: 'manual',
            credentials: {
                url: data.url,
                anonKey: data.anonKey,
                serviceKey: data.serviceKey,
                password: data.password,
                host: data.host || undefined,
                port: data.port ? parseInt(data.port) : undefined
            }
        }
    }

    const canContinue =
        ((sourceMode === 'configured' && selectedSourceId !== '') ||
        (sourceMode === 'manual' && manualSource.name && manualSource.url && manualSource.serviceKey && manualSource.password)) &&
        ((targetMode === 'configured' && selectedTargetId !== '') ||
        (targetMode === 'manual' && manualTarget.name && manualTarget.url && manualTarget.serviceKey && manualTarget.password))

    return (
        <div className="space-y-8">

            <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-6">
                {t('title')}
            </h2>

            <div className="grid md:grid-cols-2 gap-8">

                {/* Source Environment */}
                <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-blue-600 dark:text-blue-400 flex items-center">
                        <span className="bg-blue-100 dark:bg-blue-900 w-8 h-8 rounded-full flex items-center justify-center mr-2">📤</span>
                        {t('source')}
                    </h3>

                    <div className="flex gap-2 mb-4">
                        <button
                            onClick={() => setSourceMode('configured')}
                            className={`flex-1 py-2 px-4 rounded-lg font-medium transition-all ${sourceMode === 'configured'
                                ? 'bg-blue-600 text-white'
                                : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                                }`}
                        >
                            {t('configured')}
                        </button>
                        <button
                            onClick={() => setSourceMode('manual')}
                            className={`flex-1 py-2 px-4 rounded-lg font-medium transition-all ${sourceMode === 'manual'
                                ? 'bg-blue-600 text-white'
                                : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                                }`}
                        >
                            {t('manual')}
                        </button>
                    </div>

                    {sourceMode === 'configured' ? (
                        <div className="space-y-2">
                            {configuredEnvs.filter(env => env.canBeSource).map(env => (
                                <EnvironmentCard
                                    key={env.id}
                                    environment={env}
                                    selected={selectedSourceId === env.id}
                                    onSelect={() => setSelectedSourceId(env.id)}
                                />
                            ))}
                        </div>
                    ) : (
                        <ManualEntryForm
                            data={manualSource}
                            onChange={setManualSource}
                            t={t}
                        />
                    )}
                </div>

                {/* Target Environment */}
                <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-green-600 dark:text-green-400 flex items-center">
                        <span className="bg-green-100 dark:bg-green-900 w-8 h-8 rounded-full flex items-center justify-center mr-2">📥</span>
                        {t('target')}
                    </h3>

                    <div className="flex gap-2 mb-4">
                        <button
                            onClick={() => setTargetMode('configured')}
                            className={`flex-1 py-2 px-4 rounded-lg font-medium transition-all ${targetMode === 'configured'
                                ? 'bg-green-600 text-white'
                                : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                                }`}
                        >
                            {t('configured')}
                        </button>
                        <button
                            onClick={() => setTargetMode('manual')}
                            className={`flex-1 py-2 px-4 rounded-lg font-medium transition-all ${targetMode === 'manual'
                                ? 'bg-green-600 text-white'
                                : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                                }`}
                        >
                            {t('manual')}
                        </button>
                    </div>

                    {targetMode === 'configured' ? (
                        <div className="space-y-2">
                            {configuredEnvs.filter(env => env.canBeTarget).map(env => (
                                <EnvironmentCard
                                    key={env.id}
                                    environment={env}
                                    selected={selectedTargetId === env.id}
                                    onSelect={() => setSelectedTargetId(env.id)}
                                />
                            ))}
                        </div>
                    ) : (
                        <ManualEntryForm
                            data={manualTarget}
                            onChange={setManualTarget}
                            t={t}
                        />
                    )}
                </div>

            </div>

            {/* Clone Options */}
            <div className="border-t border-slate-200 dark:border-slate-700 pt-6">
                <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-4">{useTranslations('databaseCloner.options')('title')}</h3>
                <div className="grid md:grid-cols-2 gap-4">
                    <OptionCheckbox
                        label={useTranslations('databaseCloner.options')('dataOnly')}
                        description={useTranslations('databaseCloner.options')('dataOnlyDesc')}
                        checked={cloneOptions.createBackup}
                        onChange={(checked) => onOptionsChange({ ...cloneOptions, createBackup: checked })}
                    />
                    <OptionCheckbox
                        label={useTranslations('databaseCloner.options')('schemaOnly')}
                        description={useTranslations('databaseCloner.options')('schemaOnlyDesc')}
                        checked={cloneOptions.anonymizeData}
                        onChange={(checked) => onOptionsChange({ ...cloneOptions, anonymizeData: checked })}
                    />
                    <OptionCheckbox
                        label={useTranslations('databaseCloner.options')('dropExisting')}
                        description={useTranslations('databaseCloner.options')('dropExistingDesc')}
                        checked={cloneOptions.includeFunctions}
                        onChange={(checked) => onOptionsChange({ ...cloneOptions, includeFunctions: checked })}
                    />
                    <OptionCheckbox
                        label={useTranslations('databaseCloner.options')('excludeTables')}
                        description={useTranslations('databaseCloner.options')('excludeTablesDesc')}
                        checked={cloneOptions.includeTriggers}
                        onChange={(checked) => onOptionsChange({ ...cloneOptions, includeTriggers: checked })}
                    />
                </div>
            </div>

            {/* Continue Button */}
            <div className="flex justify-end pt-4">
                <button
                    onClick={handleContinue}
                    disabled={!canContinue}
                    className="px-8 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg font-semibold hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                    {t('next')} →
                </button>
            </div>

        </div>
    )
}

function EnvironmentCard({ environment, selected, onSelect }: {
    environment: ConfiguredEnvironment
    selected: boolean
    onSelect: () => void
}) {
    return (
        <button
            onClick={onSelect}
            className={`w-full p-4 rounded-lg border-2 transition-all text-left ${selected
                ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/30'
                : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                }`}
        >
            <div className="flex items-center justify-between">
                <div>
                    <p className="font-semibold text-slate-800 dark:text-white">{environment.name}</p>
                    <p className="text-sm text-slate-500 dark:text-slate-400">{environment.description}</p>
                </div>
                {selected && <span className="text-blue-600 text-xl">✓</span>}
            </div>
        </button>
    )
}

function ManualEntryForm({ data, onChange, t }: {
    data: { name: string; url: string; anonKey: string; serviceKey: string; password: string; host: string; port: string }
    onChange: (data: any) => void
    t: any
}) {
    return (
        <div className="space-y-3">
            <input
                type="text"
                placeholder={t('environmentName')}
                value={data.name}
                onChange={(e) => onChange({ ...data, name: e.target.value })}
                className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-white"
            />
            <input
                type="url"
                placeholder={`${t('supabaseUrl')} (${t('supabaseUrlPlaceholder')})`}
                value={data.url}
                onChange={(e) => onChange({ ...data, url: e.target.value })}
                className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-white"
            />
            <input
                type="password"
                placeholder={`${t('anonKey')} (${t('anonKeyPlaceholder')})`}
                value={data.anonKey}
                onChange={(e) => onChange({ ...data, anonKey: e.target.value })}
                className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-white"
            />
            <input
                type="password"
                placeholder={`${t('serviceKey')} (${t('serviceKeyPlaceholder')})`}
                value={data.serviceKey}
                onChange={(e) => onChange({ ...data, serviceKey: e.target.value })}
                className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-white"
            />
            <div className="border-t border-slate-200 dark:border-slate-700 pt-3 mt-3">
                <div className="flex items-center gap-2 mb-2">
                    <span className="text-sm font-semibold text-amber-600 dark:text-amber-400">🔑 {t('postgresPassword')}</span>
                    <span className="text-xs px-2 py-0.5 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 rounded-full font-medium">{t('required')}</span>
                </div>
                <input
                    type="password"
                    placeholder={t('postgresPassword')}
                    value={data.password}
                    onChange={(e) => onChange({ ...data, password: e.target.value })}
                    className="w-full px-4 py-2 rounded-lg border-2 border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-900/20 text-slate-800 dark:text-white focus:border-amber-500 focus:ring-2 focus:ring-amber-200 dark:focus:ring-amber-800"
                />
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    📍 {t('findInSupabase')}
                </p>
            </div>
        </div>
    )
}

function OptionCheckbox({ label, description, checked, onChange }: {
    label: string
    description: string
    checked: boolean
    onChange: (checked: boolean) => void
}) {
    return (
        <label className="flex items-start space-x-3 cursor-pointer">
            <input
                type="checkbox"
                checked={checked}
                onChange={(e) => onChange(e.target.checked)}
                className="mt-1 w-5 h-5 text-blue-600 rounded"
            />
            <div>
                <p className="font-medium text-slate-800 dark:text-white">{label}</p>
                <p className="text-sm text-slate-500 dark:text-slate-400">{description}</p>
            </div>
        </label>
    )
}
