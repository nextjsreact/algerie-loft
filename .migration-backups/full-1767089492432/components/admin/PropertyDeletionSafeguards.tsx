'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { 
  AlertTriangle, 
  Trash2, 
  Shield, 
  Calendar,
  Users,
  DollarSign,
  FileText,
  CheckCircle,
  XCircle,
  Loader2,
  Info,
  Clock,
  Home,
  MapPin
} from 'lucide-react'
import type { LoftWithRelations } from '@/lib/types'

interface PropertyDeletionSafeguardsProps {
  property: LoftWithRelations
  isOpen: boolean
  onClose: () => void
  onConfirmDelete: (deletionData: PropertyDeletionData) => Promise<void>
}

interface PropertyDeletionData {
  property_id: string
  deletion_type: 'soft' | 'hard'
  reason: string
  admin_notes: string
  confirm_text: string
}

interface DeletionCheck {
  id: string
  name: string
  status: 'checking' | 'passed' | 'failed' | 'warning'
  message: string
  details?: any
  blocking: boolean
}

interface ReservationData {
  id: string
  check_in: string
  check_out: string
  status: string
  guest_name?: string
  total_amount?: number
}

interface FinancialData {
  total_revenue: number
  pending_payments: number
  outstanding_bills: number
  last_transaction_date?: string
}

export function PropertyDeletionSafeguards({
  property,
  isOpen,
  onClose,
  onConfirmDelete
}: PropertyDeletionSafeguardsProps) {
  const [deletionChecks, setDeletionChecks] = useState<DeletionCheck[]>([])
  const [reservations, setReservations] = useState<ReservationData[]>([])
  const [financialData, setFinancialData] = useState<FinancialData | null>(null)
  const [loading, setLoading] = useState(false)
  const [processing, setProcessing] = useState(false)
  const [deletionType, setDeletionType] = useState<'soft' | 'hard'>('soft')
  const [reason, setReason] = useState('')
  const [adminNotes, setAdminNotes] = useState('')
  const [confirmText, setConfirmText] = useState('')
  const [canProceed, setCanProceed] = useState(false)

  const requiredConfirmText = `DELETE ${property.name}`

  useEffect(() => {
    if (isOpen && property) {
      performDeletionChecks()
    }
  }, [isOpen, property])

  useEffect(() => {
    // Check if deletion can proceed
    const hasBlockingIssues = deletionChecks.some(check => check.status === 'failed' && check.blocking)
    const hasRequiredFields = reason.trim().length > 0 && confirmText === requiredConfirmText
    setCanProceed(!hasBlockingIssues && hasRequiredFields)
  }, [deletionChecks, reason, confirmText, requiredConfirmText])

  const performDeletionChecks = async () => {
    setLoading(true)
    
    const checks: DeletionCheck[] = [
      {
        id: 'reservations',
        name: 'Active Reservations',
        status: 'checking',
        message: 'Checking for active reservations...',
        blocking: true
      },
      {
        id: 'future_reservations',
        name: 'Future Reservations',
        status: 'checking',
        message: 'Checking for future reservations...',
        blocking: true
      },
      {
        id: 'financial_obligations',
        name: 'Financial Obligations',
        status: 'checking',
        message: 'Checking financial obligations...',
        blocking: false
      },
      {
        id: 'partner_assignment',
        name: 'Partner Assignment',
        status: 'checking',
        message: 'Checking partner assignment...',
        blocking: false
      },
      {
        id: 'maintenance_tasks',
        name: 'Maintenance Tasks',
        status: 'checking',
        message: 'Checking pending maintenance tasks...',
        blocking: false
      }
    ]

    setDeletionChecks(checks)

    try {
      // Check active reservations
      await checkActiveReservations(checks)
      
      // Check future reservations
      await checkFutureReservations(checks)
      
      // Check financial obligations
      await checkFinancialObligations(checks)
      
      // Check partner assignment
      await checkPartnerAssignment(checks)
      
      // Check maintenance tasks
      await checkMaintenanceTasks(checks)

    } catch (error) {
      console.error('Error performing deletion checks:', error)
      setDeletionChecks(prev => prev.map(check => ({
        ...check,
        status: 'failed',
        message: 'Error performing check'
      })))
    } finally {
      setLoading(false)
    }
  }

  const checkActiveReservations = async (checks: DeletionCheck[]) => {
    try {
      const response = await fetch(`/api/admin/lofts/${property.id}/reservations?status=active`)
      const data = await response.json()
      
      const activeReservations = data.reservations || []
      setReservations(activeReservations)
      
      const checkIndex = checks.findIndex(c => c.id === 'reservations')
      if (checkIndex !== -1) {
        if (activeReservations.length === 0) {
          checks[checkIndex] = {
            ...checks[checkIndex],
            status: 'passed',
            message: 'No active reservations found'
          }
        } else {
          checks[checkIndex] = {
            ...checks[checkIndex],
            status: 'failed',
            message: `${activeReservations.length} active reservations found`,
            details: activeReservations
          }
        }
        setDeletionChecks([...checks])
      }
    } catch (error) {
      const checkIndex = checks.findIndex(c => c.id === 'reservations')
      if (checkIndex !== -1) {
        checks[checkIndex] = {
          ...checks[checkIndex],
          status: 'failed',
          message: 'Failed to check active reservations'
        }
        setDeletionChecks([...checks])
      }
    }
  }

  const checkFutureReservations = async (checks: DeletionCheck[]) => {
    try {
      const response = await fetch(`/api/admin/lofts/${property.id}/reservations?status=future`)
      const data = await response.json()
      
      const futureReservations = data.reservations || []
      
      const checkIndex = checks.findIndex(c => c.id === 'future_reservations')
      if (checkIndex !== -1) {
        if (futureReservations.length === 0) {
          checks[checkIndex] = {
            ...checks[checkIndex],
            status: 'passed',
            message: 'No future reservations found'
          }
        } else {
          checks[checkIndex] = {
            ...checks[checkIndex],
            status: 'failed',
            message: `${futureReservations.length} future reservations found`,
            details: futureReservations
          }
        }
        setDeletionChecks([...checks])
      }
    } catch (error) {
      const checkIndex = checks.findIndex(c => c.id === 'future_reservations')
      if (checkIndex !== -1) {
        checks[checkIndex] = {
          ...checks[checkIndex],
          status: 'failed',
          message: 'Failed to check future reservations'
        }
        setDeletionChecks([...checks])
      }
    }
  }

  const checkFinancialObligations = async (checks: DeletionCheck[]) => {
    try {
      const response = await fetch(`/api/admin/lofts/${property.id}/financial-summary`)
      const data = await response.json()
      
      const financial = data.financial || {
        total_revenue: 0,
        pending_payments: 0,
        outstanding_bills: 0
      }
      setFinancialData(financial)
      
      const checkIndex = checks.findIndex(c => c.id === 'financial_obligations')
      if (checkIndex !== -1) {
        const hasObligations = financial.pending_payments > 0 || financial.outstanding_bills > 0
        
        checks[checkIndex] = {
          ...checks[checkIndex],
          status: hasObligations ? 'warning' : 'passed',
          message: hasObligations 
            ? `Pending payments: ${financial.pending_payments}, Outstanding bills: ${financial.outstanding_bills}`
            : 'No pending financial obligations'
        }
        setDeletionChecks([...checks])
      }
    } catch (error) {
      const checkIndex = checks.findIndex(c => c.id === 'financial_obligations')
      if (checkIndex !== -1) {
        checks[checkIndex] = {
          ...checks[checkIndex],
          status: 'warning',
          message: 'Could not verify financial obligations'
        }
        setDeletionChecks([...checks])
      }
    }
  }

  const checkPartnerAssignment = async (checks: DeletionCheck[]) => {
    const checkIndex = checks.findIndex(c => c.id === 'partner_assignment')
    if (checkIndex !== -1) {
      if (property.partner_id) {
        checks[checkIndex] = {
          ...checks[checkIndex],
          status: 'warning',
          message: `Property is assigned to partner: ${property.owner_name || 'Unknown'}`
        }
      } else {
        checks[checkIndex] = {
          ...checks[checkIndex],
          status: 'passed',
          message: 'Property is not assigned to any partner'
        }
      }
      setDeletionChecks([...checks])
    }
  }

  const checkMaintenanceTasks = async (checks: DeletionCheck[]) => {
    try {
      const response = await fetch(`/api/admin/lofts/${property.id}/tasks?status=pending`)
      const data = await response.json()
      
      const pendingTasks = data.tasks || []
      
      const checkIndex = checks.findIndex(c => c.id === 'maintenance_tasks')
      if (checkIndex !== -1) {
        if (pendingTasks.length === 0) {
          checks[checkIndex] = {
            ...checks[checkIndex],
            status: 'passed',
            message: 'No pending maintenance tasks'
          }
        } else {
          checks[checkIndex] = {
            ...checks[checkIndex],
            status: 'warning',
            message: `${pendingTasks.length} pending maintenance tasks`,
            details: pendingTasks
          }
        }
        setDeletionChecks([...checks])
      }
    } catch (error) {
      const checkIndex = checks.findIndex(c => c.id === 'maintenance_tasks')
      if (checkIndex !== -1) {
        checks[checkIndex] = {
          ...checks[checkIndex],
          status: 'passed',
          message: 'Could not check maintenance tasks'
        }
        setDeletionChecks([...checks])
      }
    }
  }

  const handleConfirmDelete = async () => {
    if (!canProceed) return

    setProcessing(true)
    try {
      const deletionData: PropertyDeletionData = {
        property_id: property.id,
        deletion_type: deletionType,
        reason,
        admin_notes: adminNotes,
        confirm_text: confirmText
      }

      await onConfirmDelete(deletionData)
      onClose()
    } catch (error) {
      console.error('Error confirming deletion:', error)
    } finally {
      setProcessing(false)
    }
  }

  const getCheckIcon = (status: string) => {
    switch (status) {
      case 'checking':
        return <Loader2 className="w-4 h-4 animate-spin text-gray-500" />
      case 'passed':
        return <CheckCircle className="w-4 h-4 text-green-600" />
      case 'failed':
        return <XCircle className="w-4 h-4 text-red-600" />
      case 'warning':
        return <AlertTriangle className="w-4 h-4 text-orange-600" />
      default:
        return <Clock className="w-4 h-4 text-gray-500" />
    }
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('fr-DZ', {
      style: 'currency',
      currency: 'DZD'
    }).format(price)
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-red-600" />
            Property Deletion Safeguards
          </DialogTitle>
          <DialogDescription>
            Comprehensive safety checks before deleting "{property.name}"
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[70vh] pr-4">
          <div className="space-y-6">
            {/* Property Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Home className="w-4 h-4" />
                  Property Summary
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium text-gray-600">Name:</span>
                    <p>{property.name}</p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-600">Address:</span>
                    <p className="flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      {property.address}
                    </p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-600">Partner:</span>
                    <p>{property.owner_name || 'Unassigned'}</p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-600">Status:</span>
                    <Badge variant="outline">{property.status}</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Safety Checks */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="w-4 h-4" />
                  Safety Checks
                </CardTitle>
                <CardDescription>
                  Automated checks to prevent accidental data loss
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {deletionChecks.map((check) => (
                    <div key={check.id} className="flex items-start gap-3 p-3 border rounded-lg">
                      {getCheckIcon(check.status)}
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{check.name}</span>
                          {check.blocking && check.status === 'failed' && (
                            <Badge variant="destructive" className="text-xs">
                              Blocking
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 mt-1">{check.message}</p>
                        
                        {/* Show reservation details */}
                        {check.id === 'reservations' && check.details && check.details.length > 0 && (
                          <div className="mt-2 p-2 bg-red-50 rounded text-xs">
                            <p className="font-medium text-red-800">Active Reservations:</p>
                            {check.details.slice(0, 3).map((reservation: ReservationData) => (
                              <div key={reservation.id} className="mt-1">
                                {reservation.check_in} - {reservation.check_out} ({reservation.status})
                              </div>
                            ))}
                            {check.details.length > 3 && (
                              <p className="mt-1 text-red-600">...and {check.details.length - 3} more</p>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Financial Summary */}
            {financialData && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <DollarSign className="w-4 h-4" />
                    Financial Summary
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="font-medium text-gray-600">Total Revenue:</span>
                      <p>{formatPrice(financialData.total_revenue)}</p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-600">Pending Payments:</span>
                      <p className={financialData.pending_payments > 0 ? 'text-orange-600' : ''}>
                        {formatPrice(financialData.pending_payments)}
                      </p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-600">Outstanding Bills:</span>
                      <p className={financialData.outstanding_bills > 0 ? 'text-red-600' : ''}>
                        {formatPrice(financialData.outstanding_bills)}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            <Separator />

            {/* Deletion Configuration */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Trash2 className="w-4 h-4" />
                  Deletion Configuration
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Deletion Type</Label>
                  <div className="flex gap-4 mt-2">
                    <label className="flex items-center gap-2">
                      <input
                        type="radio"
                        value="soft"
                        checked={deletionType === 'soft'}
                        onChange={(e) => setDeletionType(e.target.value as 'soft')}
                      />
                      <span>Soft Delete (Recommended)</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="radio"
                        value="hard"
                        checked={deletionType === 'hard'}
                        onChange={(e) => setDeletionType(e.target.value as 'hard')}
                      />
                      <span>Hard Delete (Permanent)</span>
                    </label>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    {deletionType === 'soft' 
                      ? 'Property will be marked as deleted but data will be preserved'
                      : 'Property will be permanently removed from the database'
                    }
                  </p>
                </div>

                <div>
                  <Label htmlFor="reason">Deletion Reason *</Label>
                  <Textarea
                    id="reason"
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="Explain why this property is being deleted..."
                    rows={3}
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="admin-notes">Admin Notes</Label>
                  <Textarea
                    id="admin-notes"
                    value={adminNotes}
                    onChange={(e) => setAdminNotes(e.target.value)}
                    placeholder="Additional notes for audit trail..."
                    rows={2}
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="confirm-text">
                    Confirmation Text *
                  </Label>
                  <p className="text-sm text-gray-600 mb-2">
                    Type <code className="bg-gray-100 px-1 rounded">{requiredConfirmText}</code> to confirm deletion
                  </p>
                  <Input
                    id="confirm-text"
                    value={confirmText}
                    onChange={(e) => setConfirmText(e.target.value)}
                    placeholder={requiredConfirmText}
                    className={confirmText === requiredConfirmText ? 'border-green-500' : 'border-red-500'}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Warnings */}
            {deletionChecks.some(check => check.status === 'failed' && check.blocking) && (
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Cannot proceed with deletion:</strong> There are blocking issues that must be resolved first.
                  Please address the failed safety checks above.
                </AlertDescription>
              </Alert>
            )}

            {deletionChecks.some(check => check.status === 'warning') && (
              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  <strong>Warning:</strong> There are potential issues that should be reviewed before deletion.
                  Proceed with caution.
                </AlertDescription>
              </Alert>
            )}
          </div>
        </ScrollArea>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleConfirmDelete}
            disabled={!canProceed || processing || loading}
          >
            {processing ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Trash2 className="w-4 h-4 mr-2" />
            )}
            {deletionType === 'soft' ? 'Soft Delete' : 'Permanently Delete'} Property
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}