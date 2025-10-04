#!/usr/bin/env tsx

/**
 * Script pour tester l'affichage des données d'audit
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

async function testAuditDisplay() {
  console.log('🧪 Test de l\'affichage des données d\'audit...\n');

  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  const testRecordId = '229afc15-84a5-4b93-b65a-fd133c063653';

  // Test 1: Vérifier les données via RPC
  console.log('1️⃣ Test RPC get_audit_logs_for_entity...');
  try {
    const { data, error } = await supabase.rpc('get_audit_logs_for_entity', {
      p_table_name: 'transactions',
      p_record_id: testRecordId,
      p_limit: 10
    });

    if (error) {
      console.log('❌ Erreur RPC:', error.message);
    } else {
      console.log('✅ RPC réussi:', {
        success: data?.success,
        count: data?.count,
        dataLength: data?.data?.length || 0
      });
      
      if (data?.data && data.data.length > 0) {
        console.log('📊 Premier log d\'audit:');
        const firstLog = data.data[0];
        console.log({
          id: firstLog.id,
          action: firstLog.action,
          timestamp: firstLog.timestamp,
          userEmail: firstLog.user_email,
          changedFields: firstLog.changed_fields
        });
      }
    }
  } catch (error) {
    console.log('❌ Exception RPC:', error);
  }

  // Test 2: Simuler l'appel API comme le fait le composant
  console.log('\n2️⃣ Test simulation appel API...');
  try {
    // Simuler la structure de réponse de l'API
    const mockApiResponse = {
      success: true,
      data: {
        tableName: 'transactions',
        recordId: testRecordId,
        auditHistory: [], // Sera rempli par les vraies données
        total: 0
      }
    };

    // Récupérer les vraies données
    const { data: rpcData, error } = await supabase.rpc('get_audit_logs_for_entity', {
      p_table_name: 'transactions',
      p_record_id: testRecordId,
      p_limit: 10
    });

    if (!error && rpcData?.success) {
      mockApiResponse.data.auditHistory = rpcData.data || [];
      mockApiResponse.data.total = rpcData.count || 0;
    }

    console.log('✅ Structure API simulée:', {
      success: mockApiResponse.success,
      auditHistoryLength: mockApiResponse.data.auditHistory.length,
      total: mockApiResponse.data.total
    });

    // Test de l'extraction des données comme dans le composant
    const auditLogs = mockApiResponse.data?.auditHistory || mockApiResponse.logs || [];
    console.log('📋 Logs extraits pour le composant:', auditLogs.length);

    if (auditLogs.length > 0) {
      console.log('🎯 Le composant devrait maintenant afficher les données !');
    } else {
      console.log('⚠️ Aucune donnée trouvée - le composant affichera "Aucun journal d\'audit"');
    }

  } catch (error) {
    console.log('❌ Exception simulation API:', error);
  }

  console.log('\n🏁 Test terminé!');
}

// Exécuter le test
testAuditDisplay().catch(console.error);