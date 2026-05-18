/**
 * Batch Processor - Traite les opérations en lots pour respecter les timeouts
 * 
 * Ce module divise les opérations longues en batches pour respecter
 * la limite de timeout de 30 secondes de Vercel.
 */

/**
 * Résultat d'un batch
 */
export interface BatchResult<T> {
  batchIndex: number;
  success: boolean;
  processed: number;
  results: T[];
  errors: Array<{ index: number; error: string }>;
  duration: number; // en ms
}

/**
 * Résultat global du traitement par batches
 */
export interface BatchProcessResult<T> {
  success: boolean;
  totalProcessed: number;
  totalErrors: number;
  batches: BatchResult<T>[];
  totalDuration: number; // en ms
}

/**
 * Options pour le batch processor
 */
export interface BatchProcessorOptions {
  batchSize?: number;           // Taille de chaque batch (défaut: 20)
  maxBatchDuration?: number;    // Durée max par batch en ms (défaut: 25000)
  continueOnError?: boolean;    // Continuer si un batch échoue (défaut: true)
  onBatchComplete?: (result: BatchResult<any>) => void | Promise<void>;
  onProgress?: (processed: number, total: number) => void;
}

/**
 * Traite un tableau d'items en batches
 * 
 * @param items - Tableau d'items à traiter
 * @param processor - Fonction qui traite un item et retourne un résultat
 * @param options - Options de configuration
 * @returns Résultat global du traitement
 * 
 * @example
 * ```typescript
 * const lofts = await getLofts();
 * const result = await processBatch(
 *   lofts,
 *   async (loft) => await syncLoft(loft),
 *   { batchSize: 20, maxBatchDuration: 25000 }
 * );
 * console.log(`${result.totalProcessed} lofts synchronisés`);
 * ```
 */
export async function processBatch<TInput, TOutput>(
  items: TInput[],
  processor: (item: TInput, index: number) => Promise<TOutput>,
  options: BatchProcessorOptions = {}
): Promise<BatchProcessResult<TOutput>> {
  const {
    batchSize = 20,
    maxBatchDuration = 25000,
    continueOnError = true,
    onBatchComplete,
    onProgress,
  } = options;

  const startTime = Date.now();
  const batches: BatchResult<TOutput>[] = [];
  let totalProcessed = 0;
  let totalErrors = 0;

  // Diviser en batches
  const batchCount = Math.ceil(items.length / batchSize);

  for (let batchIndex = 0; batchIndex < batchCount; batchIndex++) {
    const batchStart = batchIndex * batchSize;
    const batchEnd = Math.min(batchStart + batchSize, items.length);
    const batchItems = items.slice(batchStart, batchEnd);

    const batchStartTime = Date.now();
    const batchResults: TOutput[] = [];
    const batchErrors: Array<{ index: number; error: string }> = [];

    try {
      // Traiter chaque item du batch
      for (let i = 0; i < batchItems.length; i++) {
        const globalIndex = batchStart + i;
        const item = batchItems[i];

        try {
          // Vérifier le timeout du batch
          const elapsed = Date.now() - batchStartTime;
          if (elapsed > maxBatchDuration) {
            throw new Error(`Batch timeout dépassé (${elapsed}ms > ${maxBatchDuration}ms)`);
          }

          const result = await processor(item, globalIndex);
          batchResults.push(result);
          totalProcessed++;

          // Callback de progression
          if (onProgress) {
            onProgress(totalProcessed, items.length);
          }
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
          batchErrors.push({ index: globalIndex, error: errorMessage });
          totalErrors++;

          // Si continueOnError est false, propager l'erreur
          if (!continueOnError) {
            throw error;
          }
        }
      }

      const batchDuration = Date.now() - batchStartTime;

      const batchResult: BatchResult<TOutput> = {
        batchIndex,
        success: batchErrors.length === 0,
        processed: batchResults.length,
        results: batchResults,
        errors: batchErrors,
        duration: batchDuration,
      };

      batches.push(batchResult);

      // Callback de complétion du batch
      if (onBatchComplete) {
        await onBatchComplete(batchResult);
      }

    } catch (error) {
      const batchDuration = Date.now() - batchStartTime;
      const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';

      const batchResult: BatchResult<TOutput> = {
        batchIndex,
        success: false,
        processed: batchResults.length,
        results: batchResults,
        errors: [
          ...batchErrors,
          { index: batchStart, error: `Batch échoué: ${errorMessage}` },
        ],
        duration: batchDuration,
      };

      batches.push(batchResult);

      // Si continueOnError est false, arrêter le traitement
      if (!continueOnError) {
        break;
      }
    }
  }

  const totalDuration = Date.now() - startTime;

  return {
    success: totalErrors === 0,
    totalProcessed,
    totalErrors,
    batches,
    totalDuration,
  };
}

/**
 * Traite un tableau d'items en batches avec une fonction qui retourne un tableau de résultats
 * Utile quand le processor traite plusieurs items à la fois (ex: bulk insert)
 * 
 * @param items - Tableau d'items à traiter
 * @param processor - Fonction qui traite un batch d'items et retourne un tableau de résultats
 * @param options - Options de configuration
 * @returns Résultat global du traitement
 * 
 * @example
 * ```typescript
 * const reservations = [...];
 * const result = await processBatchBulk(
 *   reservations,
 *   async (batch) => await bulkInsertReservations(batch),
 *   { batchSize: 50 }
 * );
 * ```
 */
export async function processBatchBulk<TInput, TOutput>(
  items: TInput[],
  processor: (batch: TInput[], batchIndex: number) => Promise<TOutput[]>,
  options: BatchProcessorOptions = {}
): Promise<BatchProcessResult<TOutput>> {
  const {
    batchSize = 20,
    maxBatchDuration = 25000,
    continueOnError = true,
    onBatchComplete,
    onProgress,
  } = options;

  const startTime = Date.now();
  const batches: BatchResult<TOutput>[] = [];
  let totalProcessed = 0;
  let totalErrors = 0;

  // Diviser en batches
  const batchCount = Math.ceil(items.length / batchSize);

  for (let batchIndex = 0; batchIndex < batchCount; batchIndex++) {
    const batchStart = batchIndex * batchSize;
    const batchEnd = Math.min(batchStart + batchSize, items.length);
    const batchItems = items.slice(batchStart, batchEnd);

    const batchStartTime = Date.now();

    try {
      // Vérifier le timeout avant de commencer
      const elapsed = Date.now() - startTime;
      if (elapsed > maxBatchDuration * batchIndex) {
        throw new Error(`Timeout global dépassé`);
      }

      const batchResults = await processor(batchItems, batchIndex);
      const batchDuration = Date.now() - batchStartTime;

      totalProcessed += batchResults.length;

      const batchResult: BatchResult<TOutput> = {
        batchIndex,
        success: true,
        processed: batchResults.length,
        results: batchResults,
        errors: [],
        duration: batchDuration,
      };

      batches.push(batchResult);

      // Callback de progression
      if (onProgress) {
        onProgress(totalProcessed, items.length);
      }

      // Callback de complétion du batch
      if (onBatchComplete) {
        await onBatchComplete(batchResult);
      }

    } catch (error) {
      const batchDuration = Date.now() - batchStartTime;
      const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';

      totalErrors += batchItems.length;

      const batchResult: BatchResult<TOutput> = {
        batchIndex,
        success: false,
        processed: 0,
        results: [],
        errors: [{ index: batchStart, error: `Batch échoué: ${errorMessage}` }],
        duration: batchDuration,
      };

      batches.push(batchResult);

      // Si continueOnError est false, arrêter le traitement
      if (!continueOnError) {
        break;
      }
    }
  }

  const totalDuration = Date.now() - startTime;

  return {
    success: totalErrors === 0,
    totalProcessed,
    totalErrors,
    batches,
    totalDuration,
  };
}

/**
 * Calcule les métriques d'un résultat de batch processing
 */
export function getBatchMetrics<T>(result: BatchProcessResult<T>) {
  const successfulBatches = result.batches.filter(b => b.success).length;
  const failedBatches = result.batches.filter(b => !b.success).length;
  const avgBatchDuration = result.batches.length > 0
    ? result.batches.reduce((sum, b) => sum + b.duration, 0) / result.batches.length
    : 0;

  return {
    totalBatches: result.batches.length,
    successfulBatches,
    failedBatches,
    successRate: result.batches.length > 0
      ? (successfulBatches / result.batches.length) * 100
      : 0,
    totalProcessed: result.totalProcessed,
    totalErrors: result.totalErrors,
    totalDuration: result.totalDuration,
    avgBatchDuration: Math.round(avgBatchDuration),
  };
}
