import { FinancialReports } from "../../../components/admin/FinancialReports";
import { Button } from "../../../components/ui/button";

// Données de test pour les rapports financiers
const financialData = [
  {
    period: "Décembre 2024",
    revenue: 2850000, // 2,850,000 DZD
    expenses: 1420000, // 1,420,000 DZD
    profit: 1430000,   // 1,430,000 DZD
    bookings: 142,
    averageBookingValue: 20070, // 20,070 DZD
    occupancyRate: 78
  },
  {
    period: "Novembre 2024",
    revenue: 2480000, // 2,480,000 DZD
    expenses: 1350000, // 1,350,000 DZD
    profit: 1130000,   // 1,130,000 DZD
    bookings: 124,
    averageBookingValue: 20000, // 20,000 DZD
    occupancyRate: 72
  }
];

export default function ReportsPage() {
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
            <a href="/business">💼 Business</a>
          </Button>
          <Button asChild>
            <a href="/admin/reports">📊 Rapports (Actuel)</a>
          </Button>
        </div>

        {/* Composant de rapports financiers */}
        <FinancialReports data={financialData} />
      </div>
    </div>
  );
}