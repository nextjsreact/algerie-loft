export default function AnnouncementsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Le layout parent admin gère déjà l'authentification et la sidebar
  return <>{children}</>
}
