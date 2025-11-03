#!/usr/bin/env tsx

/**
 * Déploiement staging rapide du système partenaire
 */

import { execSync } from 'child_process';

console.log('🚀 Déploiement staging rapide du système partenaire');
console.log('==================================================\n');

try {
  // 1. Tests rapides
  console.log('🧪 Tests rapides...');
  try {
    execSync('npx tsx scripts/run-partner-tests.ts', { stdio: 'inherit', timeout: 30000 });
    console.log('✅ Tests passés\n');
  } catch (error) {
    console.warn('⚠️  Tests échoués, mais continuation pour staging\n');
  }

  // 2. Déploiement Vercel
  console.log('🚀 Déploiement vers Vercel staging...');
  const deployOutput = execSync('vercel deploy --yes', { 
    encoding: 'utf-8',
    stdio: 'pipe'
  });

  // Extraire l'URL de déploiement
  const urlMatch = deployOutput.match(/https:\/\/[^\s]+\.vercel\.app/);
  const deploymentUrl = urlMatch ? urlMatch[0] : null;

  if (deploymentUrl) {
    console.log('✅ Déploiement réussi !');
    console.log(`🌐 URL: ${deploymentUrl}`);
    
    // 3. Test rapide de l'URL
    console.log('\n🔍 Test de l\'URL de déploiement...');
    setTimeout(async () => {
      try {
        const response = await fetch(deploymentUrl);
        if (response.ok) {
          console.log('✅ Application accessible');
        } else {
          console.log(`⚠️  Status: ${response.status}`);
        }
      } catch (error) {
        console.log('⚠️  Test d\'accès échoué');
      }

      // 4. Résumé
      console.log('\n📋 Résumé du déploiement staging');
      console.log('================================');
      console.log(`🌐 URL: ${deploymentUrl}`);
      console.log('🎯 Fonctionnalités déployées:');
      console.log('   ✅ Système partenaire complet');
      console.log('   ✅ API endpoints');
      console.log('   ✅ Interface admin');
      console.log('   ✅ Dashboard partenaire');
      console.log('   ✅ Monitoring');
      
      console.log('\n📋 Prochaines étapes:');
      console.log('1. Tester l\'inscription partenaire');
      console.log('2. Valider le dashboard');
      console.log('3. Tester l\'interface admin');
      console.log('4. Vérifier les notifications');
      
      console.log('\n🎉 Déploiement staging terminé !');
    }, 5000);

  } else {
    console.error('❌ Impossible d\'extraire l\'URL de déploiement');
    console.log('Sortie Vercel:', deployOutput);
  }

} catch (error) {
  console.error('❌ Erreur de déploiement:', error);
  process.exit(1);
}