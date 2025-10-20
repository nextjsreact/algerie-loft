import type { Meta, StoryObj } from '@storybook/react'
import { useState } from 'react'
import { Modal, ConfirmationModal, ImageModal, ContactModal } from '@/components/ui/modal'
import { Button } from '@/components/ui/button'

const meta: Meta<typeof Modal> = {
  title: 'UI/Modal',
  component: Modal,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    size: {
      control: { type: 'select' },
      options: ['sm', 'md', 'lg', 'xl', 'full'],
    },
    showCloseButton: {
      control: { type: 'boolean' },
    },
    closeOnOverlayClick: {
      control: { type: 'boolean' },
    },
  },
}

export default meta
type Story = StoryObj<typeof meta>

// Template for interactive stories
const ModalTemplate = (args: any) => {
  const [isOpen, setIsOpen] = useState(false)
  
  return (
    <>
      <Button onClick={() => setIsOpen(true)}>Open Modal</Button>
      <Modal {...args} isOpen={isOpen} onClose={() => setIsOpen(false)}>
        {args.children}
      </Modal>
    </>
  )
}

export const Default: Story = {
  render: ModalTemplate,
  args: {
    title: 'Default Modal',
    description: 'This is a default modal with title and description.',
    children: (
      <div className="space-y-4">
        <p>This is the modal content. You can put any content here.</p>
        <div className="flex justify-end gap-2">
          <Button variant="outline">Cancel</Button>
          <Button>Confirm</Button>
        </div>
      </div>
    ),
  },
}

export const Small: Story = {
  render: ModalTemplate,
  args: {
    title: 'Small Modal',
    size: 'sm',
    children: (
      <div className="space-y-4">
        <p>This is a small modal.</p>
        <Button className="w-full">Action</Button>
      </div>
    ),
  },
}

export const Large: Story = {
  render: ModalTemplate,
  args: {
    title: 'Large Modal',
    size: 'lg',
    children: (
      <div className="space-y-4">
        <p>This is a large modal with more content space.</p>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Name</label>
            <input className="w-full p-2 border rounded" />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Email</label>
            <input className="w-full p-2 border rounded" />
          </div>
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="outline">Cancel</Button>
          <Button>Save</Button>
        </div>
      </div>
    ),
  },
}

export const NoCloseButton: Story = {
  render: ModalTemplate,
  args: {
    title: 'No Close Button',
    showCloseButton: false,
    children: (
      <div className="space-y-4">
        <p>This modal has no close button. You must use the action buttons.</p>
        <div className="flex justify-end gap-2">
          <Button variant="outline">Cancel</Button>
          <Button>Confirm</Button>
        </div>
      </div>
    ),
  },
}

export const NoOverlayClose: Story = {
  render: ModalTemplate,
  args: {
    title: 'No Overlay Close',
    closeOnOverlayClick: false,
    children: (
      <div className="space-y-4">
        <p>This modal cannot be closed by clicking the overlay.</p>
        <Button className="w-full">Close Modal</Button>
      </div>
    ),
  },
}

// Confirmation Modal Stories
const ConfirmationTemplate = (args: any) => {
  const [isOpen, setIsOpen] = useState(false)
  
  return (
    <>
      <Button onClick={() => setIsOpen(true)} variant="destructive">
        Delete Item
      </Button>
      <ConfirmationModal
        {...args}
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        onConfirm={() => {
          alert('Confirmed!')
          setIsOpen(false)
        }}
      />
    </>
  )
}

export const ConfirmationDefault: Story = {
  render: ConfirmationTemplate,
  args: {},
  name: 'Confirmation Modal',
}

export const ConfirmationDestructive: Story = {
  render: ConfirmationTemplate,
  args: {
    title: 'Delete Item',
    description: 'Are you sure you want to delete this item? This action cannot be undone.',
    confirmText: 'Delete',
    cancelText: 'Cancel',
    variant: 'destructive',
  },
  name: 'Destructive Confirmation',
}

// Image Modal Stories
const ImageModalTemplate = (args: any) => {
  const [isOpen, setIsOpen] = useState(false)
  
  return (
    <>
      <Button onClick={() => setIsOpen(true)}>View Image</Button>
      <ImageModal
        {...args}
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
      />
    </>
  )
}

export const ImageModalStory: Story = {
  render: ImageModalTemplate,
  args: {
    src: '/placeholder.jpg',
    alt: 'Sample image',
    title: 'Beautiful Property',
  },
  name: 'Image Modal',
}

// Contact Modal Stories
const ContactModalTemplate = (args: any) => {
  const [isOpen, setIsOpen] = useState(false)
  
  return (
    <>
      <Button onClick={() => setIsOpen(true)}>Contact Us</Button>
      <ContactModal
        {...args}
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
      />
    </>
  )
}

export const ContactModalStory: Story = {
  render: ContactModalTemplate,
  args: {},
  name: 'Contact Modal',
}

export const PropertyInquiry: Story = {
  render: ContactModalTemplate,
  args: {
    propertyTitle: 'Beautiful Apartment in Algiers',
  },
  name: 'Property Inquiry Modal',
}

export const FormModal: Story = {
  render: ModalTemplate,
  args: {
    title: 'Contact Form',
    size: 'lg',
    children: (
      <form className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">First Name</label>
            <input className="w-full p-2 border rounded" placeholder="John" />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Last Name</label>
            <input className="w-full p-2 border rounded" placeholder="Doe" />
          </div>
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Email</label>
          <input className="w-full p-2 border rounded" placeholder="john@example.com" />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Message</label>
          <textarea className="w-full p-2 border rounded h-24" placeholder="Your message..." />
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="outline" type="button">Cancel</Button>
          <Button type="submit">Send Message</Button>
        </div>
      </form>
    ),
  },
  name: 'Form Modal',
}