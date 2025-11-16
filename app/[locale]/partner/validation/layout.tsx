import { PartnerSidebar } from '@/components/partner/partner-sidebar'
import { SidebarProvider, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar'
import { Separator } from '@/components/ui/separator'

export default async function ValidationLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}) {
  // Unwrap params Promise for Next.js 15
  const { locale } = await params
  
  // Get session - middleware already handled auth
  const { getSession } = await import('@/lib/auth')
  const session = await getSession()
  
  // If no session, middleware will redirect - just show loading
  if (!session) {
    return <div>Loading...</div>
  }

  // Prepare user profile data
  const userProfile = {
    name: session.user.full_name || session.user.email?.split('@')[0] || 'Partner',
    email: session.user.email || '',
  }

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <PartnerSidebar locale={locale} userProfile={userProfile} />
        <SidebarInset className="peer-data-[state=expanded]:md:ml-[-16rem]">
          {/* Mobile header with trigger button */}
          <header className="sticky top-0 z-10 flex h-14 shrink-0 items-center gap-2 border-b bg-background px-4 md:hidden">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="h-6" />
            <span className="text-sm font-semibold">Validation Partenaires</span>
          </header>
          
          {/* Main content area with proper responsive padding */}
          <main className="flex-1 overflow-y-auto">
            {children}
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  )
}
