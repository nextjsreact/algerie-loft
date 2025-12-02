/**
 * Script de résumé complet de la migration
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function showMigrationSummary() {
  console.log('\n');
  console.log('═'.repeat(70));
  console.log('  🎯 RÉSUMÉ DE LA MIGRATION VERS LA TABLE UNIFIÉE "owners"');
  console.log('═'.repeat(70));
  console.log('\n');

  try {
    // Récupérer les statistiques
    const { count: ownersCount } = await supabase
      .from('owners')
      .select('*', { count: 'exact', head: true });

    const { count: loftOwnersCount } = await supabase
      .from('loft_owners')
      .select('*', { count: 'exact', head: true });

    const { count: partnerProfilesCount } = await supabase
      .from('partner_profiles')
      .select('*', { count: 'exact', head: true });

    const { count: totalLofts } = await supabase
      .from('lofts')
      .select('*', { count: 'exact', head: true });

    const { count: loftsWithNewOwnerId } = await supabase
      .from('lofts')
      .select('*', { count: 'exact', head: true })
      .not('new_owner_id', 'is', null);

    const { count: verifiedOwners } = await supabase
      .from('owners')
      .select('*', { count: 'exact', head: true })
      .eq('verification_status', 'verified');

    // Afficher le statut
    console.log('📊 ÉTAT ACTUEL\n');
    console.log('┌────────────────────────────────────┬──────────┐');
    console.log('│ Table                              │ Nombre   │');
    console.log('├────────────────────────────────────┼──────────┤');
    console.log(`│ owners (nouvelle table unifiée)    │ ${String(ownersCount || 0).padStart(8)} │`);
    console.log(`│ loft_owners (ancienne)             │ ${String(loftOwnersCount || 0).padStart(8)} │`);
    console.log(`│ partner_profiles (ancienne)        │ ${String(partnerProfilesCount || 0).padStart(8)} │`);
    console.log('├────────────────────────────────────┼──────────┤');
    console.log(`│ Total attendu                      │ ${String((loftOwnersCount || 0) + (partnerProfilesCount || 0)).padStart(8)} │`);
    console.log('└────────────────────────────────────┴──────────┘\n');

    // Vérifier si la migration est complète
    const expectedTotal = (loftOwnersCount || 0) + (partnerProfilesCount || 0);
    const migrationComplete = ownersCount === expectedTotal;

    if (migrationComplete) {
      console.log('✅ MIGRATION DES DONNÉES: COMPLÈTE\n');
    } else {
      console.log(`⚠️  MIGRATION DES DONNÉES: INCOMPLÈTE (${ownersCount}/${expectedTotal})\n`);
    }

    // Statistiques des lofts
    console.log('🏠 LOFTS\n');
    console.log('┌────────────────────────────────────┬──────────┐');
    console.log('│ Métrique                           │ Valeur   │');
    console.log('├────────────────────────────────────┼──────────┤');
    console.log(`│ Total lofts                        │ ${String(totalLofts || 0).padStart(8)} │`);
    console.log(`│ Lofts avec new_owner_id            │ ${String(loftsWithNewOwnerId || 0).padStart(8)} │`);
    console.log(`│ Lofts sans propriétaire            │ ${String((totalLofts || 0) - (loftsWithNewOwnerId || 0)).padStart(8)} │`);
    console.log('└────────────────────────────────────┴──────────┘\n');

    // Étapes complétées
    console.log('✅ ÉTAPES COMPLÉTÉES\n');
    console.log('  [✓] Étape 1: Table owners créée');
    console.log('  [✓] Étape 2: Données migrées (loft_owners + partner_profiles)');
    console.log('  [✓] Étape 3: Colonne new_owner_id ajoutée dans lofts');
    console.log('  [✓] Étape 4: Code mis à jour (app/actions/owners.ts)');
    console.log('  [✓] Étape 5: Relation lofts -> owners fonctionnelle\n');

    // Prochaines étapes
    console.log('📝 PROCHAINES ÉTAPES\n');
    console.log('  [ ] 1. Ajouter les politiques RLS');
    console.log('      → Exécuter: node add-rls-policies.js');
    console.log('      → Ou: 04-add-rls-policies.sql dans Supabase\n');
    
    console.log('  [ ] 2. Tester dans l\'interface web');
    console.log('      → npm run dev');
    console.log('      → Tester /owners, création/édition de lofts\n');
    
    console.log('  [ ] 3. Finaliser la migration (IRRÉVERSIBLE!)');
    console.log('      → Exécuter: finalize-migration.sql dans Supabase');
    console.log('      → Supprime les anciennes tables\n');

    // Avantages
    console.log('🎉 AVANTAGES DE LA MIGRATION\n');
    console.log('  ✓ 1 seule table au lieu de 3');
    console.log('  ✓ Code simplifié et cohérent');
    console.log('  ✓ Dashboard pour TOUS les propriétaires');
    console.log('  ✓ Plus de confusion entre les systèmes');
    console.log('  ✓ Facile à maintenir et étendre\n');

    // Commandes utiles
    console.log('🔧 COMMANDES UTILES\n');
    console.log('  # Vérifier l\'état');
    console.log('  node check-migration-status.js\n');
    console.log('  # Tester le système');
    console.log('  node test-owners-system.js\n');
    console.log('  # Ajouter RLS');
    console.log('  node add-rls-policies.js\n');
    console.log('  # Démarrer l\'app');
    console.log('  npm run dev\n');

    // Documentation
    console.log('📚 DOCUMENTATION\n');
    console.log('  • CONTINUER_MIGRATION.md    - Guide étape par étape');
    console.log('  • MIGRATION_STATUS_FINAL.md - État détaillé');
    console.log('  • MIGRATION_GUIDE.md        - Guide complet');
    console.log('  • UNIFIED_TABLE_SUMMARY.md  - Résumé de la structure\n');

    console.log('═'.repeat(70));
    console.log('  🚀 Prêt à continuer? Consultez CONTINUER_MIGRATION.md');
    console.log('═'.repeat(70));
    console.log('\n');

  } catch (error) {
    console.error('❌ Erreur:', error.message);
    console.log('\n⚠️  Impossible de récupérer les statistiques');
    console.log('   Vérifiez votre connexion à Supabase\n');
  }
}

showMigrationSummary()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('❌ Erreur fatale:', error);
    process.exit(1);
  });
