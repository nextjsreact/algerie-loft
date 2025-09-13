#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Déploiement LoftAlgerie sur Vercel...\n');

// Vérifier si Vercel CLI est installé
try {
  execSync('vercel --version', { stdio: 'ignore' });
} catch (error) {
  console.log('📦 Installation de Vercel CLI...');
  execSync('npm install -g vercel', { stdio: 'inherit' });
}

// Vérifier les variables d'environnement
const requiredEnvVars = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'SUPABASE_SERVICE_ROLE_KEY'
];

console.log('🔍 Vérification des variables d\'environnement...');
const envFile = path.join(process.cwd(), '.env.local');
if (!fs.existsSync(envFile)) {
  console.error('❌ Fichier .env.local non trouvé!');
  console.log('📝 Créez un fichier .env.local avec vos variables Supabase');
  process.exit(1);
}

// Lire le fichier .env.local
const envContent = fs.readFileSync(envFile, 'utf8');
const envVars = {};
envContent.split('\n').forEach(line => {
  const match = line.match(/^(\w+)=(.*)$/);
  if (match) {
    envVars[match[1]] = match[2].replace(/"/g, ''); // Remove quotes
  }
});

const missingVars = requiredEnvVars.filter(varName => !envVars[varName]);

if (missingVars.length > 0) {
  console.error('❌ Variables d\'environnement manquantes:');
  missingVars.forEach(varName => console.log(`   - ${varName}`));
  process.exit(1);
}

console.log('✅ Variables d\'environnement OK\n');

// Build du projet
console.log('🔨 Build du projet...');
try {
  execSync('npm run build', { stdio: 'inherit' });
  console.log('✅ Build réussi\n');
} catch (error) {
  console.error('❌ Erreur lors du build');
  process.exit(1);
}

// Déploiement sur Vercel
console.log('🚀 Déploiement sur Vercel...');
try {
  const vercelCommand = `vercel --prod -e NEXT_PUBLIC_SUPABASE_URL=${envVars.NEXT_PUBLIC_SUPABASE_URL} -e NEXT_PUBLIC_SUPABASE_ANON_KEY=${envVars.NEXT_PUBLIC_SUPABASE_ANON_KEY} -e SUPABASE_SERVICE_ROLE_KEY=${envVars.SUPABASE_SERVICE_ROLE_KEY}`;
  execSync(vercelCommand, { stdio: 'inherit' });
  console.log('\n🎉 Déploiement réussi!');
  console.log('🌐 Votre application est maintenant en ligne sur Vercel');
} catch (error) {
  console.error('❌ Erreur lors du déploiement');
  process.exit(1);
}