const fs = require('fs');
const path = require('path');

// Créer une sauvegarde des traductions actuelles (qui fonctionnent)
function backupTranslations() {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const backupDir = path.join(__dirname, 'backup', `translations-working-${timestamp}`);
    
    // Créer le dossier de sauvegarde
    if (!fs.existsSync(path.join(__dirname, 'backup'))) {
        fs.mkdirSync(path.join(__dirname, 'backup'));
    }
    fs.mkdirSync(backupDir, { recursive: true });
    
    const languages = ['fr', 'en', 'ar'];
    
    console.log(`🔄 Création de la sauvegarde des traductions...`);
    console.log(`📁 Dossier: ${backupDir}`);
    
    languages.forEach(lang => {
        const sourcePath = path.join(__dirname, 'public', 'locales', lang, 'lofts.json');
        const targetPath = path.join(backupDir, `lofts-${lang}.json`);
        
        try {
            if (fs.existsSync(sourcePath)) {
                fs.copyFileSync(sourcePath, targetPath);
                console.log(`✅ ${lang}/lofts.json sauvegardé`);
            } else {
                console.log(`⚠️  ${lang}/lofts.json non trouvé`);
            }
        } catch (error) {
            console.error(`❌ Erreur lors de la sauvegarde de ${lang}:`, error.message);
        }
    });
    
    // Créer un fichier de métadonnées
    const metadata = {
        timestamp: new Date().toISOString(),
        description: "Sauvegarde des traductions fonctionnelles des lofts",
        languages: languages,
        created_by: "backup-working-translations.cjs",
        status: "working"
    };
    
    fs.writeFileSync(
        path.join(backupDir, 'metadata.json'), 
        JSON.stringify(metadata, null, 2)
    );
    
    console.log(`✅ Sauvegarde terminée: ${backupDir}`);
    return backupDir;
}

// Fonction pour restaurer une sauvegarde
function restoreTranslations(backupDir) {
    if (!fs.existsSync(backupDir)) {
        console.error(`❌ Dossier de sauvegarde non trouvé: ${backupDir}`);
        return false;
    }
    
    const languages = ['fr', 'en', 'ar'];
    console.log(`🔄 Restauration des traductions depuis: ${backupDir}`);
    
    languages.forEach(lang => {
        const sourcePath = path.join(backupDir, `lofts-${lang}.json`);
        const targetPath = path.join(__dirname, 'public', 'locales', lang, 'lofts.json');
        
        try {
            if (fs.existsSync(sourcePath)) {
                fs.copyFileSync(sourcePath, targetPath);
                console.log(`✅ ${lang}/lofts.json restauré`);
            } else {
                console.log(`⚠️  ${lang}/lofts.json non trouvé dans la sauvegarde`);
            }
        } catch (error) {
            console.error(`❌ Erreur lors de la restauration de ${lang}:`, error.message);
        }
    });
    
    console.log(`✅ Restauration terminée`);
    return true;
}

// Fonction pour lister les sauvegardes disponibles
function listBackups() {
    const backupDir = path.join(__dirname, 'backup');
    
    if (!fs.existsSync(backupDir)) {
        console.log('📁 Aucun dossier de sauvegarde trouvé');
        return [];
    }
    
    const backups = fs.readdirSync(backupDir)
        .filter(dir => dir.startsWith('translations-working-'))
        .map(dir => {
            const fullPath = path.join(backupDir, dir);
            const metadataPath = path.join(fullPath, 'metadata.json');
            
            let metadata = {};
            if (fs.existsSync(metadataPath)) {
                try {
                    metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf8'));
                } catch (error) {
                    console.warn(`⚠️  Impossible de lire les métadonnées de ${dir}`);
                }
            }
            
            return {
                name: dir,
                path: fullPath,
                timestamp: metadata.timestamp || 'Inconnu',
                description: metadata.description || 'Pas de description'
            };
        })
        .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    
    console.log('📋 Sauvegardes disponibles:');
    backups.forEach((backup, index) => {
        console.log(`${index + 1}. ${backup.name}`);
        console.log(`   📅 ${backup.timestamp}`);
        console.log(`   📝 ${backup.description}`);
        console.log('');
    });
    
    return backups;
}

// Exécution selon les arguments
const args = process.argv.slice(2);
const command = args[0];

switch (command) {
    case 'backup':
        backupTranslations();
        break;
    
    case 'restore':
        const backupPath = args[1];
        if (!backupPath) {
            console.log('Usage: node backup-working-translations.cjs restore <chemin-sauvegarde>');
            listBackups();
        } else {
            restoreTranslations(backupPath);
        }
        break;
    
    case 'list':
        listBackups();
        break;
    
    default:
        console.log('🔧 Gestionnaire de Sauvegardes des Traductions Lofts');
        console.log('');
        console.log('Usage:');
        console.log('  node backup-working-translations.cjs backup    - Créer une sauvegarde');
        console.log('  node backup-working-translations.cjs restore <path> - Restaurer une sauvegarde');
        console.log('  node backup-working-translations.cjs list     - Lister les sauvegardes');
        console.log('');
        console.log('Exemple:');
        console.log('  node backup-working-translations.cjs backup');
        console.log('  node backup-working-translations.cjs list');
        console.log('  node backup-working-translations.cjs restore backup/translations-working-2024-01-15T10-30-00');
        break;
}