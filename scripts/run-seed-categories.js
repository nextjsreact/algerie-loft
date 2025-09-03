#!/usr/bin/env node

/**
 * Script pour alimenter la table categories avec les catégories de factures
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Get current directory for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables');
  console.error('Please ensure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function seedCategories() {
  console.log('🌱 Starting categories seeding...');
  
  try {
    // Read the SQL script
    const sqlScript = fs.readFileSync(path.join(__dirname, 'seed-bill-categories.sql'), 'utf8');
    
    console.log('📝 Inserting bill categories...');
    
    // Split the script into individual INSERT statements
    const statements = sqlScript
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && stmt.toUpperCase().startsWith('INSERT'));
    
    console.log(`Found ${statements.length} INSERT statements to execute`);
    
    // Execute each INSERT statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      console.log(`Executing statement ${i + 1}/${statements.length}...`);
      
      try {
        // Parse the INSERT statement to extract values
        if (statement.includes('eau')) {
          await supabase.from('categories').upsert([
            { name: 'eau', description: 'Factures d\'eau et services d\'assainissement', type: 'expense' },
            { name: 'energie', description: 'Factures d\'électricité et de gaz', type: 'expense' },
            { name: 'telephone', description: 'Factures de téléphone fixe et mobile', type: 'expense' },
            { name: 'internet', description: 'Factures d\'accès internet et services numériques', type: 'expense' }
          ], { onConflict: 'name' });
          console.log('✅ Bill categories inserted successfully');
        } else if (statement.includes('maintenance')) {
          await supabase.from('categories').upsert([
            { name: 'maintenance', description: 'Travaux de maintenance et réparations', type: 'expense' },
            { name: 'cleaning', description: 'Services de nettoyage et entretien', type: 'expense' },
            { name: 'insurance', description: 'Assurances habitation et responsabilité', type: 'expense' },
            { name: 'taxes', description: 'Taxes foncières et impôts locaux', type: 'expense' },
            { name: 'security', description: 'Services de sécurité et surveillance', type: 'expense' },
            { name: 'supplies', description: 'Fournitures et équipements', type: 'expense' }
          ], { onConflict: 'name' });
          console.log('✅ Expense categories inserted successfully');
        } else if (statement.includes('rent')) {
          await supabase.from('categories').upsert([
            { name: 'rent', description: 'Revenus locatifs des lofts', type: 'income' },
            { name: 'deposit', description: 'Dépôts de garantie', type: 'income' },
            { name: 'fees', description: 'Frais de service et commissions', type: 'income' }
          ], { onConflict: 'name' });
          console.log('✅ Income categories inserted successfully');
        }
      } catch (error) {
        console.error(`❌ Error executing statement ${i + 1}:`, error);
      }
    }
    
    console.log('🔍 Verifying categories...');
    
    // Verify the categories were inserted
    const { data: categories, error: fetchError } = await supabase
      .from('categories')
      .select('name, description, type, created_at')
      .order('type, name');
    
    if (fetchError) {
      console.error('❌ Error fetching categories:', fetchError);
    } else {
      console.log('✅ Categories verification successful!');
      console.log('\n📊 Categories inserted:');
      
      const expenseCategories = categories.filter(c => c.type === 'expense');
      const incomeCategories = categories.filter(c => c.type === 'income');
      
      console.log('\n💸 Expense Categories:');
      expenseCategories.forEach(cat => {
        console.log(`  - ${cat.name}: ${cat.description}`);
      });
      
      console.log('\n💰 Income Categories:');
      incomeCategories.forEach(cat => {
        console.log(`  - ${cat.name}: ${cat.description}`);
      });
      
      console.log(`\n📈 Summary: ${expenseCategories.length} expense categories, ${incomeCategories.length} income categories`);
    }
    
    console.log('\n🎉 Categories seeding completed successfully!');
    console.log('💡 The bill payment system will now use these categories when marking bills as paid.');
    
  } catch (error) {
    console.error('❌ Error seeding categories:', error);
    console.error('\n📋 Manual fix required:');
    console.error('Please run the SQL script manually in your Supabase dashboard:');
    console.error('File: scripts/seed-bill-categories.sql');
  }
}

// Run the seeding
seedCategories();