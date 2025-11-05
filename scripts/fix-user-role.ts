/**
 * Script pour corriger le rôle d'un utilisateur spécifique
 * Utilisez ce script pour forcer un utilisateur à avoir le rôle superuser
 */

import { createClient } from '@/utils/supabase/server';
import { forceUpdateUserRole, ensureSuperuserProfile } from '@/lib/auth/role-detection';

async function fixUserRole(userEmail: string, newRole: 'superuser' | 'admin' | 'manager' | 'executive' | 'member' | 'client' | 'partner') {
  console.log(`🔧 Correction du rôle utilisateur pour: ${userEmail}`);
  
  try {
    const supabase = await createClient(true);
    
    // Trouver l'utilisateur par email
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
    
    if (authError) {
      console.error('❌ Erreur lors de la récupération des utilisateurs:', authError);
      return;
    }
    
    const user = authUsers.users.find(u => u.email === userEmail);
    
    if (!user) {
      console.error(`❌ Utilisateur non trouvé: ${userEmail}`);
      return;
    }
    
    console.log(`✅ Utilisateur trouvé: ${user.id}`);
    
    // Forcer la mise à jour du rôle
    const success = await forceUpdateUserRole(user.id, newRole);
    
    if (!success) {
      console.error('❌ Échec de la mise à jour du rôle');
      return;
    }
    
    console.log(`✅ Rôle mis à jour vers: ${newRole}`);
    
    // Si le nouveau rôle est superuser, s'assurer que le profil superuser existe
    if (newRole === 'superuser') {
      const superuserProfileCreated = await ensureSuperuserProfile(user.id);
      if (superuserProfileCreated) {
        console.log('✅ Profil superuser créé/vérifié');
      } else {
        console.error('❌ Échec de la création du profil superuser');
      }
    }
    
    console.log('🎉 Correction terminée avec succès !');
    console.log('📝 L\'utilisateur doit se reconnecter pour que les changements prennent effet.');
    
  } catch (error) {
    console.error('❌ Erreur lors de la correction:', error);
  }
}

// Fonction pour lister tous les utilisateurs et leurs rôles actuels
async function listAllUsers() {
  console.log('📋 Liste de tous les utilisateurs:');
  
  try {
    const supabase = await createClient(true);
    
    // Récupérer tous les utilisateurs auth
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
    
    if (authError) {
      console.error('❌ Erreur:', authError);
      return;
    }
    
    // Récupérer tous les profils
    const { data: profiles, error: profileError } = await supabase
      .from('profiles')
      .select('id, role, full_name');
    
    if (profileError) {
      console.error('❌ Erreur profils:', profileError);
      return;
    }
    
    // Récupérer tous les profils superuser
    const { data: superuserProfiles, error: superuserError } = await supabase
      .from('superuser_profiles')
      .select('user_id, is_active');
    
    if (superuserError) {
      console.warn('⚠️ Erreur profils superuser:', superuserError);
    }
    
    console.log('\n👥 Utilisateurs:');
    console.log('='.repeat(80));
    
    authUsers.users.forEach(user => {
      const profile = profiles?.find(p => p.id === user.id);
      const superuserProfile = superuserProfiles?.find(sp => sp.user_id === user.id && sp.is_active);
      
      const role = profile?.role || 'Aucun profil';
      const isSuperuser = !!superuserProfile;
      const name = profile?.full_name || user.email?.split('@')[0] || 'Inconnu';
      
      console.log(`📧 ${user.email}`);
      console.log(`   ID: ${user.id}`);
      console.log(`   Nom: ${name}`);
      console.log(`   Rôle: ${role}${isSuperuser ? ' (+ Superuser)' : ''}`);
      console.log(`   Créé: ${new Date(user.created_at).toLocaleDateString()}`);
      console.log('   ' + '-'.repeat(60));
    });
    
  } catch (error) {
    console.error('❌ Erreur:', error);
  }
}

// Exporter les fonctions pour utilisation
export { fixUserRole, listAllUsers };

// Si exécuté directement, demander l'email et le rôle
if (import.meta.url === `file://${process.argv[1]}`) {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.log('📋 Utilisation:');
    console.log('  npm run fix-user-role <email> <role>');
    console.log('  npm run list-users');
    console.log('');
    console.log('🔧 Exemples:');
    console.log('  npm run fix-user-role user@example.com superuser');
    console.log('  npm run fix-user-role admin@company.com admin');
    console.log('');
    console.log('📝 Rôles disponibles: superuser, admin, manager, executive, member, client, partner');
    
    // Lister tous les utilisateurs par défaut
    listAllUsers();
  } else if (args[0] === 'list') {
    listAllUsers();
  } else if (args.length === 2) {
    const [email, role] = args;
    const validRoles = ['superuser', 'admin', 'manager', 'executive', 'member', 'client', 'partner'];
    
    if (!validRoles.includes(role)) {
      console.error(`❌ Rôle invalide: ${role}`);
      console.log(`📝 Rôles valides: ${validRoles.join(', ')}`);
      process.exit(1);
    }
    
    fixUserRole(email, role as any);
  } else {
    console.error('❌ Arguments invalides');
    console.log('📋 Utilisation: npm run fix-user-role <email> <role>');
  }
}