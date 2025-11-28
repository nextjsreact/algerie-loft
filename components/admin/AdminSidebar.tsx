'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  AlertTriangle,
  Users,
  Settings,
  Shield,
  Database,
  BarChart3,
  FileText,
  Home,
  Menu,
  X
} from 'lucide-react'
import { useState } from 'react'

interface AdminSidebarProps {
  locale: string
}

export default function AdminSidebar({ locale }: AdminSidebarProps) {
  const pathname = usePathname()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  const menuItems = [
    {
      title: 'Dashboard Admin',
      href: `/${locale}/admin`,
      icon: Home,
    },
    {
      title: 'Annonces Urgentes',
      href: `/${locale}/admin/announcements`,
      icon: AlertTriangle,
    },
    {
      title: 'Employés',
      href: `/${locale}/admin/employees`,
      icon: Users,
    },
    {
      title: 'Paramètres',
      href: `/${locale}/platform/settings`,
      icon: Settings,
    },
    {
      title: 'Sécurité',
      href: `/${locale}/admin/security`,
      icon: Shield,
    },
    {
      title: 'Base de Données',
      href: `/${locale}/admin/database`,
      icon: Database,
    },
    {
      title: 'Rapports',
      href: `/${locale}/admin/reports`,
      icon: BarChart3,
    },
    {
      title: 'Logs',
      href: `/${locale}/admin/logs`,
      icon: FileText,
    },
  ]

  const isActive = (href: string) => {
    return pathname === href
  }

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-white dark:bg-gray-800 rounded-lg shadow-lg"
      >
        {isMobileMenuOpen ? (
          <X className="w-6 h-6" />
        ) : (
          <Menu className="w-6 h-6" />
        )}
      </button>

      {/* Overlay for mobile */}
      {isMobileMenuOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-30"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed top-0 left-0 z-40 h-screen w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700
          transition-transform duration-300 ease-in-out
          ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
          lg:translate-x-0
        `}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              Administration
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Panneau de contrôle
            </p>
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto p-4">
            <ul className="space-y-2">
              {menuItems.map((item) => {
                const Icon = item.icon
                const active = isActive(item.href)

                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className={`
                        flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors
                        ${
                          active
                            ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                            : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                        }
                      `}
                    >
                      <Icon className="w-5 h-5 flex-shrink-0" />
                      <span className="font-medium">{item.title}</span>
                    </Link>
                  </li>
                )
              })}
            </ul>
          </nav>

          {/* Footer */}
          <div className="p-4 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
              <Shield className="w-4 h-4" />
              <span>Accès Administrateur</span>
            </div>
          </div>
        </div>
      </aside>
    </>
  )
}
