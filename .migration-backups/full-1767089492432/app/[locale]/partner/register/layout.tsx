import { DesktopHeader } from '@/components/layout/desktop-header'
import { MobileHeader } from '@/components/layout/mobile-header'
import { getSession } from '@/lib/auth'

export default async function RegisterLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}) {
  // Unwrap params Promise for Next.js 15
  const { locale } = await params
  
  // Get session for header
  const session = await getSession()
  
  return (
    <div className="min-h-screen flex flex-col">
      {/* Desktop header */}
      <div className="hidden md:block fixed top-0 right-0 left-0 z-20">
        <DesktopHeader />
      </div>
      
      {/* Mobile header */}
      {session && (
        <MobileHeader 
          user={session.user} 
          showLogo={true} 
        />
      )}
      
      <div className="flex-1 md:pt-16">
        {children}
      </div>
    </div>
  )
}
