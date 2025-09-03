#!/usr/bin/env node

/**
 * Script simple pour alimenter la table categories
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function seedCategories() {
  console.log('🌱 Seeding categories...');
  
  try {
    // Check if bill categories already exist
    const { data: existingBillCategories } = await supabase
      .from('categories')
      .select('name')
      .in('name', ['eau', 'energie', 'telephone', 'internet']);
    
    const existingBillNames = existingBillCategories?.map(c => c.name) || [];
    
    // Insert only new bill categories
    const billCategoriesToInsert = [
      { name: 'eau', description: 'Factures d\'eau et services d\'assainissement', type: 'expense' },
      { name: 'energie', description: 'Factures d\'électricité et de gaz', type: 'expense' },
      { name: 'telephone', description: 'Factures de téléphone fixe et mobile', type: 'expense' },
      { name: 'internet', description: 'Factures d\'accès internet et services numériques', type: 'expense' }
    ].filter(cat => !existingBillNames.includes(cat.name));
    
    if (billCategoriesToInsert.length > 0) {
      const { error: billError } = await supabase.from('categories').insert(billCategoriesToInsert);
      
      if (billError) {
        console.error('❌ Error inserting bill categories:', billError);
      } else {
        console.log(`✅ ${billCategoriesToInsert.length} bill categories inserted successfully`);
      }
    } else {
      console.log('ℹ️  Bill categories already exist');
    }
    
    // Check if other expense categories already exist
    const { data: existingExpenseCategories } = await supabase
      .from('categories')
      .select('name')
      .in('name', ['maintenance', 'cleaning', 'insurance', 'taxes']);
    
    const existingExpenseNames = existingExpenseCategories?.map(c => c.name) || [];
    
    // Insert only new expense categories
    const expenseCategoriesToInsert = [
      { name: 'maintenance', description: 'Travaux de maintenance et réparations', type: 'expense' },
      { name: 'cleaning', description: 'Services de nettoyage et entretien', type: 'expense' },
      { name: 'insurance', description: 'Assurances habitation et responsabilité', type: 'expense' },
      { name: 'taxes', description: 'Taxes foncières et impôts locaux', type: 'expense' }
    ].filter(cat => !existingExpenseNames.includes(cat.name));
    
    if (expenseCategoriesToInsert.length > 0) {
      const { error: expenseError } = await supabase.from('categories').insert(expenseCategoriesToInsert);
      
      if (expenseError) {
        console.error('❌ Error inserting expense categories:', expenseError);
      } else {
        console.log(`✅ ${expenseCategoriesToInsert.length} expense categories inserted successfully`);
      }
    } else {
      console.log('ℹ️  Expense categories already exist');
    }
    
    // Verify categories
    const { data: categories, error: fetchError } = await supabase
      .from('categories')
      .select('name, description, type')
      .order('type, name');
    
    if (fetchError) {
      console.error('❌ Error fetching categories:', fetchError);
    } else {
      console.log('\n📊 Categories in database:');
      categories.forEach(cat => {
        console.log(`  ${cat.type}: ${cat.name} - ${cat.description}`);
      });
    }
    
    console.log('\n🎉 Categories seeding completed!');
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

seedCategories();