export default async function PartnerLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // This layout is minimal - child layouts (register, login, pending, etc.) 
  // or dashboard pages will handle their own layout structure
  return <>{children}</>
}