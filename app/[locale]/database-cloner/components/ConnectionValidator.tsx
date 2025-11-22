/**
 * Connection Validator Component
 * 
 * Validates connections to source and target databases
 */

'use client'

import { useState, useEffect } from 'react'
import { CloneEnvironment, ValidationResult } from '@/lib/database-cloner/types'

interface Props {
    source: CloneEnvironment
    target: CloneEnvironment
    onValidationComplete: () => void
    onBack: () => void
}

export default function ConnectionValidator({ source, target, onValidationComplete, onBack }: Props) {
    const [validating, setValidating] = useState(false)
    const [sourceValidation, setSourceValidation] = useState<ValidationResult | null>(null)
    const [targetValidation, setTargetValidation] = useState<ValidationResult | null>(null)
    const [validationComplete, setValidationComplete] = useState(false)

    useEffect(() => {
        validateConnections()
    }, [])

    const validateConnections = async () => {
        setValidating(true)
        setValidationComplete(false)

        try {
            // Validate source
            const sourceResponse = await fetch('/api/database-cloner/validate-connection', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    credentials: source.credentials,
                    environmentName: source.name
                })
            })
            const sourceData = await sourceResponse.json()
            setSourceValidation(sourceData.validation)

            // Validate target
            const targetResponse = await fetch('/api/database-cloner/validate-connection', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    credentials: target.credentials,
                    environmentName: target.name
                })
            })
            const targetData = await targetResponse.json()
            setTargetValidation(targetData.validation)

            setValidationComplete(true)
        } catch (error) {
            console.error('Validation failed:', error)
        } finally {
            setValidating(false)
        }
    }

    const bothValid = sourceValidation?.isValid && targetValidation?.isValid

    return (
        <div className="space-y-6">

            <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-6">
                Connection Validation
            </h2>

            {validating && (
                <div className="text-center py-12">
                    <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent"></div>
                    <p className="mt-4 text-slate-600 dark:text-slate-300">Validating connections...</p>
                </div>
            )}

            {!validating && validationComplete && (
                <div className="space-y-6">

                    {/* Source Validation */}
                    <ValidationCard
                        title="Source Database"
                        environment={source.name}
                        validation={sourceValidation}
                        color="blue"
                    />

                    {/* Target Validation */}
                    <ValidationCard
                        title="Target Database"
                        environment={target.name}
                        validation={targetValidation}
                        color="green"
                    />

                    {/* Warnings */}
                    {bothValid && (
                        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                            <div className="flex items-start">
                                <span className="text-2xl mr-3">⚠️</span>
                                <div>
                                    <h4 className="font-bold text-yellow-800 dark:text-yellow-200 mb-2">Important Information</h4>
                                    <ul className="list-disc list-inside text-yellow-700 dark:text-yellow-300 space-y-1">
                                        <li>All existing data in <strong>{target.name}</strong> will be permanently deleted</li>
                                        <li>This operation cannot be undone without a backup</li>
                                        <li>The cloning process may take several minutes depending on data volume</li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Actions */}
                    <div className="flex justify-between pt-4">
                        <button
                            onClick={onBack}
                            className="px-6 py-3 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg font-semibold hover:bg-slate-300 dark:hover:bg-slate-600 transition-all"
                        >
                            ← Back
                        </button>

                        {bothValid ? (
                            <button
                                onClick={onValidationComplete}
                                className="px-8 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg font-semibold hover:from-blue-700 hover:to-indigo-700 transition-all"
                            >
                                Continue to Confirmation →
                            </button>
                        ) : (
                            <button
                                onClick={validateConnections}
                                className="px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-all"
                            >
                                🔄 Retry Validation
                            </button>
                        )}
                    </div>

                </div>
            )}

        </div>
    )
}

function ValidationCard({ title, environment, validation, color }: {
    title: string
    environment: string
    validation: ValidationResult | null
    color: 'blue' | 'green'
}) {
    const colorClasses = color === 'blue'
        ? 'border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20'
        : 'border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20'

    return (
        <div className={`border rounded-lg p-6 ${colorClasses}`}>
            <div className="flex items-center justify-between mb-4">
                <div>
                    <h3 className="text-lg font-semibold text-slate-800 dark:text-white">{title}</h3>
                    <p className="text-sm text-slate-600 dark:text-slate-300">{environment}</p>
                </div>
                {validation && (
                    <div className={`text-3xl ${validation.isValid ? 'text-green-500' : 'text-red-500'}`}>
                        {validation.isValid ? '✅' : '❌'}
                    </div>
                )}
            </div>

            {validation && (
                <div className="space-y-2">
                    <CheckItem label="Connection" passed={validation.checks.connectionSuccessful} />
                    <CheckItem label="Read Permission" passed={validation.checks.hasReadPermission} />
                    <CheckItem label="Write Permission" passed={validation.checks.hasWritePermission} />
                    <CheckItem label="Schema Access" passed={validation.checks.schemaAccessible} />

                    {validation.errors.length > 0 && (
                        <div className="mt-4 p-3 bg-red-100 dark:bg-red-900/30 rounded-lg">
                            <p className="font-semibold text-red-800 dark:text-red-200 mb-1">Errors:</p>
                            <ul className="list-disc list-inside text-sm text-red-700 dark:text-red-300">
                                {validation.errors.map((error, i) => (
                                    <li key={i}>{error}</li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {validation.warnings.length > 0 && (
                        <div className="mt-4 p-3 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg">
                            <p className="font-semibold text-yellow-800 dark:text-yellow-200 mb-1">Warnings:</p>
                            <ul className="list-disc list-inside text-sm text-yellow-700 dark:text-yellow-300">
                                {validation.warnings.map((warning, i) => (
                                    <li key={i}>{warning}</li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}

function CheckItem({ label, passed }: { label: string; passed: boolean }) {
    return (
        <div className="flex items-center justify-between text-sm">
            <span className="text-slate-700 dark:text-slate-300">{label}</span>
            <span className={passed ? 'text-green-600' : 'text-red-600'}>
                {passed ? '✓' : '✗'}
            </span>
        </div>
    )
}
