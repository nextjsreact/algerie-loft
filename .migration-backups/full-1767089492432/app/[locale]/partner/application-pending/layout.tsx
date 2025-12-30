export default async function ApplicationPendingLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}) {
  // Unwrap params Promise for Next.js 15
  const { locale } = await params
  
  return (
    <div className="min-h-screen">
      {children}
    </div>
  )
}
