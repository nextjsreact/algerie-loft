#!/usr/bin/env node

/**
 * Script pour créer des données de test pour les alertes de factures
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variables d\'environnement Supabase manquantes');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function createTestData() {
  console.log('🔧 Création de données de test pour les alertes de factures\n');

  try {
    // Récupérer quelques lofts existants
    const { data: lofts, error: loftsError } = await supabase
      .from('lofts')
      .select('id, name')
      .limit(5);

    if (loftsError) {
      console.error('❌ Erreur lors de la récupération des lofts:', loftsError.message);
      return;
    }

    if (!lofts || lofts.length === 0) {
      console.error('❌ Aucun loft trouvé dans la base de données');
      return;
    }

    console.log(`📍 ${lofts.length} lofts trouvés, création des données de test...\n`);

    const today = new Date();
    const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
    const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000);
    const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
    const nextMonth = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);

    // Scénarios de test
    const testScenarios = [
      {
        loft: lofts[0],
        scenario: 'Facture en retard',
        updates: {
          prochaine_echeance_eau: yesterday.toISOString().split('T')[0],
          frequence_paiement_eau: 'mensuel',
          prochaine_echeance_energie: yesterday.toISOString().split('T')[0],
          frequence_paiement_energie: 'mensuel'
        }
      },
      {
        loft: lofts[1] || lofts[0],
        scenario: 'Facture due demain',
        updates: {
          prochaine_echeance_eau: tomorrow.toISOString().split('T')[0],
          frequence_paiement_eau: 'mensuel',
          prochaine_echeance_telephone: tomorrow.toISOString().split('T')[0],
          frequence_paiement_telephone: 'mensuel'
        }
      },
      {
        loft: lofts[2] || lofts[0],
        scenario: 'Factures à venir',
        updates: {
          prochaine_echeance_energie: nextWeek.toISOString().split('T')[0],
          frequence_paiement_energie: 'mensuel',
          prochaine_echeance_internet: nextMonth.toISOString().split('T')[0],
          frequence_paiement_internet: 'mensuel'
        }
      }
    ];

    // Appliquer les scénarios
    for (const scenario of testScenarios) {
      console.log(`🔧 ${scenario.scenario} - Loft: ${scenario.loft.name}`);
      
      const { error: updateError } = await supabase
        .from('lofts')
        .update(scenario.updates)
        .eq('id', scenario.loft.id);

      if (updateError) {
        console.error(`❌ Erreur pour ${scenario.loft.name}:`, updateError.message);
      } else {
        console.log(`✅ ${scenario.loft.name} mis à jour avec succès`);
        
        // Afficher les détails
        Object.entries(scenario.updates).forEach(([key, value]) => {
          if (key.startsWith('prochaine_echeance_')) {
            const utility = key.replace('prochaine_echeance_', '');
            console.log(`   📅 ${utility}: ${value}`);
          }
        });
      }
      console.log('');
    }

    // Vérifier les résultats
    console.log('🔍 Vérification des données créées...\n');

    const { data: upcomingBills, error: upcomingError } = await supabase
      .rpc('get_upcoming_bills', { days_ahead: 30 });

    if (upcomingError) {
      console.error('❌ Erreur get_upcoming_bills:', upcomingError.message);
    } else {
      console.log(`✅ ${upcomingBills?.length || 0} factures à venir trouvées:`);
      upcomingBills?.forEach(bill => {
        console.log(`   📅 ${bill.loft_name} - ${bill.utility_type}: ${bill.due_date} (dans ${bill.days_until_due} jours)`);
      });
    }

    const { data: overdueBills, error: overdueError } = await supabase
      .rpc('get_overdue_bills');

    if (overdueError) {
      console.error('❌ Erreur get_overdue_bills:', overdueError.message);
    } else {
      console.log(`\n✅ ${overdueBills?.length || 0} factures en retard trouvées:`);
      overdueBills?.forEach(bill => {
        console.log(`   ⚠️ ${bill.loft_name} - ${bill.utility_type}: ${bill.due_date} (${bill.days_overdue} jours de retard)`);
      });
    }

    console.log('\n🎉 Données de test créées avec succès!');
    console.log('📊 Les alertes de factures devraient maintenant apparaître dans le dashboard manager/admin.');

  } catch (error) {
    console.error('❌ Erreur générale:', error.message);
  }
}

// Exécuter la création
createTestData().catch(console.error);