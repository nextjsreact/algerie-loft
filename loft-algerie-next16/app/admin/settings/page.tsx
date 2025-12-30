import { SystemSettings } from "../../../components/admin/SystemSettings";
import { Button } from "../../../components/ui/button";

// Données de test pour les paramètres système
const systemSettings = {
  siteName: "Loft Algérie",
  siteUrl: "https://loft-algerie.com",
  contactEmail: "contact@loftalgerie.com",
  contactPhone: "+213 56 03 62 543",
  currency: "DZD",
  language: "fr",
  timezone: "Africa/Algiers",
  maintenanceMode: false,
  emailNotifications: true,
  smsNotifications: false,
  theme: "light"
};

export default function SettingsPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Navigation rapide */}
        <div className="mb-8 flex flex-wrap gap-3">
          <Button asChild variant="outline">
            <a href="/admin">← Dashboard Admin</a>
          </Button>
          <Button asChild variant="outline">
            <a href="/admin/users">👥 Utilisateurs</a>
          </Button>
          <Button asChild variant="outline">
            <a href="/admin/reports">📊 Rapports</a>
          </Button>
          <Button asChild>
            <a href="/admin/settings">⚙️ Paramètres (Actuel)</a>
          </Button>
        </div>

        {/* Composant de paramètres système */}
        <SystemSettings settings={systemSettings} />
      </div>
    </div>
  );
}