import { requireRole } from "@/lib/auth"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { 
  Users, 
  Key, 
  Settings, 
  Shield, 
  Database,
  BarChart3,
  FileText,
  AlertTriangle
} from "lucide-react"
import Link from "next/link"
import { useLocale } from "next-intl"

export default async function AdminPage() {
  const session = await requireRole(["admin"])

  const adminSections = [
    {
      title: "Annonces Urgentes",
      description: "Gérer les bannières de promotion sur la homepage",
      href: "/admin/announcements",
      icon: AlertTriangle,
      color: "bg-red-500"
    },
    {
      title: "Gestion des Employés",
      description: "Gérer les comptes et mots de passe des employés",
      href: "/admin/employees",
      icon: Users,
      color: "bg-blue-500"
    },
    {
      title: "Paramètres Système",
      description: "Configuration de la plateforme",
      href: "/platform/settings",
      icon: Settings,
      color: "bg-gray-500"
    },
    {
      title: "Sécurité",
      description: "Gestion de la sécurité et des accès",
      href: "/admin/security",
      icon: Shield,
      color: "bg-red-500"
    },
    {
      title: "Base de Données",
      description: "Maintenance et sauvegarde",
      href: "/admin/database",
      icon: Database,
      color: "bg-green-500"
    },
    {
      title: "Rapports Admin",
      description: "Rapports système et audit",
      href: "/admin/reports",
      icon: BarChart3,
      color: "bg-purple-500"
    },
    {
      title: "Logs Système",
      description: "Consulter les logs d'activité",
      href: "/admin/logs",
      icon: FileText,
      color: "bg-orange-500"
    }
  ]

  return (
    <div className="container mx-auto p-6">
      <div className="space-y-8">
        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-red-600 to-pink-600 bg-clip-text text-transparent">
            Administration Système
          </h1>
          <p className="text-lg text-muted-foreground">
            Bienvenue, {session.user.full_name || session.user.email}
          </p>
          <div className="inline-flex items-center gap-2 bg-gradient-to-r from-red-500 to-pink-500 text-white px-3 py-1 rounded-full text-sm font-medium">
            <Shield className="h-4 w-4" />
            Accès Administrateur
          </div>
        </div>

        {/* Alertes importantes */}
        <Card className="border-orange-200 bg-orange-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-5 w-5 text-orange-600" />
              <div>
                <h3 className="font-semibold text-orange-800">Accès Sensible</h3>
                <p className="text-sm text-orange-700">
                  Vous avez accès aux fonctions critiques du système. Utilisez ces outils avec précaution.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Sections Admin */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {adminSections.map((section, index) => (
            <Link key={index} href={`/fr${section.href}`}>
              <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer group">
                <CardContent className="p-6">
                  <div className={`w-12 h-12 ${section.color} rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                    <section.icon className="h-6 w-6 text-white" />
                  </div>
                  <h3 className="font-bold text-gray-900 mb-2">{section.title}</h3>
                  <p className="text-sm text-gray-600">{section.description}</p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>

        {/* Actions rapides */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Key className="h-5 w-5" />
              Actions Rapides
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Link href="/fr/admin/announcements">
                <Button className="w-full" variant="outline">
                  <AlertTriangle className="h-4 w-4 mr-2" />
                  Annonces Urgentes
                </Button>
              </Link>
              
              <Link href="/fr/admin/employees">
                <Button className="w-full" variant="outline">
                  <Users className="h-4 w-4 mr-2" />
                  Gérer les Employés
                </Button>
              </Link>
              
              <Button className="w-full" variant="outline">
                <Database className="h-4 w-4 mr-2" />
                Sauvegarde DB
              </Button>
              
              <Button className="w-full" variant="outline">
                <BarChart3 className="h-4 w-4 mr-2" />
                Rapport Système
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}