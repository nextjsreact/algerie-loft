// Script principal pour tester la partie client
import { execSync } from 'child_process';
import chalk from 'chalk';

console.log(chalk.blue.bold('\n🧪 TESTS DE LA PARTIE CLIENT - SYSTÈME DE RÉSERVATION\n'));
console.log(chalk.gray('═'.repeat(60)));

async function runClientTests() {
  const tests = [
    {
      name: 'Connectivité Base de Données',
      command: 'node test-db-connection.js',
      description: 'Vérification de la connexion à Supabase'
    },
    {
      name: 'API et Interface',
      command: 'node simple-api-test.js',
      description: 'Test de l\'API et de la page d\'accueil'
    },
    {
      name: 'Flux de Réservation',
      command: 'node test-reservation-flow.js',
      description: 'Test complet du processus de réservation'
    }
  ];

  let passedTests = 0;
  let totalTests = tests.length;

  for (const test of tests) {
    console.log(chalk.cyan(`\n🔍 ${test.name}`));
    console.log(chalk.gray(`   ${test.description}`));
    console.log(chalk.gray('   ' + '─'.repeat(50)));

    try {
      execSync(test.command, { stdio: 'inherit' });
      console.log(chalk.green(`✅ ${test.name}: RÉUSSI`));
      passedTests++;
    } catch (error) {
      console.log(chalk.red(`❌ ${test.name}: ÉCHOUÉ`));
    }
  }

  // Résumé final
  console.log(chalk.blue('\n📊 RÉSUMÉ DES TESTS'));
  console.log(chalk.gray('═'.repeat(30)));
  console.log(chalk.white(`Total: ${totalTests}`));
  console.log(chalk.green(`✅ Réussis: ${passedTests}`));
  console.log(chalk.red(`❌ Échoués: ${totalTests - passedTests}`));
  
  const successRate = (passedTests / totalTests * 100).toFixed(1);
  console.log(chalk.cyan(`📈 Taux de réussite: ${successRate}%`));

  if (passedTests === totalTests) {
    console.log(chalk.green.bold('\n🎉 TOUS LES TESTS SONT PASSÉS !'));
    console.log(chalk.green('La partie client est prête pour les tests manuels.'));
  } else {
    console.log(chalk.yellow.bold('\n⚠️  CERTAINS TESTS ONT ÉCHOUÉ'));
    console.log(chalk.yellow('Vérifiez les erreurs ci-dessus avant de continuer.'));
  }

  console.log(chalk.blue('\n📋 PROCHAINES ÉTAPES:'));
  console.log('1. Effectuer les tests manuels avec manual-test-checklist.md');
  console.log('2. Tester sur différents navigateurs et appareils');
  console.log('3. Corriger les bugs trouvés');
  console.log('4. Optimiser les performances si nécessaire');

  return passedTests === totalTests;
}

runClientTests().then(success => {
  process.exit(success ? 0 : 1);
});