"use client"

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "./dialog"
import { Button } from "./button"
import { X } from "lucide-react"

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title?: string
  description?: string
  children: React.ReactNode
  size?: "sm" | "md" | "lg" | "xl" | "full"
  showCloseButton?: boolean
  closeOnOverlayClick?: boolean
}

export function Modal({
  isOpen,
  onClose,
  title,
  description,
  children,
  size = "md",
  showCloseButton = true,
  closeOnOverlayClick = true
}: ModalProps) {
  const sizeClasses = {
    sm: "max-w-sm",
    md: "max-w-md", 
    lg: "max-w-lg",
    xl: "max-w-xl",
    full: "max-w-[95vw] max-h-[95vh]"
  }

  return (
    <Dialog open={isOpen} onOpenChange={closeOnOverlayClick ? onClose : undefined}>
      <DialogContent className={sizeClasses[size]} onPointerDownOutside={closeOnOverlayClick ? undefined : (e) => e.preventDefault()}>
        {showCloseButton && (
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
            onClick={onClose}
          >
            <X className="h-4 w-4" />
            <span className="sr-only">Close</span>
          </Button>
        )}
        
        {(title || description) && (
          <DialogHeader>
            {title && <DialogTitle>{title}</DialogTitle>}
            {description && <DialogDescription>{description}</DialogDescription>}
          </DialogHeader>
        )}
        
        {children}
      </DialogContent>
    </Dialog>
  )
}

// Specialized modal components
export function ConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  title = "Are you sure?",
  description,
  confirmText = "Confirm",
  cancelText = "Cancel",
  variant = "default"
}: {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  title?: string
  description?: string
  confirmText?: string
  cancelText?: string
  variant?: "default" | "destructive"
}) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} description={description} size="sm">
      <div className="flex gap-2 justify-end">
        <Button variant="outline" onClick={onClose}>
          {cancelText}
        </Button>
        <Button 
          variant={variant === "destructive" ? "destructive" : "default"}
          onClick={() => {
            onConfirm()
            onClose()
          }}
        >
          {confirmText}
        </Button>
      </div>
    </Modal>
  )
}

export function ImageModal({
  isOpen,
  onClose,
  src,
  alt,
  title
}: {
  isOpen: boolean
  onClose: () => void
  src: string
  alt: string
  title?: string
}) {
  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      title={title}
      size="full"
      closeOnOverlayClick={true}
    >
      <div className="flex items-center justify-center">
        <img
          src={src}
          alt={alt}
          className="max-w-full max-h-[80vh] object-contain"
        />
      </div>
    </Modal>
  )
}

export function ContactModal({
  isOpen,
  onClose,
  propertyTitle
}: {
  isOpen: boolean
  onClose: () => void
  propertyTitle?: string
}) {
  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      title={propertyTitle ? `Inquire about ${propertyTitle}` : "Contact us"}
      size="lg"
    >
      <div className="space-y-4">
        <p className="text-muted-foreground">
          {propertyTitle 
            ? `Get more information about ${propertyTitle} or schedule a viewing.`
            : "Get in touch with our team for more information about our services."
          }
        </p>
        {/* Contact form will be added in the forms task */}
        <div className="p-4 bg-muted rounded-lg text-center text-muted-foreground">
          Contact form will be implemented in the forms section
        </div>
      </div>
    </Modal>
  )
}