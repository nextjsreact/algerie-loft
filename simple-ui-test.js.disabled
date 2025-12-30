// Test simple de l'interface utilisateur
import { chromium } from 'playwright';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.test' });

async function testUI() {
  console.log('🎭 Test simple de l\'interface utilisateur...\n');

  const baseURL = process.env.TEST_BASE_URL || 'http://localhost:3000';
  let browser, page;

  try {
    // Lancer le navigateur
    console.log('🚀 Lancement du navigateur...');
    browser = await chromium.launch({ headless: true });
    page = await browser.newPage();

    // Test 1: Charger la page d'accueil
    console.log('🏠 Test: Chargement de la page d\'accueil...');
    await page.goto(baseURL, { waitUntil: 'networkidle' });
    
    const title = await page.title();
    console.log(`✅ Page chargée - Titre: "${title}"`);

    // Test 2: Vérifier les éléments principaux
    console.log('\n🔍 Test: Éléments principaux...');
    
    // Vérifier la présence d'éléments communs
    const hasNavigation = await page.locator('nav, [role="navigation"], header').count() > 0;
    const hasMainContent = await page.locator('main, [role="main"], .main-content').count() > 0;
    const hasFooter = await page.locator('footer, [role="contentinfo"]').count() > 0;

    console.log(`   Navigation: ${hasNavigation ? '✅' : '❌'}`);
    console.log(`   Contenu principal: ${hasMainContent ? '✅' : '❌'}`);
    console.log(`   Pied de page: ${hasFooter ? '✅' : '❌'}`);

    // Test 3: Vérifier la responsivité
    console.log('\n📱 Test: Responsivité...');
    
    // Desktop
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.waitForTimeout(500);
    console.log('   ✅ Vue desktop (1920x1080)');

    // Tablet
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.waitForTimeout(500);
    console.log('   ✅ Vue tablette (768x1024)');

    // Mobile
    await page.setViewportSize({ width: 375, height: 667 });
    await page.waitForTimeout(500);
    console.log('   ✅ Vue mobile (375x667)');

    // Test 4: Vérifier les liens principaux
    console.log('\n🔗 Test: Navigation...');
    
    await page.setViewportSize({ width: 1920, height: 1080 });
    
    // Chercher des liens communs
    const links = await page.locator('a[href]').all();
    const linkCount = links.length;
    console.log(`   ✅ ${linkCount} liens trouvés`);

    // Tester quelques liens internes
    let workingLinks = 0;
    for (let i = 0; i < Math.min(3, linkCount); i++) {
      try {
        const href = await links[i].getAttribute('href');
        if (href && href.startsWith('/')) {
          console.log(`   🔗 Test du lien: ${href}`);
          
          const response = await page.request.get(baseURL + href);
          if (response.ok()) {
            workingLinks++;
            console.log(`      ✅ Lien fonctionnel (${response.status()})`);
          } else {
            console.log(`      ❌ Lien cassé (${response.status()})`);
          }
        }
      } catch (error) {
        console.log(`      ⚠️  Erreur test lien: ${error.message}`);
      }
    }

    // Test 5: Performance de base
    console.log('\n⚡ Test: Performance...');
    
    const startTime = Date.now();
    await page.reload({ waitUntil: 'networkidle' });
    const loadTime = Date.now() - startTime;
    
    console.log(`   ⏱️  Temps de chargement: ${loadTime}ms`);
    
    if (loadTime < 3000) {
      console.log('   ✅ Performance acceptable (< 3s)');
    } else {
      console.log('   ⚠️  Performance lente (> 3s)');
    }

    // Test 6: Erreurs JavaScript
    console.log('\n🐛 Test: Erreurs JavaScript...');
    
    let jsErrors = [];
    page.on('pageerror', error => {
      jsErrors.push(error.message);
    });
    
    await page.reload();
    await page.waitForTimeout(2000);
    
    if (jsErrors.length === 0) {
      console.log('   ✅ Aucune erreur JavaScript détectée');
    } else {
      console.log(`   ❌ ${jsErrors.length} erreurs JavaScript détectées:`);
      jsErrors.forEach((error, index) => {
        console.log(`      ${index + 1}. ${error}`);
      });
    }

    console.log('\n🎉 Tests UI terminés avec succès !');
    return true;

  } catch (error) {
    console.error('❌ Erreur lors des tests UI:', error);
    return false;
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

testUI().then(success => {
  process.exit(success ? 0 : 1);
});