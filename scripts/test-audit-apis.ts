#!/usr/bin/env tsx

/**
 * Script de test pour vérifier les APIs d'audit après correction
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

async function testAuditAPIs() {
  console.log('🧪 Test des APIs d\'audit après correction...\n');

  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

  // Test 1: Vérifier la fonction RPC get_audit_logs_for_entity
  console.log('1️⃣ Test de la fonction RPC get_audit_logs_for_entity...');
  try {
    const { data, error } = await supabase.rpc('get_audit_logs_for_entity', {
      p_table_name: 'transactions',
      p_record_id: '123e4567-e89b-12d3-a456-426614174000',
      p_limit: 5
    });

    if (error) {
      console.log('❌ Erreur RPC:', error.message);
    } else {
      console.log('✅ RPC fonctionne:', {
        success: data?.success,
        count: data?.count,
        dataLength: data?.data?.length || 0
      });
    }
  } catch (error) {
    console.log('❌ Exception RPC:', error);
  }

  // Test 2: Vérifier l'accès direct à audit.audit_logs
  console.log('\n2️⃣ Test d\'accès direct à audit.audit_logs...');
  try {
    const { data, error, count } = await supabase
      .from('audit.audit_logs')
      .select('id, table_name, action', { count: 'exact' })
      .limit(3);

    if (error) {
      console.log('❌ Erreur accès direct:', error.message);
    } else {
      console.log('✅ Accès direct fonctionne:', {
        count: count || 0,
        sampleRecords: data?.length || 0
      });
    }
  } catch (error) {
    console.log('❌ Exception accès direct:', error);
  }

  // Test 3: Vérifier les fonctions RPC disponibles
  console.log('\n3️⃣ Test des fonctions RPC disponibles...');
  try {
    // Test count function
    const { data: countData, error: countError } = await supabase.rpc('count_audit_logs_simple');
    
    if (countError) {
      console.log('❌ Erreur count RPC:', countError.message);
    } else {
      console.log('✅ Count RPC fonctionne:', { totalLogs: countData });
    }
  } catch (error) {
    console.log('❌ Exception count RPC:', error);
  }

  // Test 4: Vérifier get_all_audit_logs
  console.log('\n4️⃣ Test de get_all_audit_logs...');
  try {
    const { data: allLogsData, error: allLogsError } = await supabase.rpc('get_all_audit_logs', {
      p_limit: 3,
      p_offset: 0
    });
    
    if (allLogsError) {
      console.log('❌ Erreur get_all_audit_logs:', allLogsError.message);
    } else {
      console.log('✅ get_all_audit_logs fonctionne:', {
        success: allLogsData?.success,
        total: allLogsData?.total,
        dataLength: allLogsData?.data?.length || 0
      });
    }
  } catch (error) {
    console.log('❌ Exception get_all_audit_logs:', error);
  }

  console.log('\n🏁 Tests terminés!');
}

// Exécuter les tests
testAuditAPIs().catch(console.error);