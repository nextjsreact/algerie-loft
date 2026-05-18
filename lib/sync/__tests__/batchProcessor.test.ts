/**
 * Tests pour Batch Processor
 */

import { describe, it, expect, vi } from 'vitest';
import {
  processBatch,
  processBatchBulk,
  getBatchMetrics,
} from '../batchProcessor';

describe('batchProcessor', () => {
  describe('processBatch', () => {
    it('devrait traiter tous les items en batches', async () => {
      const items = Array.from({ length: 50 }, (_, i) => i);
      const processor = vi.fn(async (item: number) => item * 2);

      const result = await processBatch(items, processor, {
        batchSize: 20,
      });

      expect(result.success).toBe(true);
      expect(result.totalProcessed).toBe(50);
      expect(result.totalErrors).toBe(0);
      expect(result.batches).toHaveLength(3); // 20 + 20 + 10
      expect(processor).toHaveBeenCalledTimes(50);
    });

    it('devrait respecter la taille des batches', async () => {
      const items = Array.from({ length: 85 }, (_, i) => i);
      const processor = vi.fn(async (item: number) => item);

      const result = await processBatch(items, processor, {
        batchSize: 20,
      });

      expect(result.batches).toHaveLength(5); // 20 + 20 + 20 + 20 + 5
      expect(result.batches[0].processed).toBe(20);
      expect(result.batches[1].processed).toBe(20);
      expect(result.batches[2].processed).toBe(20);
      expect(result.batches[3].processed).toBe(20);
      expect(result.batches[4].processed).toBe(5);
    });

    it('devrait continuer après une erreur si continueOnError=true', async () => {
      const items = Array.from({ length: 30 }, (_, i) => i);
      const processor = vi.fn(async (item: number) => {
        if (item === 15) throw new Error('Test error');
        return item;
      });

      const result = await processBatch(items, processor, {
        batchSize: 10,
        continueOnError: true,
      });

      expect(result.success).toBe(false);
      expect(result.totalProcessed).toBe(29); // 30 - 1 erreur
      expect(result.totalErrors).toBe(1);
      expect(result.batches).toHaveLength(3);
    });

    it('devrait arrêter après une erreur si continueOnError=false', async () => {
      const items = Array.from({ length: 30 }, (_, i) => i);
      const processor = vi.fn(async (item: number) => {
        if (item === 15) throw new Error('Test error');
        return item;
      });

      const result = await processBatch(items, processor, {
        batchSize: 10,
        continueOnError: false,
      });

      expect(result.success).toBe(false);
      expect(result.totalProcessed).toBe(15);
      expect(result.batches).toHaveLength(2); // S'arrête au 2ème batch
    });

    it('devrait appeler onProgress à chaque item traité', async () => {
      const items = Array.from({ length: 25 }, (_, i) => i);
      const processor = vi.fn(async (item: number) => item);
      const onProgress = vi.fn();

      await processBatch(items, processor, {
        batchSize: 10,
        onProgress,
      });

      expect(onProgress).toHaveBeenCalledTimes(25);
      expect(onProgress).toHaveBeenLastCalledWith(25, 25);
    });

    it('devrait appeler onBatchComplete après chaque batch', async () => {
      const items = Array.from({ length: 25 }, (_, i) => i);
      const processor = vi.fn(async (item: number) => item);
      const onBatchComplete = vi.fn();

      await processBatch(items, processor, {
        batchSize: 10,
        onBatchComplete,
      });

      expect(onBatchComplete).toHaveBeenCalledTimes(3); // 3 batches
      expect(onBatchComplete.mock.calls[0][0]).toMatchObject({
        batchIndex: 0,
        success: true,
        processed: 10,
      });
    });

    it('devrait respecter maxBatchDuration', async () => {
      const items = Array.from({ length: 10 }, (_, i) => i);
      const processor = vi.fn(async (item: number) => {
        // Simuler un traitement lent
        await new Promise(resolve => setTimeout(resolve, 100));
        return item;
      });

      const result = await processBatch(items, processor, {
        batchSize: 10,
        maxBatchDuration: 500, // 500ms max
      });

      // Devrait échouer car 10 items * 100ms = 1000ms > 500ms
      expect(result.success).toBe(false);
      expect(result.batches[0].errors.length).toBeGreaterThan(0);
    });

    it('devrait calculer correctement la durée', async () => {
      const items = Array.from({ length: 10 }, (_, i) => i);
      const processor = vi.fn(async (item: number) => {
        await new Promise(resolve => setTimeout(resolve, 10));
        return item;
      });

      const result = await processBatch(items, processor, {
        batchSize: 5,
      });

      expect(result.totalDuration).toBeGreaterThan(0);
      expect(result.batches[0].duration).toBeGreaterThan(0);
    });
  });

  describe('processBatchBulk', () => {
    it('devrait traiter des batches entiers', async () => {
      const items = Array.from({ length: 50 }, (_, i) => i);
      const processor = vi.fn(async (batch: number[]) => {
        return batch.map(item => item * 2);
      });

      const result = await processBatchBulk(items, processor, {
        batchSize: 20,
      });

      expect(result.success).toBe(true);
      expect(result.totalProcessed).toBe(50);
      expect(processor).toHaveBeenCalledTimes(3); // 3 batches
    });

    it('devrait passer le bon batch à chaque appel', async () => {
      const items = Array.from({ length: 25 }, (_, i) => i);
      const processor = vi.fn(async (batch: number[]) => batch);

      await processBatchBulk(items, processor, {
        batchSize: 10,
      });

      expect(processor).toHaveBeenCalledTimes(3);
      expect(processor.mock.calls[0][0]).toHaveLength(10);
      expect(processor.mock.calls[1][0]).toHaveLength(10);
      expect(processor.mock.calls[2][0]).toHaveLength(5);
    });

    it('devrait gérer les erreurs de batch', async () => {
      const items = Array.from({ length: 30 }, (_, i) => i);
      const processor = vi.fn(async (batch: number[], batchIndex: number) => {
        if (batchIndex === 1) throw new Error('Batch error');
        return batch;
      });

      const result = await processBatchBulk(items, processor, {
        batchSize: 10,
        continueOnError: true,
      });

      expect(result.success).toBe(false);
      expect(result.totalProcessed).toBe(20); // Batch 0 et 2 réussis
      expect(result.totalErrors).toBe(10); // Batch 1 échoué
    });
  });

  describe('getBatchMetrics', () => {
    it('devrait calculer les métriques correctement', async () => {
      const items = Array.from({ length: 50 }, (_, i) => i);
      const processor = vi.fn(async (item: number) => {
        if (item === 25) throw new Error('Test error');
        return item;
      });

      const result = await processBatch(items, processor, {
        batchSize: 20,
        continueOnError: true,
      });

      const metrics = getBatchMetrics(result);

      expect(metrics.totalBatches).toBe(3);
      expect(metrics.successfulBatches).toBe(2);
      expect(metrics.failedBatches).toBe(1);
      expect(metrics.totalProcessed).toBe(49);
      expect(metrics.totalErrors).toBe(1);
      expect(metrics.successRate).toBeCloseTo(66.67, 1);
      expect(metrics.avgBatchDuration).toBeGreaterThan(0);
    });

    it('devrait gérer un résultat vide', () => {
      const result = {
        success: true,
        totalProcessed: 0,
        totalErrors: 0,
        batches: [],
        totalDuration: 0,
      };

      const metrics = getBatchMetrics(result);

      expect(metrics.totalBatches).toBe(0);
      expect(metrics.successRate).toBe(0);
      expect(metrics.avgBatchDuration).toBe(0);
    });
  });

  describe('Invariant properties', () => {
    it('la somme des items traités dans chaque batch devrait égaler le total', async () => {
      const items = Array.from({ length: 85 }, (_, i) => i);
      const processor = vi.fn(async (item: number) => item);

      const result = await processBatch(items, processor, {
        batchSize: 20,
      });

      const sumProcessed = result.batches.reduce((sum, batch) => sum + batch.processed, 0);
      expect(sumProcessed).toBe(result.totalProcessed);
      expect(sumProcessed).toBe(85);
    });

    it('totalProcessed + totalErrors devrait égaler le nombre d\'items', async () => {
      const items = Array.from({ length: 50 }, (_, i) => i);
      const processor = vi.fn(async (item: number) => {
        if (item % 10 === 0) throw new Error('Test error');
        return item;
      });

      const result = await processBatch(items, processor, {
        batchSize: 20,
        continueOnError: true,
      });

      expect(result.totalProcessed + result.totalErrors).toBe(50);
    });

    it('chaque batch devrait avoir un batchIndex unique et séquentiel', async () => {
      const items = Array.from({ length: 50 }, (_, i) => i);
      const processor = vi.fn(async (item: number) => item);

      const result = await processBatch(items, processor, {
        batchSize: 20,
      });

      result.batches.forEach((batch, index) => {
        expect(batch.batchIndex).toBe(index);
      });
    });
  });
});
