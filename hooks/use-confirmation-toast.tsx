/**
 * Hook personnalisé pour les confirmations avec toast
 */

import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { AlertTriangle, X, Check } from "lucide-react"

interface ConfirmationOptions {
  title: string
  description: string
  confirmText?: string
  cancelText?: string
  variant?: 'destructive' | 'default'
}

export function useConfirmationToast() {
  const confirm = (options: ConfirmationOptions): Promise<boolean> => {
    return new Promise((resolve) => {
      const {
        title,
        description,
        confirmText = "Confirmer",
        cancelText = "Annuler",
        variant = 'destructive'
      } = options

      toast.custom(
        (t) => (
          <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-4 max-w-md w-full">
            <div className="flex items-start gap-3">
              <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                variant === 'destructive' ? 'bg-red-100' : 'bg-blue-100'
              }`}>
                <AlertTriangle className={`w-4 h-4 ${
                  variant === 'destructive' ? 'text-red-600' : 'text-blue-600'
                }`} />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-medium text-gray-900 mb-1">
                  {title}
                </h3>
                <p className="text-sm text-gray-600 mb-3">
                  {description}
                </p>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant={variant}
                    onClick={() => {
                      toast.dismiss(t)
                      resolve(true)
                    }}
                    className="flex items-center gap-1"
                  >
                    <Check className="w-3 h-3" />
                    {confirmText}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      toast.dismiss(t)
                      resolve(false)
                    }}
                    className="flex items-center gap-1"
                  >
                    <X className="w-3 h-3" />
                    {cancelText}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        ),
        {
          duration: Infinity, // Ne pas fermer automatiquement
          position: 'top-center',
        }
      )
    })
  }

  return { confirm }
}