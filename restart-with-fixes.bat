@echo off
echo 🔧 Redémarrage avec les corrections API...
echo.

echo 📋 Corrections appliquées :
echo - ✅ Sécurité : getUser() au lieu de getSession()
echo - ✅ Performance : Timeouts réduits (1.5-2s)  
echo - ✅ Cache : Mise en cache des résultats
echo - ✅ Erreurs : Gestion gracieuse des timeouts
echo - ✅ ECONNRESET : Timeouts plus courts
echo.

echo 🧹 Nettoyage du cache...
if exist .next rmdir /s /q .next
if exist node_modules\.cache rmdir /s /q node_modules\.cache

echo.
echo 🚀 Démarrage du serveur...
echo.
echo 📊 Surveillez les logs pour confirmer :
echo - Plus d'avertissements "Using the user object as returned from supabase.auth.getSession()"
echo - Temps de réponse API : 9-10s → ^<2s
echo - Plus d'erreurs ECONNRESET sur notifications/conversations
echo - Plus d'erreurs 401 récurrentes
echo.

npm run dev