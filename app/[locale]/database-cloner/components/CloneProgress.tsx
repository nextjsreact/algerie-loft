/**
 * Clone Progress Component
 * 
 * Real-time progress display during clone operation
 */

'use client'

import { useState, useEffect, useRef } from 'react'
import { CloneProgress as CloneProgressType } from '@/lib/database-cloner/types'

interface Props {
    operationId: string
    onComplete: (success: boolean) => void
}

export default function CloneProgress({ operationId, onComplete }: Props) {
    const [progress, setProgress] = useState<CloneProgressType | null>(null)
    const [cancelling, setCancelling] = useState(false)
    const intervalRef = useRef<NodeJS.Timeout | null>(null)

    useEffect(() => {
        // Poll for progress updates
        const pollProgress = async () => {
            try {
                const response = await fetch(`/api/database-cloner/clone-status/${operationId}`)
                const data = await response.json()

                if (data.success && data.status) {
                    setProgress(data.status)

                    // Check if completed or failed
                    if (data.status.status === 'completed') {
                        if (intervalRef.current) {
                            clearInterval(intervalRef.current)
                        }
                        onComplete(true)
                    } else if (data.status.status === 'failed' || data.status.status === 'cancelled') {
                        if (intervalRef.current) {
                            clearInterval(intervalRef.current)
                        }
                        onComplete(false)
                    }
                }
            } catch (error) {
                console.error('Failed to fetch progress:', error)
            }
        }

        // Initial fetch
        pollProgress()

        // Poll every 2 seconds
        intervalRef.current = setInterval(pollProgress, 2000)

        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current)
            }
        }
    }, [operationId, onComplete])

    const handleCancel = async () => {
        if (!confirm('Are you sure you want to cancel this operation?')) {
            return
        }

        setCancelling(true)
        try {
            await fetch(`/api/database-cloner/cancel-clone/${operationId}`, {
                method: 'POST'
            })
        } catch (error) {
            console.error('Failed to cancel operation:', error)
        }
    }

    if (!progress) {
        return (
            <div className="text-center py-12">
                <div className="inline-block animate-spin rounded-full h-16 w-16 border-4 border-blue-600 border-t-transparent"></div>
                <p className="mt-4 text-slate-600 dark:text-slate-300">Loading operation status...</p>
            </div>
        )
    }

    const isInProgress = !['completed', 'failed', 'cancelled'].includes(progress.status)

    return (
        <div className="space-y-6">

            <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-6">
                Clone in Progress
            </h2>

            {/* Progress Bar */}
            <div className="space-y-2">
                <div className="flex justify-between text-sm">
                    <span className="font-medium text-slate-700 dark:text-slate-300">{progress.currentPhase}</span>
                    <span className="font-bold text-blue-600">{progress.progress}%</span>
                </div>
                <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                    <div
                        className="h-full bg-gradient-to-r from-blue-600 to-indigo-600 transition-all duration-500 ease-out"
                        style={{ width: `${progress.progress}%` }}
                    />
                </div>
            </div>

            {/* Status Badge */}
            <div className="flex justify-center">
                <StatusBadge status={progress.status} />
            </div>

            {/* Statistics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <StatCard
                    label="Tables"
                    value={`${progress.statistics.tablesProcessed} / ${progress.statistics.totalTables || '?'}`}
                    icon="📊"
                />
                <StatCard
                    label="Records"
                    value={progress.statistics.recordsProcessed.toLocaleString()}
                    icon="📝"
                />
                <StatCard
                    label="Functions"
                    value={progress.statistics.functionsCloned.toString()}
                    icon="⚡"
                />
                <StatCard
                    label="Triggers"
                    value={progress.statistics.triggersCloned.toString()}
                    icon="🔔"
                />
            </div>

            {/* Logs */}
            <div className="border border-slate-200 dark:border-slate-700 rounded-lg p-4 bg-slate-50 dark:bg-slate-900 max-h-96 overflow-y-auto">
                <h3 className="font-semibold text-slate-800 dark:text-white mb-3 flex items-center">
                    <span className="mr-2">📋</span>
                    Operation Logs
                </h3>
                <div className="space-y-1 font-mono text-sm">
                    {progress.logs.slice().reverse().map((log, i) => (
                        <LogEntry key={i} log={log} />
                    ))}
                </div>
            </div>

            {/* Cancel Button */}
            {isInProgress && (
                <div className="flex justify-center pt-4">
                    <button
                        onClick={handleCancel}
                        disabled={cancelling}
                        className="px-6 py-3 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 disabled:opacity-50 transition-all"
                    >
                        {cancelling ? 'Cancelling...' : '❌ Cancel Operation'}
                    </button>
                </div>
            )}

        </div>
    )
}

function StatusBadge({ status }: { status: string }) {
    const statusConfig: Record<string, { color: string; label: string; icon: string }> = {
        pending: { color: 'bg-slate-500', label: 'Pending', icon: '⏳' },
        validating: { color: 'bg-blue-500', label: 'Validating', icon: '🔍' },
        creating_backup: { color: 'bg-purple-500', label: 'Creating Backup', icon: '💾' },
        deleting_target: { color: 'bg-orange-500', label: 'Deleting Target', icon: '🗑️' },
        copying_schema: { color: 'bg-indigo-500', label: 'Copying Schema', icon: '🏗️' },
        copying_data: { color: 'bg-blue-500', label: 'Copying Data', icon: '📦' },
        copying_functions: { color: 'bg-purple-500', label: 'Copying Functions', icon: '⚡' },
        copying_triggers: { color: 'bg-pink-500', label: 'Copying Triggers', icon: '🔔' },
        validating_result: { color: 'bg-green-500', label: 'Validating Result', icon: '✅' },
        completed: { color: 'bg-green-500', label: 'Completed', icon: '✅' },
        failed: { color: 'bg-red-500', label: 'Failed', icon: '❌' },
        cancelled: { color: 'bg-slate-500', label: 'Cancelled', icon: '🚫' }
    }

    const config = statusConfig[status] || statusConfig.pending

    return (
        <div className={`${config.color} text-white px-6 py-3 rounded-full font-semibold flex items-center space-x-2`}>
            <span className="text-xl">{config.icon}</span>
            <span>{config.label}</span>
        </div>
    )
}

function StatCard({ label, value, icon }: { label: string; value: string; icon: string }) {
    return (
        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-4">
            <div className="text-2xl mb-1">{icon}</div>
            <div className="text-2xl font-bold text-slate-800 dark:text-white">{value}</div>
            <div className="text-sm text-slate-500 dark:text-slate-400">{label}</div>
        </div>
    )
}

function LogEntry({ log }: { log: any }) {
    const levelColors = {
        info: 'text-blue-600 dark:text-blue-400',
        success: 'text-green-600 dark:text-green-400',
        warning: 'text-yellow-600 dark:text-yellow-400',
        error: 'text-red-600 dark:text-red-400'
    }

    const color = levelColors[log.level as keyof typeof levelColors] || levelColors.info

    return (
        <div className={`${color} flex items-start space-x-2`}>
            <span className="opacity-50">{new Date(log.timestamp).toLocaleTimeString()}</span>
            <span>•</span>
            <span className="flex-1">{log.message}</span>
        </div>
    )
}
