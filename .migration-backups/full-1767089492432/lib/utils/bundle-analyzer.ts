/**
 * Utilitaires pour analyser et optimiser les bundles de traduction
 */

// Types pour l'analyse des bundles
interface BundleAnalysis {
  totalSize: number;
  translationSize: number;
  translationPercentage: number;
  languageBreakdown: Record<string, number>;
  namespaceBreakdown: Record<string, number>;
  recommendations: string[];
}

interface TranslationUsage {
  namespace: string;
  key: string;
  usageCount: number;
  lastUsed: number;
}

// Cache pour tracker l'utilisation des traductions
const usageTracker = new Map<string, TranslationUsage>();

/**
 * Tracker l'utilisation d'une clé de traduction
 */
export function trackTranslationUsage(namespace: string, key: string): void {
  const fullKey = `${namespace}.${key}`;
  const existing = usageTracker.get(fullKey);
  
  if (existing) {
    existing.usageCount++;
    existing.lastUsed = Date.now();
  } else {
    usageTracker.set(fullKey, {
      namespace,
      key,
      usageCount: 1,
      lastUsed: Date.now()
    });
  }
}

/**
 * Obtenir les statistiques d'utilisation des traductions
 */
export function getTranslationUsageStats(): {
  mostUsed: TranslationUsage[];
  leastUsed: TranslationUsage[];
  unused: string[];
  totalTracked: number;
} {
  const entries = Array.from(usageTracker.values());
  
  // Trier par utilisation
  const sortedByUsage = entries.sort((a, b) => b.usageCount - a.usageCount);
  
  return {
    mostUsed: sortedByUsage.slice(0, 10),
    leastUsed: sortedByUsage.slice(-10).reverse(),
    unused: [], // TODO: Comparer avec toutes les clés disponibles
    totalTracked: entries.length
  };
}

/**
 * Analyser la taille des fichiers de traduction
 */
export async function analyzeTranslationBundles(): Promise<BundleAnalysis> {
  const locales = ['fr', 'en', 'ar'];
  const analysis: BundleAnalysis = {
    totalSize: 0,
    translationSize: 0,
    translationPercentage: 0,
    languageBreakdown: {},
    namespaceBreakdown: {},
    recommendations: []
  };

  try {
    // Analyser chaque fichier de langue
    for (const locale of locales) {
      try {
        const messages = await import(`@/messages/${locale}.json`);
        const messageString = JSON.stringify(messages.default);
        const size = new Blob([messageString]).size;
        
        analysis.languageBreakdown[locale] = size;
        analysis.translationSize += size;
        
        // Analyser par namespace
        Object.keys(messages.default).forEach(namespace => {
          const namespaceString = JSON.stringify(messages.default[namespace]);
          const namespaceSize = new Blob([namespaceString]).size;
          
          if (!analysis.namespaceBreakdown[namespace]) {
            analysis.namespaceBreakdown[namespace] = 0;
          }
          analysis.namespaceBreakdown[namespace] += namespaceSize;
        });
        
      } catch (error) {
        console.warn(`Failed to analyze ${locale} translations:`, error);
      }
    }
    
    // Calculer les pourcentages et recommandations
    analysis.totalSize = analysis.translationSize; // Simplifié pour cet exemple
    analysis.translationPercentage = 100; // Simplifié
    
    // Générer des recommandations
    analysis.recommendations = generateOptimizationRecommendations(analysis);
    
  } catch (error) {
    console.error('Failed to analyze translation bundles:', error);
  }

  return analysis;
}

/**
 * Générer des recommandations d'optimisation
 */
function generateOptimizationRecommendations(analysis: BundleAnalysis): string[] {
  const recommendations: string[] = [];
  
  // Recommandations basées sur la taille
  if (analysis.translationSize > 100000) { // 100KB
    recommendations.push('Consider splitting large translation files by feature/route');
  }
  
  // Recommandations basées sur les namespaces
  const namespaceEntries = Object.entries(analysis.namespaceBreakdown)
    .sort(([,a], [,b]) => b - a);
  
  if (namespaceEntries.length > 0) {
    const [largestNamespace, largestSize] = namespaceEntries[0];
    if (largestSize > 20000) { // 20KB
      recommendations.push(`Consider splitting the '${largestNamespace}' namespace (${Math.round(largestSize/1024)}KB)`);
    }
  }
  
  // Recommandations basées sur l'utilisation
  const usageStats = getTranslationUsageStats();
  if (usageStats.totalTracked > 0) {
    const unusedPercentage = (usageStats.unused.length / usageStats.totalTracked) * 100;
    if (unusedPercentage > 20) {
      recommendations.push(`${Math.round(unusedPercentage)}% of translations appear unused - consider cleanup`);
    }
  }
  
  return recommendations;
}

/**
 * Optimiser automatiquement les traductions en supprimant les clés inutilisées
 */
export function optimizeTranslations(dryRun: boolean = true): {
  removedKeys: string[];
  savedBytes: number;
  newStructure: any;
} {
  const usageStats = getTranslationUsageStats();
  const result = {
    removedKeys: [] as string[],
    savedBytes: 0,
    newStructure: {}
  };
  
  if (dryRun) {
    console.log('DRY RUN: Translation optimization simulation');
    console.log('Unused keys that would be removed:', usageStats.unused);
  }
  
  // TODO: Implémenter la logique de suppression réelle
  
  return result;
}

/**
 * Générer un rapport de performance des traductions
 */
export async function generatePerformanceReport(): Promise<string> {
  const analysis = await analyzeTranslationBundles();
  const usageStats = getTranslationUsageStats();
  
  const report = `
# Translation Performance Report

## Bundle Analysis
- Total translation size: ${Math.round(analysis.translationSize / 1024)}KB
- Number of languages: ${Object.keys(analysis.languageBreakdown).length}
- Number of namespaces: ${Object.keys(analysis.namespaceBreakdown).length}

## Language Breakdown
${Object.entries(analysis.languageBreakdown)
  .map(([lang, size]) => `- ${lang}: ${Math.round(size / 1024)}KB`)
  .join('\n')}

## Namespace Breakdown (Top 5)
${Object.entries(analysis.namespaceBreakdown)
  .sort(([,a], [,b]) => b - a)
  .slice(0, 5)
  .map(([ns, size]) => `- ${ns}: ${Math.round(size / 1024)}KB`)
  .join('\n')}

## Usage Statistics
- Total tracked translations: ${usageStats.totalTracked}
- Most used translations: ${usageStats.mostUsed.slice(0, 3).map(t => t.namespace + '.' + t.key).join(', ')}

## Recommendations
${analysis.recommendations.map(r => `- ${r}`).join('\n')}

Generated at: ${new Date().toISOString()}
`;

  return report;
}

/**
 * Hook React pour utiliser l'analyseur de bundle
 */
export function useBundleAnalyzer() {
  return {
    trackUsage: trackTranslationUsage,
    getStats: getTranslationUsageStats,
    analyze: analyzeTranslationBundles,
    generateReport: generatePerformanceReport,
    optimize: optimizeTranslations
  };
}