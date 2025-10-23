import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🔍 Diagnostic du Logo Loft Algérie');
console.log('');

const logoPath = path.join(__dirname, '..', 'public', 'logo.jpg');
const fallbackPath = path.join(__dirname, '..', 'public', 'logo-fallback.svg');

// Vérifier le logo principal
if (fs.existsSync(logoPath)) {
  const stats = fs.statSync(logoPath);
  const buffer = fs.readFileSync(logoPath);
  
  console.log('📁 Logo Principal (logo.jpg) :');
  console.log(`   ✅ Existe : Oui`);
  console.log(`   📊 Taille : ${Math.round(stats.size / 1024)} KB`);
  console.log(`   📅 Modifié : ${stats.mtime.toLocaleDateString()}`);
  
  // Vérifier les premiers bytes (signature JPEG)
  const isValidJPEG = buffer[0] === 0xFF && buffer[1] === 0xD8;
  console.log(`   🖼️  Format JPEG valide : ${isValidJPEG ? '✅ Oui' : '❌ Non'}`);
  
  if (!isValidJPEG) {
    console.log('   ⚠️  Le fichier ne semble pas être un JPEG valide');
  }
  
} else {
  console.log('❌ Logo principal non trouvé');
}

console.log('');

// Vérifier le fallback
if (fs.existsSync(fallbackPath)) {
  const stats = fs.statSync(fallbackPath);
  console.log('🎨 Logo Fallback (logo-fallback.svg) :');
  console.log(`   ✅ Existe : Oui`);
  console.log(`   📊 Taille : ${Math.round(stats.size / 1024)} KB`);
} else {
  console.log('❌ Logo fallback non trouvé');
}

console.log('');
console.log('🔧 Solutions recommandées :');
console.log('   1. Si logo.jpg ne fonctionne pas :');
console.log('      • Vérifiez que c\'est un JPEG valide');
console.log('      • Essayez de le re-sauvegarder');
console.log('      • Le fallback SVG sera utilisé automatiquement');
console.log('');
console.log('   2. Pour tester :');
console.log('      • npm run dev');
console.log('      • Visitez /fr/public');
console.log('      • Vérifiez la console pour les erreurs');
console.log('');
console.log('   3. Le système utilise maintenant :');
console.log('      • Logo JPG en priorité');
console.log('      • Fallback SVG doré si échec');
console.log('      • Qualité d\'image optimisée (90)');

console.log('');
console.log('🎯 Votre logo sera visible dans tous les cas !');