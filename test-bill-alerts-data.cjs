#!/usr/bin/env node

/**
 * Script de test pour vérifier les données des alertes de factures
 * Vérifie que les fonctions RPC et les données existent
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

async function testBillAlerts() {
  console.log('🔍 Test des Alertes de Factures - Dashboard Manager/Admin\n');

  try {
    // 1. Vérifier les lofts avec des dates d'échéance
    console.log('📋 1. Vérification des lofts avec dates d\'échéance...');
    const { data: lofts, error: loftsError } = await supabase
      .from('lofts')
      .select(`
        id, 
        name, 
        prochaine_echeance_eau,
        prochaine_echeance_energie,
        prochaine_echeance_telephone,
        prochaine_echeance_internet,
        frequence_paiement_eau,
        frequence_paiement_energie,
        frequence_paiement_telephone,
        frequence_paiement_internet
      `)
      .or('prochaine_echeance_eau.not.is.null,prochaine_echeance_energie.not.is.null,prochaine_echeance_telephone.not.is.null,prochaine_echeance_internet.not.is.null')
      .limit(5);

    if (loftsError) {
      console.error('❌ Erreur lors de la récupération des lofts:', loftsError.message);
    } else {
      console.log(`✅ ${lofts?.length || 0} lofts trouvés avec des dates d'échéance`);
      if (lofts && lofts.length > 0) {
        lofts.forEach(loft => {
          console.log(`   📍 ${loft.name}:`);
          if (loft.prochaine_echeance_eau) console.log(`      💧 Eau: ${loft.prochaine_echeance_eau} (${loft.frequence_paiement_eau})`);
          if (loft.prochaine_echeance_energie) console.log(`      ⚡ Énergie: ${loft.prochaine_echeance_energie} (${loft.frequence_paiement_energie})`);
          if (loft.prochaine_echeance_telephone) console.log(`      📞 Téléphone: ${loft.prochaine_echeance_telephone} (${loft.frequence_paiement_telephone})`);
          if (loft.prochaine_echeance_internet) console.log(`      🌐 Internet: ${loft.prochaine_echeance_internet} (${loft.frequence_paiement_internet})`);
        });
      }
    }

    console.log('\n📋 2. Test de la fonction get_upcoming_bills...');
    const { data: upcomingBills, error: upcomingError } = await supabase
      .rpc('get_upcoming_bills', { days_ahead: 30 });

    if (upcomingError) {
      console.error('❌ Erreur get_upcoming_bills:', upcomingError.message);
    } else {
      console.log(`✅ ${upcomingBills?.length || 0} factures à venir trouvées`);
      if (upcomingBills && upcomingBills.length > 0) {
        upcomingBills.slice(0, 3).forEach(bill => {
          console.log(`   📅 ${bill.loft_name} - ${bill.utility_type}: ${bill.due_date} (dans ${bill.days_until_due} jours)`);
        });
      }
    }

    console.log('\n📋 3. Test de la fonction get_overdue_bills...');
    const { data: overdueBills, error: overdueError } = await supabase
      .rpc('get_overdue_bills');

    if (overdueError) {
      console.error('❌ Erreur get_overdue_bills:', overdueError.message);
    } else {
      console.log(`✅ ${overdueBills?.length || 0} factures en retard trouvées`);
      if (overdueBills && overdueBills.length > 0) {
        overdueBills.slice(0, 3).forEach(bill => {
          console.log(`   ⚠️ ${bill.loft_name} - ${bill.utility_type}: ${bill.due_date} (${bill.days_overdue} jours de retard)`);
        });
      }
    }

    // 4. Créer des données de test si nécessaire
    if (!lofts || lofts.length === 0) {
      console.log('\n📋 4. Aucune donnée trouvée, création de données de test...');
      
      // Récupérer un loft existant
      const { data: existingLofts, error: existingError } = await supabase
        .from('lofts')
        .select('id, name')
        .limit(1);

      if (existingError) {
        console.error('❌ Erreur lors de la récupération des lofts existants:', existingError.message);
      } else if (existingLofts && existingLofts.length > 0) {
        const loft = existingLofts[0];
        const today = new Date();
        const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
        const nextMonth = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);

        console.log(`   📍 Mise à jour du loft: ${loft.name}`);
        
        const { error: updateError } = await supabase
          .from('lofts')
          .update({
            prochaine_echeance_eau: nextWeek.toISOString().split('T')[0],
            frequence_paiement_eau: 'mensuel',
            prochaine_echeance_energie: nextMonth.toISOString().split('T')[0],
            frequence_paiement_energie: 'mensuel'
          })
          .eq('id', loft.id);

        if (updateError) {
          console.error('❌ Erreur lors de la mise à jour:', updateError.message);
        } else {
          console.log('✅ Données de test créées avec succès');
        }
      }
    }

    console.log('\n🎯 Résumé du test:');
    console.log('================');
    console.log(`📊 Lofts avec échéances: ${lofts?.length || 0}`);
    console.log(`📅 Factures à venir: ${upcomingBills?.length || 0}`);
    console.log(`⚠️ Factures en retard: ${overdueBills?.length || 0}`);
    
    if ((upcomingBills && upcomingBills.length > 0) || (overdueBills && overdueBills.length > 0)) {
      console.log('\n✅ Les alertes de factures devraient maintenant s\'afficher dans le dashboard!');
    } else {
      console.log('\n⚠️ Aucune alerte de facture à afficher actuellement.');
      console.log('   💡 Ajoutez des dates d\'échéance aux lofts pour voir les alertes.');
    }

  } catch (error) {
    console.error('❌ Erreur générale:', error.message);
  }
}

// Exécuter le test
testBillAlerts().catch(console.error);