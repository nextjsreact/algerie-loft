/**
 * Utilitaires pour les placeholders standardisés dans toute l'application
 */

export const placeholders = {
  // Champs de base
  name: "Ex: Nom complet",
  email: "Ex: nom@exemple.com", 
  password: "••••••••",
  phone: "Ex: +213 555 123 456",
  address: "Ex: 123 Rue Didouche Mourad, Alger",
  
  // Champs de loft
  loftName: "Ex: Loft Moderne Centre-ville",
  loftAddress: "Ex: 123 Rue Didouche Mourad, Alger",
  loftDescription: "Ex: Appartement spacieux avec vue sur mer...",
  pricePerMonth: "Ex: 50000",
  pricePerNight: "Ex: 1500",
  
  // Champs financiers
  amount: "Ex: 25000",
  description: "Ex: Description de la transaction",
  
  // Champs de date
  date: "jj/mm/aaaa",
  
  // Champs utilitaires
  customerCode: "Ex: 123456789",
  contractCode: "Ex: CNT-2024-001", 
  meterNumber: "Ex: MTR-789456",
  pdlRef: "Ex: PDL-123456789012345",
  
  // Champs d'équipe
  teamName: "Ex: Équipe Maintenance",
  teamDescription: "Ex: Équipe responsable de la maintenance des lofts",
  
  // Champs de tâche
  taskTitle: "Ex: Réparer la climatisation",
  taskDescription: "Ex: Vérifier et réparer le système de climatisation du loft A1",
  
  // Champs de propriétaire
  ownerName: "Ex: Ahmed Benali",
  ownerEmail: "Ex: ahmed.benali@exemple.com",
  ownerPhone: "Ex: +213 555 123 456",
  
  // Champs de zone
  zoneName: "Ex: Alger Centre",
  
  // Champs de méthode de paiement
  paymentMethodName: "Ex: Carte Bancaire CIB",
  
  // Champs de connexion internet
  internetType: "Ex: Fibre Optique",
  internetSpeed: "Ex: 100 Mbps",
  internetProvider: "Ex: Algérie Télécom",
  
  // Sélecteurs
  selectOption: "Sélectionner une option",
  selectFrequency: "Sélectionner la fréquence",
  
  // Recherche
  search: "Rechercher...",
  searchByName: "Rechercher par nom...",
  searchByEmail: "Rechercher par email...",
} as const

/**
 * Fonction utilitaire pour obtenir un placeholder avec style uniforme
 */
export function getPlaceholder(key: keyof typeof placeholders): string {
  return placeholders[key]
}

/**
 * Props communes pour les inputs avec placeholders standardisés
 */
export const inputProps = {
  name: {
    placeholder: placeholders.name,
    className: "placeholder:text-gray-400 placeholder:opacity-100"
  },
  email: {
    placeholder: placeholders.email,
    className: "placeholder:text-gray-400 placeholder:opacity-100",
    type: "email" as const
  },
  password: {
    placeholder: placeholders.password,
    className: "placeholder:text-gray-400 placeholder:opacity-100",
    type: "password" as const
  },
  phone: {
    placeholder: placeholders.phone,
    className: "placeholder:text-gray-400 placeholder:opacity-100",
    type: "tel" as const
  },
  address: {
    placeholder: placeholders.address,
    className: "placeholder:text-gray-400 placeholder:opacity-100"
  },
  date: {
    placeholder: placeholders.date,
    className: "placeholder:text-gray-400 placeholder:opacity-100",
    type: "date" as const
  },
  amount: {
    placeholder: placeholders.amount,
    className: "placeholder:text-gray-400 placeholder:opacity-100",
    type: "number" as const
  }
} as const