/**
 * Clone Results Component
 * 
 * Display final results of clone operation
 */

'use client'

import { useState, useEffect } from 'react'
import { CloneProgress } from '@/lib/database-cloner/types'

interface Props {
    operationId: string
    success: boolean
    onStartNew: () => void
}

export default function CloneResults({ operationId, success, onStartNew }: Props) {
    const [progress, setProgress] = useState<CloneProgress | null>(null)
    const [downloadingReport, setDownloadingReport] = useState(false)

    useEffect(() => {
        loadFinalStatus()
    }, [operationId])

    const loadFinalStatus = async () => {
        try {
            const response = await fetch(`/api/database-cloner/clone-status/${operationId}`)
            const data = await response.json()

            if (data.success && data.status) {
                setProgress(data.status)
            }
        } catch (error) {
            console.error('Failed to load final status:', error)
        }
    }

    const handleDownloadReport = () => {
        if (!progress) return

        setDownloadingReport(true)

        const report = {
            operationId: progress.operationId,
            status: progress.status,
            startedAt: progress.startedAt,
            completedAt: progress.completedAt,
            duration: progress.statistics.duration,
            statistics: progress.statistics,
            logs: progress.logs
        }

        const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `clone-report-${operationId}.json`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)

        setDownloadingReport(false)
    }

    if (!progress) {
        return (
            <div className="text-center py-12">
                <div className="inline-block animate-spin rounded-full h-16 w-16 border-4 border-blue-600 border-t-transparent"></div>
                <p className="mt-4 text-slate-600 dark:text-slate-300">Loading results...</p>
            </div>
        )
    }

    const duration = progress.completedAt
        ? Math.round((new Date(progress.completedAt).getTime() - new Date(progress.startedAt).getTime()) / 1000)
        : 0

    return (
        <div className="space-y-6">

            {/* Header */}
            <div className="text-center">
                {success ? (
                    <>
                        <div className="text-6xl mb-4">✅</div>
                        <h2 className="text-3xl font-bold text-green-600 dark:text-green-400 mb-2">
                            Clone Completed Successfully!
                        </h2>
                        <p className="text-slate-600 dark:text-slate-300">
                            Your database has been cloned successfully
                        </p>
                    </>
                ) : (
                    <>
                        <div className="text-6xl mb-4">❌</div>
                        <h2 className="text-3xl font-bold text-red-600 dark:text-red-400 mb-2">
                            Clone Failed
                        </h2>
                        <p className="text-slate-600 dark:text-slate-300">
                            The clone operation encountered an error
                        </p>
                    </>
                )}
            </div>

            {/* Summary Cards */}
            <div className="grid md:grid-cols-2 gap-6">

                {/* Operation Info */}
                <div className="border border-slate-200 dark:border-slate-700 rounded-lg p-6 bg-slate-50 dark:bg-slate-900">
                    <h3 className="font-semibold text-lg text-slate-800 dark:text-white mb-4">Operation Info</h3>
                    <div className="space-y-2 text-sm">
                        <InfoRow label="Operation ID" value={progress.operationId} />
                        <InfoRow label="Status" value={progress.status} />
                        <InfoRow label="Started At" value={new Date(progress.startedAt).toLocaleString()} />
                        {progress.completedAt && (
                            <InfoRow label="Completed At" value={new Date(progress.completedAt).toLocaleString()} />
                        )}
                        <InfoRow label="Duration" value={`${duration} seconds`} />
                    </div>
                </div>

                {/* Statistics */}
                <div className="border border-slate-200 dark:border-slate-700 rounded-lg p-6 bg-slate-50 dark:bg-slate-900">
                    <h3 className="font-semibold text-lg text-slate-800 dark:text-white mb-4">Statistics</h3>
                    <div className="space-y-2 text-sm">
                        <InfoRow label="Tables Processed" value={progress.statistics.tablesProcessed.toString()} />
                        <InfoRow label="Records Processed" value={progress.statistics.recordsProcessed.toLocaleString()} />
                        <InfoRow label="Functions Cloned" value={progress.statistics.functionsCloned.toString()} />
                        <InfoRow label="Triggers Cloned" value={progress.statistics.triggersCloned.toString()} />
                        <InfoRow label="Progress" value={`${progress.progress}%`} />
                    </div>
                </div>

            </div>

            {/* Logs */}
            <div className="border border-slate-200 dark:border-slate-700 rounded-lg p-6 bg-slate-50 dark:bg-slate-900">
                <h3 className="font-semibold text-lg text-slate-800 dark:text-white mb-4">Operation Logs</h3>
                <div className="max-h-64 overflow-y-auto space-y-1 font-mono text-sm">
                    {progress.logs.slice().reverse().map((log, i) => (
                        <div key={i} className={getLogColor(log.level)}>
                            <span className="opacity-50">{new Date(log.timestamp).toLocaleTimeString()}</span>
                            {' • '}
                            <span>{log.message}</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Actions */}
            <div className="flex justify-between pt-4">
                <button
                    onClick={handleDownloadReport}
                    disabled={downloadingReport}
                    className="px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 transition-all flex items-center space-x-2"
                >
                    <span>📥</span>
                    <span>{downloadingReport ? 'Downloading...' : 'Download Report'}</span>
                </button>

                <button
                    onClick={onStartNew}
                    className="px-8 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg font-semibold hover:from-blue-700 hover:to-indigo-700 transition-all"
                >
                    🔄 Start New Clone
                </button>
            </div>

        </div>
    )
}

function InfoRow({ label, value }: { label: string; value: string }) {
    return (
        <div className="flex justify-between items-center">
            <span className="text-slate-600 dark:text-slate-400">{label}:</span>
            <span className="font-semibold text-slate-800 dark:text-white">{value}</span>
        </div>
    )
}

function getLogColor(level: string): string {
    const colors = {
        info: 'text-blue-600 dark:text-blue-400',
        success: 'text-green-600 dark:text-green-400',
        warning: 'text-yellow-600 dark:text-yellow-400',
        error: 'text-red-600 dark:text-red-400'
    }
    return colors[level as keyof typeof colors] || colors.info
}
