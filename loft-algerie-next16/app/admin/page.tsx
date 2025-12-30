import { AdminDashboard } from "../../components/admin/AdminDashboard";
import { Button } from "../../components/ui/button";

// Données de test pour le dashboard admin
const adminStats = {
  totalLofts: 25,
  availableLofts: 18,
  occupiedLofts: 5,
  maintenanceLofts: 2,
  totalBookings: 142,
  monthlyRevenue: 2850000, // 2,850,000 DZD
  totalUsers: 89,
  pendingRequests: 7
};

export default function AdminPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Navigation rapide */}
        <div className="mb-8 flex flex-wrap gap-3">
          <Button asChild variant="outline">
            <a href="/">🏠 Accueil</a>
          </Button>
          <Button asChild variant="outline">
            <a href="/business">💼 Business</a>
          </Button>
          <Button asChild variant="outline">
            <a href="/public">🌐 Public</a>
          </Button>
          <Button asChild>
            <a href="/admin">👑 Admin (Actuel)</a>
          </Button>
        </div>

        {/* Dashboard principal */}
        <AdminDashboard stats={adminStats} />
      </div>
    </div>
  );
}