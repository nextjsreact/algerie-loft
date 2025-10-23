const fs = require('fs');
const path = require('path');

console.log('🎨 Configuration du Logo - Loft Algérie');
console.log('');

// Vérifier si le logo existe
const logoPath = path.join(__dirname, '..', 'public', 'logo.jpg');
const logoExists = fs.existsSync(logoPath);

if (logoExists) {
  console.log('✅ Logo trouvé : public/logo.jpg');
  
  // Obtenir les informations du fichier
  const stats = fs.statSync(logoPath);
  const fileSizeKB = Math.round(stats.size / 1024);
  
  console.log(`📊 Taille du fichier : ${fileSizeKB} KB`);
  
  if (fileSizeKB > 500) {
    console.log('⚠️  Recommandation : Optimisez votre logo (< 500KB)');
  }
  
} else {
  console.log('❌ Logo non trouvé : public/logo.jpg');
  console.log('');
  console.log('📁 Placez votre logo dans :');
  console.log('   public/logo.jpg');
  console.log('');
  console.log('💡 Formats recommandés :');
  console.log('   • JPG ou PNG');
  console.log('   • Taille : 200x60px à 400x120px');
  console.log('   • Ratio : 3:1 ou 4:1');
  console.log('   • Qualité : Haute résolution');
}

console.log('');
console.log('🎯 Emplacements du logo dans le projet :');
console.log('   • Header : Toutes les pages (180x54px)');
console.log('   • Hero : Page publique (300x90px avec glow)');
console.log('   • Footer : Pied de page (160x48px)');

console.log('');
console.log('🎨 Variantes optionnelles :');
console.log('   • public/logo-white.jpg (version blanche)');
console.log('   • public/logo-dark.jpg (version sombre)');
console.log('   • public/favicon.ico (icône navigateur)');

console.log('');
console.log('🚀 Après avoir placé votre logo :');
console.log('   1. Redémarrez le serveur : npm run dev');
console.log('   2. Visitez : http://localhost:3000/fr/public');
console.log('   3. Testez les animations et effets');

console.log('');
console.log('⚙️  Personnalisation avancée :');
console.log('   • Modifiez components/futuristic/AnimatedLogo.tsx');
console.log('   • Ajustez les tailles et animations');
console.log('   • Configurez les effets de glow');

if (logoExists) {
  console.log('');
  console.log('🎉 Votre logo est prêt à être utilisé !');
} else {
  console.log('');
  console.log('📋 Étapes suivantes :');
  console.log('   1. Placez logo.jpg dans public/');
  console.log('   2. Relancez ce script : npm run setup:logo');
  console.log('   3. Démarrez le serveur : npm run dev');
}