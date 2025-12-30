import { UserManagement } from "../../../components/admin/UserManagement";
import { Button } from "../../../components/ui/button";

// Données de test pour les utilisateurs
const sampleUsers = [
  {
    id: "1",
    name: "Ahmed Benali",
    email: "ahmed.benali@email.com",
    phone: "+213 555 123 456",
    role: "client" as const,
    status: "active" as const,
    joinDate: "2024-01-15",
    lastLogin: "2024-12-27"
  },
  {
    id: "2",
    name: "Fatima Khelifi",
    email: "fatima.khelifi@email.com",
    phone: "+213 555 234 567",
    role: "partner" as const,
    status: "active" as const,
    joinDate: "2024-02-20",
    lastLogin: "2024-12-26"
  },
  {
    id: "3",
    name: "Mohamed Saidi",
    email: "mohamed.saidi@email.com",
    phone: "+213 555 345 678",
    role: "client" as const,
    status: "inactive" as const,
    joinDate: "2024-03-10",
    lastLogin: "2024-12-20"
  },
  {
    id: "4",
    name: "Amina Boudjema",
    email: "amina.boudjema@email.com",
    phone: "+213 555 456 789",
    role: "manager" as const,
    status: "active" as const,
    joinDate: "2024-01-05",
    lastLogin: "2024-12-28"
  },
  {
    id: "5",
    name: "Karim Meziane",
    email: "karim.meziane@email.com",
    phone: "+213 555 567 890",
    role: "admin" as const,
    status: "active" as const,
    joinDate: "2023-12-01",
    lastLogin: "2024-12-28"
  },
  {
    id: "6",
    name: "Leila Hamdi",
    email: "leila.hamdi@email.com",
    phone: "+213 555 678 901",
    role: "client" as const,
    status: "pending" as const,
    joinDate: "2024-12-25"
  },
  {
    id: "7",
    name: "Omar Benaissa",
    email: "omar.benaissa@email.com",
    phone: "+213 555 789 012",
    role: "partner" as const,
    status: "active" as const,
    joinDate: "2024-11-15",
    lastLogin: "2024-12-27"
  },
  {
    id: "8",
    name: "Nadia Cherif",
    email: "nadia.cherif@email.com",
    phone: "+213 555 890 123",
    role: "client" as const,
    status: "active" as const,
    joinDate: "2024-10-08",
    lastLogin: "2024-12-25"
  }
];

export default function UsersPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Navigation rapide */}
        <div className="mb-8 flex flex-wrap gap-3">
          <Button asChild variant="outline">
            <a href="/admin">← Dashboard Admin</a>
          </Button>
          <Button asChild variant="outline">
            <a href="/business">💼 Business</a>
          </Button>
          <Button asChild variant="outline">
            <a href="/public">🌐 Public</a>
          </Button>
          <Button asChild>
            <a href="/admin/users">👥 Utilisateurs (Actuel)</a>
          </Button>
        </div>

        {/* Composant de gestion des utilisateurs */}
        <UserManagement users={sampleUsers} />
      </div>
    </div>
  );
}