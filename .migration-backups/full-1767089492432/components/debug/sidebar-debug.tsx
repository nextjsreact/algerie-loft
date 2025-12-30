"use client"

import { useSidebarVisibility } from "@/hooks/use-sidebar-visibility"

interface SidebarDebugProps {
  userRole?: string
  hideSidebar?: boolean
}

export function SidebarDebug({ userRole, hideSidebar }: SidebarDebugProps) {
  const { shouldHideSidebar, isAuthPage, isPublicPage, isClientPage, pathname } = useSidebarVisibility({
    userRole,
    hideSidebar
  })

  // Only show in development
  if (process.env.NODE_ENV !== 'development') {
    return null
  }

  return (
    <div className="fixed bottom-4 right-4 bg-black/80 text-white p-3 rounded-lg text-xs font-mono z-50 max-w-xs">
      <div className="font-bold mb-2">Sidebar Debug</div>
      <div>Path: {pathname}</div>
      <div>Role: {userRole || 'none'}</div>
      <div>Hide Sidebar: {shouldHideSidebar ? '✅' : '❌'}</div>
      <div>Auth Page: {isAuthPage ? '✅' : '❌'}</div>
      <div>Public Page: {isPublicPage ? '✅' : '❌'}</div>
      <div>Client Page: {isClientPage ? '✅' : '❌'}</div>
      <div>Force Hidden: {hideSidebar ? '✅' : '❌'}</div>
    </div>
  )
}