/**
 * Clone Confirmation Component
 * 
 * Final confirmation before starting the clone operation
 */

'use client'

import { useState, useEffect, useRef } from 'react'
import { useTranslations } from 'next-intl'
import { CloneEnvironment, CloneOptions } from '@/lib/database-cloner/types'

interface Props {
    source: CloneEnvironment
    target: CloneEnvironment
    options: CloneOptions
    onConfirm: () => void
    onBack: () => void
}

export default function CloneConfirmation({ source, target, options, onConfirm, onBack }: Props) {
    const t = useTranslations('databaseCloner.confirmation')
    const tOptions = useTranslations('databaseCloner.options')
    const [confirmed, setConfirmed] = useState(false)
    const [countdown, setCountdown] = useState(0)
    const [isStarting, setIsStarting] = useState(false)
    const intervalRef = useRef<NodeJS.Timeout | null>(null)

    // Cleanup interval on unmount
    useEffect(() => {
        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current)
            }
        }
    }, [])

    // Handle countdown
    useEffect(() => {
        if (countdown > 0 && countdown <= 3) {
            intervalRef.current = setInterval(() => {
                setCountdown(prev => {
                    if (prev <= 1) {
                        if (intervalRef.current) {
                            clearInterval(intervalRef.current)
                            intervalRef.current = null
                        }
                        onConfirm()
                        return 0
                    }
                    return prev - 1
                })
            }, 1000)

            return () => {
                if (intervalRef.current) {
                    clearInterval(intervalRef.current)
                    intervalRef.current = null
                }
            }
        }
    }, [countdown, onConfirm])

    const handleConfirmClick = () => {
        if (!confirmed) {
            alert(t('makeSure'))
            return
        }

        if (isStarting) {
            console.log('Clone already starting, ignoring duplicate click')
            return
        }

        setIsStarting(true)
        setCountdown(3) // This will trigger the useEffect above
    }

    return (
        <div className="space-y-6">

            <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-6">
                {t('title')}
            </h2>

            {/* Summary */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
                <h3 className="font-semibold text-lg text-slate-800 dark:text-white mb-4">{t('operationSummary')}</h3>

                <div className="space-y-3">
                    <div className="flex items-center justify-between">
                        <span className="text-slate-600 dark:text-slate-300">{t('source')}:</span>
                        <span className="font-semibold text-blue-600 dark:text-blue-400">{source.name}</span>
                    </div>
                    <div className="text-center text-2xl">↓</div>
                    <div className="flex items-center justify-between">
                        <span className="text-slate-600 dark:text-slate-300">{t('target')}:</span>
                        <span className="font-semibold text-green-600 dark:text-green-400">{target.name}</span>
                    </div>
                </div>
            </div>

            {/* Options Summary */}
            <div className="border border-slate-200 dark:border-slate-700 rounded-lg p-6">
                <h3 className="font-semibold text-lg text-slate-800 dark:text-white mb-4">{t('cloneOptions')}</h3>
                <div className="grid grid-cols-2 gap-3">
                    <OptionItem label={tOptions('createBackup')} enabled={options.createBackup} />
                    <OptionItem label={tOptions('anonymizeData')} enabled={options.anonymizeData} />
                    <OptionItem label={tOptions('includeFunctions')} enabled={options.includeFunctions} />
                    <OptionItem label={tOptions('includeTriggers')} enabled={options.includeTriggers} />
                </div>
            </div>

            {/* Warning */}
            <div className="bg-red-50 dark:bg-red-900/20 border-2 border-red-300 dark:border-red-700 rounded-lg p-6">
                <div className="flex items-start">
                    <span className="text-3xl mr-4">⚠️</span>
                    <div>
                        <h3 className="font-bold text-red-800 dark:text-red-200 text-lg mb-3">{t('criticalWarning')}</h3>
                        <div className="space-y-2 text-red-700 dark:text-red-300">
                            <p className="font-semibold">{t('thisOperationWill')}</p>
                            <ul className="list-disc list-inside space-y-1 ml-4">
                                <li><strong>{t('permanentlyDelete', { target: target.name })}</strong></li>
                                <li>{t('replaceWith', { source: source.name })}</li>
                                <li>{t('takeSeveralMinutes')}</li>
                                <li>{t('cannotBeUndone')}</li>
                            </ul>
                            <div className="mt-4 p-3 bg-red-100 dark:bg-red-900/40 rounded border border-red-300 dark:border-red-700">
                                <p className="font-bold text-red-900 dark:text-red-100">
                                    ⚠️ {t('makeSure')}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Confirmation Checkbox */}
            <div className="border-2 border-slate-300 dark:border-slate-600 rounded-lg p-6 bg-slate-50 dark:bg-slate-800">
                <label className="flex items-start space-x-3 cursor-pointer">
                    <input
                        type="checkbox"
                        checked={confirmed}
                        onChange={(e) => setConfirmed(e.target.checked)}
                        className="mt-1 w-6 h-6 text-red-600 rounded"
                    />
                    <div>
                        <p className="font-bold text-slate-800 dark:text-white text-lg">
                            {t('iUnderstand', { target: target.name })}
                        </p>
                        <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                            {t('iHaveVerified', { target: target.name })}
                        </p>
                    </div>
                </label>
            </div>

            {/* Actions */}
            <div className="flex justify-between pt-4">
                <button
                    onClick={onBack}
                    disabled={countdown > 0}
                    className="px-6 py-3 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg font-semibold hover:bg-slate-300 dark:hover:bg-slate-600 transition-all disabled:opacity-50"
                >
                    ← {t('back')}
                </button>

                <button
                    onClick={handleConfirmClick}
                    disabled={!confirmed || countdown > 0}
                    className="px-8 py-3 bg-gradient-to-r from-red-600 to-orange-600 text-white rounded-lg font-semibold hover:from-red-700 hover:to-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                    {countdown > 0 ? `Starting in ${countdown}...` : `⚠️ ${t('startClone')}`}
                </button>
            </div>

        </div>
    )
}

function OptionItem({ label, enabled }: { label: string; enabled: boolean }) {
    return (
        <div className="flex items-center space-x-2">
            <span className={`text-lg ${enabled ? 'text-green-500' : 'text-slate-400'}`}>
                {enabled ? '✓' : '○'}
            </span>
            <span className={enabled ? 'text-slate-800 dark:text-white' : 'text-slate-500 dark:text-slate-400'}>
                {label}
            </span>
        </div>
    )
}
