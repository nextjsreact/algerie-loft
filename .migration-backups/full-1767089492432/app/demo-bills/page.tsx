import { BillAlertsNew } from '@/components/dashboard/bill-alerts-new'

export default function DemoBillsPage() {
  return (
    <div className="container mx-auto p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">🎨 Nouveau Design - Bill Alerts</h1>
        <p className="text-gray-600">
          Voici le nouveau design avec tes vraies données. Compare avec l'ancien dashboard pour valider.
        </p>
      </div>
      
      <BillAlertsNew />
      
      <div className="mt-8 p-4 bg-blue-50 rounded-lg border border-blue-200">
        <h3 className="font-semibold text-blue-900 mb-2">✨ Nouvelles fonctionnalités :</h3>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• Design moderne avec cartes séparées pour "À venir" et "En retard"</li>
          <li>• Badges colorés par type d'utilité (eau=bleu, énergie=jaune, etc.)</li>
          <li>• Icônes dynamiques selon l'urgence</li>
          <li>• Tri automatique par urgence</li>
          <li>• Support de tous les types d'utilités (eau, énergie, téléphone, internet, TV, gaz)</li>
          <li>• Intégration avec ton système de paiement existant</li>
        </ul>
      </div>
    </div>
  )
}