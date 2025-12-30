'use client'

import { useState } from 'react'
import { Trash2, Edit, Archive, MoreHorizontal } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'

export interface BulkAction {
  key: string
  label: string
  icon?: React.ReactNode
  variant?: 'default' | 'destructive'
  requiresConfirmation?: boolean
  confirmationTitle?: string
  confirmationDescription?: string
}

interface BulkOperationsProps {
  selectedItems: string[]
  totalItems: number
  onSelectAll: (selected: boolean) => void
  onSelectionChange: (selectedIds: string[]) => void
  actions: BulkAction[]
  onAction: (actionKey: string, selectedIds: string[]) => void
  isLoading?: boolean
}

export function BulkOperations({
  selectedItems,
  totalItems,
  onSelectAll,
  onSelectionChange,
  actions,
  onAction,
  isLoading = false
}: BulkOperationsProps) {
  const [pendingAction, setPendingAction] = useState<BulkAction | null>(null)
  
  const isAllSelected = selectedItems.length === totalItems && totalItems > 0
  const isIndeterminate = selectedItems.length > 0 && selectedItems.length < totalItems

  const handleSelectAll = (checked: boolean) => {
    onSelectAll(checked)
  }

  const handleAction = (action: BulkAction) => {
    if (action.requiresConfirmation) {
      setPendingAction(action)
    } else {
      onAction(action.key, selectedItems)
    }
  }

  const confirmAction = () => {
    if (pendingAction) {
      onAction(pendingAction.key, selectedItems)
      setPendingAction(null)
    }
  }

  if (selectedItems.length === 0) {
    return null
  }

  return (
    <>
      <div className="flex items-center gap-4 p-4 bg-muted/50 rounded-lg border">
        <div className="flex items-center gap-2">
          <Checkbox
            checked={isAllSelected}
            ref={(el) => {
              if (el) {
                const input = el.querySelector('input');
                if (input) input.indeterminate = isIndeterminate;
              }
            }}
            onCheckedChange={handleSelectAll}
          />
          <span className="text-sm font-medium">
            {selectedItems.length} of {totalItems} selected
          </span>
        </div>

        <div className="flex items-center gap-2 ml-auto">
          {actions.slice(0, 2).map((action) => (
            <Button
              key={action.key}
              variant={action.variant || 'outline'}
              size="sm"
              onClick={() => handleAction(action)}
              disabled={isLoading}
              className="gap-2"
            >
              {action.icon}
              {action.label}
            </Button>
          ))}

          {actions.length > 2 && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" disabled={isLoading}>
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {actions.slice(2).map((action, index) => (
                  <div key={action.key}>
                    {index > 0 && <DropdownMenuSeparator />}
                    <DropdownMenuItem
                      onClick={() => handleAction(action)}
                      className={action.variant === 'destructive' ? 'text-destructive' : ''}
                    >
                      {action.icon}
                      {action.label}
                    </DropdownMenuItem>
                  </div>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          <Button
            variant="ghost"
            size="sm"
            onClick={() => onSelectionChange([])}
            disabled={isLoading}
          >
            Clear
          </Button>
        </div>
      </div>

      <AlertDialog open={!!pendingAction} onOpenChange={() => setPendingAction(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {pendingAction?.confirmationTitle || 'Confirm Action'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {pendingAction?.confirmationDescription || 
                `Are you sure you want to ${pendingAction?.label.toLowerCase()} ${selectedItems.length} item(s)? This action cannot be undone.`
              }
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmAction}
              className={pendingAction?.variant === 'destructive' ? 'bg-destructive text-destructive-foreground hover:bg-destructive/90' : ''}
            >
              Continue
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

// Hook for managing bulk selection
export function useBulkSelection<T extends { id: string }>(items: T[]) {
  const [selectedIds, setSelectedIds] = useState<string[]>([])

  const handleSelectAll = (selected: boolean) => {
    setSelectedIds(selected ? items.map(item => item.id) : [])
  }

  const handleItemSelect = (id: string, selected: boolean) => {
    setSelectedIds(prev => 
      selected 
        ? [...prev, id]
        : prev.filter(selectedId => selectedId !== id)
    )
  }

  const handleSelectionChange = (newSelectedIds: string[]) => {
    setSelectedIds(newSelectedIds)
  }

  const clearSelection = () => {
    setSelectedIds([])
  }

  return {
    selectedIds,
    handleSelectAll,
    handleItemSelect,
    handleSelectionChange,
    clearSelection,
    isSelected: (id: string) => selectedIds.includes(id),
    selectedCount: selectedIds.length
  }
}