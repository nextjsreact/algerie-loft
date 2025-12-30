const { execSync } = require('child_process');

console.log('🔍 Test de compilation Next.js...');
console.log('');

try {
    console.log('📦 Vérification des dépendances...');
    const packageJson = require('./package.json');
    console.log(`✅ Next.js version: ${packageJson.dependencies.next}`);
    console.log(`✅ React version: ${packageJson.dependencies.react}`);
    
    console.log('');
    console.log('🏗️ Test de build...');
    
    // Test de build rapide
    const result = execSync('node_modules\\.bin\\next.exe build --debug', { 
        encoding: 'utf8',
        timeout: 30000,
        cwd: __dirname
    });
    
    console.log('✅ Build réussi !');
    console.log(result);
    
} catch (error) {
    console.log('❌ Erreur détectée:');
    console.log(error.message);
    
    if (error.stdout) {
        console.log('📤 Sortie standard:');
        console.log(error.stdout);
    }
    
    if (error.stderr) {
        console.log('📥 Erreur standard:');
        console.log(error.stderr);
    }
}