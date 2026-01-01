@echo off
echo ========================================
echo    CONFIGURATION DOMAINE LOFTALGERIE.COM
echo ========================================
echo.

echo [1/3] Configuration du domaine sur Vercel...
echo.
echo IMPORTANT: Vous devez faire ceci manuellement :
echo 1. Allez sur https://vercel.com/dashboard
echo 2. Selectionnez votre projet 'algerie-loft'
echo 3. Settings ^> Domains
echo 4. Ajoutez: loftalgerie.com
echo 5. Ajoutez: www.loftalgerie.com
echo.
pause

echo [2/3] Configuration DNS...
echo.
echo IMPORTANT: Configurez ces enregistrements DNS :
echo.
echo Type: CNAME
echo Name: @
echo Value: cname.vercel-dns.com
echo.
echo Type: CNAME  
echo Name: www
echo Value: cname.vercel-dns.com
echo.
pause

echo [3/3] Configuration OAuth Supabase...
echo.
echo IMPORTANT: Allez sur Supabase Dashboard :
echo 1. https://supabase.com/dashboard
echo 2. Projet: mhngbluefyucoesgcjoy
echo 3. Authentication ^> URL Configuration
echo 4. Site URL: https://loftalgerie.com
echo 5. Redirect URLs: https://loftalgerie.com/auth/callback
echo.
pause

echo [4/4] Redeploiement...
vercel --prod

echo.
echo ========================================
echo    CONFIGURATION TERMINEE!
echo ========================================
echo.
echo Votre site sera accessible sur:
echo https://loftalgerie.com
echo.
echo Note: La propagation DNS peut prendre 24-48h
echo.
pause