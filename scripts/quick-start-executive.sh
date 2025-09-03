#!/bin/bash

# 🚀 Script de démarrage rapide - Tableau de Bord Exécutif
# Ce script automatise le déploiement complet du système executive

echo "🎯 Démarrage du déploiement du Tableau de Bord Exécutif..."
echo "=================================================="

# Vérifier les variables d'environnement
if [ -z "$NEXT_PUBLIC_SUPABASE_URL" ] || [ -z "$SUPABASE_SERVICE_ROLE_KEY" ]; then
    echo "❌ Variables d'environnement Supabase manquantes"
    echo "Assurez-vous que NEXT_PUBLIC_SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY sont définies"
    exit 1
fi

echo "✅ Variables d'environnement vérifiées"

# Étape 1: Afficher le script SQL à exécuter
echo ""
echo "📋 ÉTAPE 1: Configuration de la base de données"
echo "=============================================="
echo "Copiez et exécutez le contenu suivant dans votre Supabase SQL Editor:"
echo ""
echo "--- DÉBUT DU SCRIPT SQL ---"
cat scripts/add-executive-role.sql
echo "--- FIN DU SCRIPT SQL ---"
echo ""

read -p "Appuyez sur Entrée après avoir exécuté le script SQL dans Supabase..."

# Étape 2: Test automatisé
echo ""
echo "🧪 ÉTAPE 2: Test automatisé du déploiement"
echo "=========================================="

if command -v node &> /dev/null; then
    echo "Exécution du test automatisé..."
    node scripts/test-executive-dashboard.js
else
    echo "⚠️ Node.js non trouvé, test automatisé ignoré"
fi

# Étape 3: Instructions finales
echo ""
echo "🎉 ÉTAPE 3: Déploiement terminé !"
echo "================================"
echo ""
echo "📋 Prochaines étapes :"
echo "1. Démarrez votre serveur de développement : npm run dev"
echo "2. Connectez-vous avec le compte executive :"
echo "   📧 Email: executive@loftmanager.com"
echo "   🔑 Mot de passe: executive123"
echo "3. Accédez au tableau de bord : http://localhost:3000/executive"
echo ""
echo "🔧 Configuration optionnelle :"
echo "- Configurez les alertes automatiques (voir EXECUTIVE_DASHBOARD_SETUP.md)"
echo "- Personnalisez les seuils d'alerte selon vos besoins"
echo "- Changez les mots de passe par défaut"
echo ""
echo "📚 Documentation complète : EXECUTIVE_DASHBOARD_SETUP.md"
echo ""
echo "🎯 Votre tableau de bord exécutif est prêt à l'emploi !"
echo "=================================================="