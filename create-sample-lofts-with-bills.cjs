#!/usr/bin/env node

/**
 * Script pour créer des lofts de test avec des alertes de factures
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

async function createSampleData() {
  console.log('🏢 Création de lofts de test avec alertes de factures\n');

  try {
    // Créer des propriétaires de test d'abord
    console.log('👤 Création des propriétaires...');
    
    const owners = [
      {
        id: '11111111-1111-1111-1111-111111111111',
        full_name: 'Ahmed Benali',
        email: 'ahmed.benali@example.com',
        phone: '+213555123456'
      },
      {
        id: '22222222-2222-2222-2222-222222222222',
        full_name: 'Fatima Khelifi',
        email: 'fatima.khelifi@example.com',
        phone: '+213555654321'
      }
    ];

    for (const owner of owners) {
      const { error: ownerError } = await supabase
        .from('owners')
        .upsert(owner, { onConflict: 'id' });

      if (ownerError) {
        console.error(`❌ Erreur propriétaire ${owner.full_name}:`, ownerError.message);
      } else {
        console.log(`✅ Propriétaire créé: ${owner.full_name}`);
      }
    }

    // Créer des lofts avec des dates d'échéance
    console.log('\n🏠 Création des lofts avec alertes de factures...');

    const today = new Date();
    const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
    const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000);
    const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
    const nextMonth = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);

    const lofts = [
      {
        id: '33333333-3333-3333-3333-333333333333',
        name: 'Appartement Centre-ville Alger',
        description: 'Bel appartement au centre d\'Alger avec vue sur la mer',
        address: '15 Rue Didouche Mourad, Alger',
        price: 15000,
        owner_id: owners[0].id,
        status: 'available',
        // Factures en retard
        prochaine_echeance_eau: yesterday.toISOString().split('T')[0],
        frequence_paiement_eau: 'mensuel',
        prochaine_echeance_energie: yesterday.toISOString().split('T')[0],
        frequence_paiement_energie: 'mensuel'
      },
      {
        id: '44444444-4444-4444-4444-444444444444',
        name: 'Studio Moderne Oran',
        description: 'Studio moderne et équipé à Oran',
        address: '8 Boulevard de la République, Oran',
        price: 8000,
        owner_id: owners[1].id,
        status: 'available',
        // Factures dues demain
        prochaine_echeance_eau: tomorrow.toISOString().split('T')[0],
        frequence_paiement_eau: 'mensuel',
        prochaine_echeance_telephone: tomorrow.toISOString().split('T')[0],
        frequence_paiement_telephone: 'mensuel'
      },
      {
        id: '55555555-5555-5555-5555-555555555555',
        name: 'Villa Hydra Alger',
        description: 'Belle villa à Hydra avec jardin',
        address: 'Chemin des Glycines, Hydra, Alger',
        price: 35000,
        owner_id: owners[0].id,
        status: 'available',
        // Factures à venir
        prochaine_echeance_energie: nextWeek.toISOString().split('T')[0],
        frequence_paiement_energie: 'mensuel',
        prochaine_echeance_internet: nextMonth.toISOString().split('T')[0],
        frequence_paiement_internet: 'mensuel'
      }
    ];

    for (const loft of lofts) {
      const { error: loftError } = await supabase
        .from('lofts')
        .upsert(loft, { onConflict: 'id' });

      if (loftError) {
        console.error(`❌ Erreur loft ${loft.name}:`, loftError.message);
      } else {
        console.log(`✅ Loft créé: ${loft.name}`);
        
        // Afficher les échéances
        if (loft.prochaine_echeance_eau) {
          console.log(`   💧 Eau: ${loft.prochaine_echeance_eau} (${loft.frequence_paiement_eau})`);
        }
        if (loft.prochaine_echeance_energie) {
          console.log(`   ⚡ Énergie: ${loft.prochaine_echeance_energie} (${loft.frequence_paiement_energie})`);
        }
        if (loft.prochaine_echeance_telephone) {
          console.log(`   📞 Téléphone: ${loft.prochaine_echeance_telephone} (${loft.frequence_paiement_telephone})`);
        }
        if (loft.prochaine_echeance_internet) {
          console.log(`   🌐 Internet: ${loft.prochaine_echeance_internet} (${loft.frequence_paiement_internet})`);
        }
      }
      console.log('');
    }

    // Tester les alertes
    console.log('🔍 Test des alertes de factures...\n');

    const { data: upcomingBills, error: upcomingError } = await supabase
      .rpc('get_upcoming_bills', { days_ahead: 30 });

    if (upcomingError) {
      console.error('❌ Erreur get_upcoming_bills:', upcomingError.message);
    } else {
      console.log(`📅 ${upcomingBills?.length || 0} factures à venir:`);
      upcomingBills?.forEach(bill => {
        const status = bill.days_until_due <= 1 ? '🚨' : bill.days_until_due <= 7 ? '⚠️' : '📅';
        console.log(`   ${status} ${bill.loft_name} - ${bill.utility_type}: ${bill.due_date} (dans ${bill.days_until_due} jours)`);
      });
    }

    const { data: overdueBills, error: overdueError } = await supabase
      .rpc('get_overdue_bills');

    if (overdueError) {
      console.error('❌ Erreur get_overdue_bills:', overdueError.message);
    } else {
      console.log(`\n🚨 ${overdueBills?.length || 0} factures en retard:`);
      overdueBills?.forEach(bill => {
        console.log(`   ❌ ${bill.loft_name} - ${bill.utility_type}: ${bill.due_date} (${bill.days_overdue} jours de retard)`);
      });
    }

    console.log('\n🎉 Données de test créées avec succès!');
    console.log('📊 Les alertes de factures devraient maintenant apparaître dans le dashboard manager/admin.');
    console.log('\n💡 Pour tester:');
    console.log('   1. Connectez-vous avec un compte manager ou admin');
    console.log('   2. Accédez au dashboard');
    console.log('   3. Vérifiez la section "Alertes Factures"');

  } catch (error) {
    console.error('❌ Erreur générale:', error.message);
  }
}

// Exécuter la création
createSampleData().catch(console.error);