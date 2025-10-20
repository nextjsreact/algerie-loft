import type { Meta, StoryObj } from '@storybook/react'
import { LanguageSelector } from '@/components/ui/language-selector'

const meta: Meta<typeof LanguageSelector> = {
  title: 'UI/LanguageSelector',
  component: LanguageSelector,
  parameters: {
    layout: 'centered',
    backgrounds: {
      default: 'dark',
      values: [
        { name: 'dark', value: '#1f2937' },
        { name: 'light', value: '#ffffff' },
      ],
    },
  },
  tags: ['autodocs'],
  argTypes: {
    showText: {
      control: { type: 'boolean' },
    },
  },
}

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    showText: false,
  },
}

export const WithText: Story = {
  args: {
    showText: true,
  },
}

export const IconOnly: Story = {
  args: {
    showText: false,
  },
  parameters: {
    docs: {
      description: {
        story: 'Language selector showing only the flag icon, suitable for compact layouts.',
      },
    },
  },
}

export const InHeader: Story = {
  render: () => (
    <div className="bg-gray-800 p-4 rounded-lg">
      <div className="flex items-center justify-between">
        <div className="text-white font-bold">Logo</div>
        <nav className="flex items-center space-x-4">
          <a href="#" className="text-white hover:text-gray-300">Home</a>
          <a href="#" className="text-white hover:text-gray-300">About</a>
          <a href="#" className="text-white hover:text-gray-300">Contact</a>
          <LanguageSelector showText={false} />
        </nav>
      </div>
    </div>
  ),
  name: 'In Header Navigation',
}

export const InSidebar: Story = {
  render: () => (
    <div className="bg-gray-800 p-4 rounded-lg w-64">
      <div className="space-y-4">
        <div className="text-white font-bold text-lg">Menu</div>
        <nav className="space-y-2">
          <a href="#" className="block text-white hover:text-gray-300 py-2">Dashboard</a>
          <a href="#" className="block text-white hover:text-gray-300 py-2">Properties</a>
          <a href="#" className="block text-white hover:text-gray-300 py-2">Services</a>
          <a href="#" className="block text-white hover:text-gray-300 py-2">Contact</a>
        </nav>
        <div className="border-t border-gray-600 pt-4">
          <div className="flex items-center justify-between">
            <span className="text-white text-sm">Language</span>
            <LanguageSelector showText={true} />
          </div>
        </div>
      </div>
    </div>
  ),
  name: 'In Sidebar',
}

export const OnLightBackground: Story = {
  args: {
    showText: true,
  },
  parameters: {
    backgrounds: {
      default: 'light',
    },
  },
  decorators: [
    (Story) => (
      <div className="bg-white p-4 rounded-lg border">
        <div className="flex items-center justify-between">
          <span className="text-gray-800">Select Language:</span>
          <Story />
        </div>
      </div>
    ),
  ],
  name: 'On Light Background',
}

export const InFooter: Story = {
  render: () => (
    <div className="bg-gray-900 p-6 rounded-lg">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div>
          <h3 className="text-white font-bold mb-3">Company</h3>
          <ul className="space-y-2">
            <li><a href="#" className="text-gray-300 hover:text-white">About Us</a></li>
            <li><a href="#" className="text-gray-300 hover:text-white">Services</a></li>
            <li><a href="#" className="text-gray-300 hover:text-white">Contact</a></li>
          </ul>
        </div>
        <div>
          <h3 className="text-white font-bold mb-3">Support</h3>
          <ul className="space-y-2">
            <li><a href="#" className="text-gray-300 hover:text-white">Help Center</a></li>
            <li><a href="#" className="text-gray-300 hover:text-white">FAQ</a></li>
            <li><a href="#" className="text-gray-300 hover:text-white">Privacy</a></li>
          </ul>
        </div>
        <div>
          <h3 className="text-white font-bold mb-3">Language</h3>
          <LanguageSelector showText={true} />
        </div>
      </div>
    </div>
  ),
  name: 'In Footer',
}

export const Responsive: Story = {
  render: () => (
    <div className="space-y-4">
      <div className="bg-gray-800 p-4 rounded-lg">
        <div className="flex items-center justify-between">
          <span className="text-white">Desktop (with text):</span>
          <LanguageSelector showText={true} />
        </div>
      </div>
      <div className="bg-gray-800 p-4 rounded-lg">
        <div className="flex items-center justify-between">
          <span className="text-white">Mobile (icon only):</span>
          <LanguageSelector showText={false} />
        </div>
      </div>
    </div>
  ),
  name: 'Responsive Usage',
}