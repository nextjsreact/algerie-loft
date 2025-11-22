/**
 * Database Cloner - Main Page
 * 
 * Modern interface for cloning Supabase databases
 */

'use client'

import { useState, useRef } from 'react'
import { useTranslations } from 'next-intl'
import EnvironmentSelector from './components/EnvironmentSelector'
import ConnectionValidator from './components/ConnectionValidator'
import CloneConfirmation from './components/CloneConfirmation'
import CloneProgress from './components/CloneProgress'
import CloneResults from './components/CloneResults'
import { CloneEnvironment, CloneOptions } from '@/lib/database-cloner/types'

type Step = 'select' | 'validate' | 'confirm' | 'progress' | 'results'

export default function DatabaseClonerPage() {
    const t = useTranslations('databaseCloner')

    const [currentStep, setCurrentStep] = useState<Step>('select')
    const [sourceEnvironment, setSourceEnvironment] = useState<CloneEnvironment | null>(null)
    const [targetEnvironment, setTargetEnvironment] = useState<CloneEnvironment | null>(null)
    const [cloneOptions, setCloneOptions] = useState<CloneOptions>({
        createBackup: true,
        anonymizeData: false,
        includeStorage: false,
        includeFunctions: true,
        includeTriggers: true
    })
    const [operationId, setOperationId] = useState<string | null>(null)
    const [cloneSuccess, setCloneSuccess] = useState(false)

    const handleEnvironmentsSelected = (source: CloneEnvironment, target: CloneEnvironment) => {
        setSourceEnvironment(source)
        setTargetEnvironment(target)
        // Skip validation step - pg_dump will validate PostgreSQL credentials
        setCurrentStep('confirm')
    }

    const handleValidationComplete = () => {
        setCurrentStep('confirm')
    }

    const [isCloning, setIsCloning] = useState(false)
    const isCloningRef = useRef(false)

    const handleConfirmClone = async () => {
        console.log('🔵 [FRONTEND] handleConfirmClone called, isCloning:', isCloning, 'isCloningRef:', isCloningRef.current)
        
        if (isCloning || isCloningRef.current) {
            console.log('🔵 [FRONTEND] Clone already in progress, ignoring duplicate call')
            return
        }
        
        setIsCloning(true)
        isCloningRef.current = true
        setCurrentStep('progress')

        try {
            const response = await fetch('/api/database-cloner/start-clone', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    source: sourceEnvironment,
                    target: targetEnvironment,
                    options: cloneOptions
                })
            })

            const data = await response.json()

            if (data.success) {
                setOperationId(data.operationId)
            } else {
                console.error('Failed to start clone:', data.error)
                alert(`Error: ${data.error}`)
                setCurrentStep('confirm')
            }
        } catch (error) {
            console.error('Error starting clone:', error)
            alert('Failed to start clone operation')
            setCurrentStep('confirm')
        } finally {
            setTimeout(() => {
                setIsCloning(false)
                isCloningRef.current = false
                console.log('🔵 [FRONTEND] Clone lock released')
            }, 2000) // Keep lock for 2 seconds
        }
    }

    const handleCloneComplete = (success: boolean) => {
        setCloneSuccess(success)
        setCurrentStep('results')
    }

    const handleStartNew = () => {
        setCurrentStep('select')
        setSourceEnvironment(null)
        setTargetEnvironment(null)
        setOperationId(null)
        setCloneSuccess(false)
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-900 dark:via-slate-800 dark:to-indigo-900">
            <div className="container mx-auto px-4 py-8 max-w-7xl">

                {/* Header */}
                <div className="mb-8">
                    <button
                        onClick={() => window.history.back()}
                        className="mb-4 flex items-center gap-2 text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
                        </svg>
                        <span className="font-medium">{t('backToDashboard')}</span>
                    </button>
                    <div className="text-center">
                        <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-2">
                            🗄️ {t('title')}
                        </h1>
                        <p className="text-slate-600 dark:text-slate-300 text-lg">
                            {t('description')}
                        </p>
                    </div>
                </div>

                {/* Progress Steps */}
                <div className="mb-8">
                    <div className="flex items-center justify-center space-x-4">
                        <StepIndicator
                            step={1}
                            label={t('steps.select')}
                            active={currentStep === 'select'}
                            completed={['validate', 'confirm', 'progress', 'results'].includes(currentStep)}
                        />
                        <div className="h-1 w-16 bg-slate-300 dark:bg-slate-600" />
                        <StepIndicator
                            step={2}
                            label={t('steps.validate')}
                            active={currentStep === 'validate'}
                            completed={['confirm', 'progress', 'results'].includes(currentStep)}
                        />
                        <div className="h-1 w-16 bg-slate-300 dark:bg-slate-600" />
                        <StepIndicator
                            step={3}
                            label={t('steps.options')}
                            active={currentStep === 'confirm'}
                            completed={['progress', 'results'].includes(currentStep)}
                        />
                        <div className="h-1 w-16 bg-slate-300 dark:bg-slate-600" />
                        <StepIndicator
                            step={4}
                            label={t('steps.clone')}
                            active={currentStep === 'progress'}
                            completed={currentStep === 'results'}
                        />
                    </div>
                </div>

                {/* Content */}
                <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl p-8">

                    {currentStep === 'select' && (
                        <EnvironmentSelector
                            onEnvironmentsSelected={handleEnvironmentsSelected}
                            cloneOptions={cloneOptions}
                            onOptionsChange={setCloneOptions}
                        />
                    )}

                    {currentStep === 'validate' && sourceEnvironment && targetEnvironment && (
                        <ConnectionValidator
                            source={sourceEnvironment}
                            target={targetEnvironment}
                            onValidationComplete={handleValidationComplete}
                            onBack={() => setCurrentStep('select')}
                        />
                    )}

                    {currentStep === 'confirm' && sourceEnvironment && targetEnvironment && (
                        <CloneConfirmation
                            source={sourceEnvironment}
                            target={targetEnvironment}
                            options={cloneOptions}
                            onConfirm={handleConfirmClone}
                            onBack={() => setCurrentStep('select')}
                        />
                    )}

                    {currentStep === 'progress' && operationId && (
                        <CloneProgress
                            operationId={operationId}
                            onComplete={handleCloneComplete}
                        />
                    )}

                    {currentStep === 'results' && operationId && (
                        <CloneResults
                            operationId={operationId}
                            success={cloneSuccess}
                            onStartNew={handleStartNew}
                        />
                    )}

                </div>

            </div>
        </div>
    )
}

interface StepIndicatorProps {
    step: number
    label: string
    active: boolean
    completed: boolean
}

function StepIndicator({ step, label, active, completed }: StepIndicatorProps) {
    return (
        <div className="flex flex-col items-center">
            <div className={`
        w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg
        transition-all duration-300
        ${completed
                    ? 'bg-green-500 text-white'
                    : active
                        ? 'bg-blue-600 text-white ring-4 ring-blue-200 dark:ring-blue-400'
                        : 'bg-slate-200 dark:bg-slate-700 text-slate-500'
                }
      `}>
                {completed ? '✓' : step}
            </div>
            <span className={`
        mt-2 text-sm font-medium
        ${active ? 'text-blue-600 dark:text-blue-400' : 'text-slate-500'}
      `}>
                {label}
            </span>
        </div>
    )
}
