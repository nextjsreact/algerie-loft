import { createClient as createSupabaseClient } from '@supabase/supabase-js';

export interface StorageBucketInfo {
  name: string;
  public: boolean;
  exists: boolean;
  error?: string;
  fileCount?: number;
  totalSize?: number;
}

export interface FileUploadTestResult {
  bucket: string;
  fileName: string;
  success: boolean;
  error?: string;
  uploadTime?: number;
  fileSize?: number;
  publicUrl?: string;
  signedUrl?: string;
}

export interface ImageOptimizationResult {
  originalUrl: string;
  optimizedUrl: string;
  success: boolean;
  error?: string;
  originalSize?: number;
  optimizedSize?: number;
  compressionRatio?: number;
}

export interface StorageValidationReport {
  timestamp: Date;
  overallStatus: 'success' | 'warning' | 'failure';
  buckets: StorageBucketInfo[];
  uploadTests: FileUploadTestResult[];
  imageOptimization: ImageOptimizationResult[];
  recommendations: string[];
}

export class SupabaseStorageValidator {
  /**
   * Create a Supabase client for testing
   */
  private createClient(useServiceRole = false) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = useServiceRole 
      ? process.env.SUPABASE_SERVICE_ROLE_KEY 
      : process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Missing Supabase environment variables');
    }

    return createSupabaseClient(supabaseUrl, supabaseKey);
  }

  private async measureLatency<T>(operation: () => Promise<T>): Promise<{ result: T; latency: number }> {
    const start = performance.now();
    const result = await operation();
    const latency = performance.now() - start;
    return { result, latency };
  }

  /**
   * Validate storage bucket configurations
   */
  async validateStorageBuckets(): Promise<StorageBucketInfo[]> {
    const results: StorageBucketInfo[] = [];
    const supabase = this.createClient(true); // Use service role for full access

    // Expected buckets for the Loft Algérie application
    const expectedBuckets = [
      { name: 'loft-images', public: true },
      { name: 'user-avatars', public: true },
      { name: 'documents', public: false },
      { name: 'reports', public: false }
    ];

    for (const expectedBucket of expectedBuckets) {
      try {
        // Check if bucket exists
        const { data: buckets, error: listError } = await supabase.storage.listBuckets();
        
        if (listError) {
          results.push({
            name: expectedBucket.name,
            public: expectedBucket.public,
            exists: false,
            error: `Failed to list buckets: ${listError.message}`
          });
          continue;
        }

        const bucket = buckets?.find(b => b.name === expectedBucket.name);
        
        if (!bucket) {
          results.push({
            name: expectedBucket.name,
            public: expectedBucket.public,
            exists: false,
            error: 'Bucket does not exist'
          });
          continue;
        }

        // Get bucket details
        try {
          const { data: files, error: filesError } = await supabase.storage
            .from(expectedBucket.name)
            .list('', { limit: 100 });

          let fileCount = 0;
          let totalSize = 0;

          if (!filesError && files) {
            fileCount = files.length;
            // Note: Supabase doesn't provide file sizes in list operation
            // This would require individual file metadata calls
          }

          results.push({
            name: expectedBucket.name,
            public: bucket.public,
            exists: true,
            fileCount,
            totalSize
          });
        } catch (error) {
          results.push({
            name: expectedBucket.name,
            public: bucket.public,
            exists: true,
            error: error instanceof Error ? error.message : 'Unknown error getting bucket details'
          });
        }
      } catch (error) {
        results.push({
          name: expectedBucket.name,
          public: expectedBucket.public,
          exists: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    return results;
  }

  /**
   * Test file upload functionality
   */
  async testFileUploads(): Promise<FileUploadTestResult[]> {
    const results: FileUploadTestResult[] = [];
    const supabase = this.createClient(true); // Use service role

    // Create test image data (1x1 pixel PNG)
    const testImageData = new Uint8Array([
      0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, 0x00, 0x00, 0x00, 0x0D,
      0x49, 0x48, 0x44, 0x52, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
      0x08, 0x02, 0x00, 0x00, 0x00, 0x90, 0x77, 0x53, 0xDE, 0x00, 0x00, 0x00,
      0x0C, 0x49, 0x44, 0x41, 0x54, 0x08, 0x57, 0x63, 0xF8, 0x0F, 0x00, 0x00,
      0x01, 0x00, 0x01, 0x5C, 0xC2, 0x8A, 0x8E, 0x00, 0x00, 0x00, 0x00, 0x49,
      0x45, 0x4E, 0x44, 0xAE, 0x42, 0x60, 0x82
    ]);

    const testFile = new File([testImageData], 'test-migration-image.png', { type: 'image/png' });

    // Test upload to loft-images bucket
    const buckets = ['loft-images', 'user-avatars'];
    
    for (const bucketName of buckets) {
      const fileName = `migration-test-${Date.now()}.png`;
      
      try {
        const { result: uploadResult, latency } = await this.measureLatency(async () => {
          return await supabase.storage
            .from(bucketName)
            .upload(fileName, testFile, {
              cacheControl: '3600',
              upsert: false
            });
        });

        if (uploadResult.error) {
          results.push({
            bucket: bucketName,
            fileName,
            success: false,
            error: uploadResult.error.message,
            uploadTime: latency,
            fileSize: testFile.size
          });
          continue;
        }

        // Test getting public URL
        let publicUrl: string | undefined;
        let signedUrl: string | undefined;

        try {
          const { data: publicUrlData } = supabase.storage
            .from(bucketName)
            .getPublicUrl(fileName);
          publicUrl = publicUrlData.publicUrl;
        } catch (error) {
          // Public URL might not be available for private buckets
        }

        // Test getting signed URL
        try {
          const { data: signedUrlData, error: signedUrlError } = await supabase.storage
            .from(bucketName)
            .createSignedUrl(fileName, 3600);
          
          if (!signedUrlError) {
            signedUrl = signedUrlData.signedUrl;
          }
        } catch (error) {
          // Signed URL generation might fail
        }

        results.push({
          bucket: bucketName,
          fileName,
          success: true,
          uploadTime: latency,
          fileSize: testFile.size,
          publicUrl,
          signedUrl
        });

        // Clean up test file
        await supabase.storage.from(bucketName).remove([fileName]);

      } catch (error) {
        results.push({
          bucket: bucketName,
          fileName,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
          fileSize: testFile.size
        });
      }
    }

    return results;
  }

  /**
   * Test image URL generation and optimization
   */
  async testImageOptimization(): Promise<ImageOptimizationResult[]> {
    const results: ImageOptimizationResult[] = [];
    const supabase = this.createClient();

    // Test with existing loft images if any
    try {
      const { data: files, error } = await supabase.storage
        .from('loft-images')
        .list('', { limit: 5 });

      if (error || !files || files.length === 0) {
        results.push({
          originalUrl: '',
          optimizedUrl: '',
          success: false,
          error: 'No test images available in loft-images bucket'
        });
        return results;
      }

      for (const file of files.slice(0, 3)) { // Test first 3 files
        try {
          // Get original URL
          const { data: originalUrlData } = supabase.storage
            .from('loft-images')
            .getPublicUrl(file.name);

          const originalUrl = originalUrlData.publicUrl;

          // Test different optimization parameters
          const optimizations = [
            { width: 800, height: 600, quality: 80 },
            { width: 400, height: 300, quality: 70 },
            { width: 200, height: 150, quality: 60 }
          ];

          for (const opt of optimizations) {
            const optimizedUrl = `${originalUrl}?width=${opt.width}&height=${opt.height}&quality=${opt.quality}`;

            // Test if the optimized URL is accessible
            try {
              const response = await fetch(optimizedUrl, { method: 'HEAD' });
              
              results.push({
                originalUrl,
                optimizedUrl,
                success: response.ok,
                error: response.ok ? undefined : `HTTP ${response.status}: ${response.statusText}`,
                originalSize: undefined, // Would need separate API call
                optimizedSize: undefined, // Would need separate API call
                compressionRatio: undefined
              });
            } catch (fetchError) {
              results.push({
                originalUrl,
                optimizedUrl,
                success: false,
                error: fetchError instanceof Error ? fetchError.message : 'Fetch error'
              });
            }
          }
        } catch (error) {
          results.push({
            originalUrl: '',
            optimizedUrl: '',
            success: false,
            error: `Failed to process file ${file.name}: ${error instanceof Error ? error.message : 'Unknown error'}`
          });
        }
      }
    } catch (error) {
      results.push({
        originalUrl: '',
        optimizedUrl: '',
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }

    return results;
  }

  /**
   * Generate comprehensive storage validation report
   */
  async generateValidationReport(): Promise<StorageValidationReport> {
    console.log('🗄️ Starting Supabase storage validation...');

    const [buckets, uploadTests, imageOptimization] = await Promise.all([
      this.validateStorageBuckets(),
      this.testFileUploads(),
      this.testImageOptimization()
    ]);

    const recommendations: string[] = [];
    let overallStatus: 'success' | 'warning' | 'failure' = 'success';

    // Analyze bucket results
    const missingBuckets = buckets.filter(b => !b.exists);
    if (missingBuckets.length > 0) {
      overallStatus = 'failure';
      recommendations.push(`❌ ${missingBuckets.length} required storage bucket(s) missing`);
      missingBuckets.forEach(bucket => {
        recommendations.push(`  - Create bucket: ${bucket.name} (public: ${bucket.public})`);
      });
    }

    const bucketErrors = buckets.filter(b => b.exists && b.error);
    if (bucketErrors.length > 0) {
      if (overallStatus !== 'failure') overallStatus = 'warning';
      recommendations.push(`⚠️ ${bucketErrors.length} bucket(s) have configuration issues`);
      bucketErrors.forEach(bucket => {
        recommendations.push(`  - ${bucket.name}: ${bucket.error}`);
      });
    }

    // Analyze upload test results
    const failedUploads = uploadTests.filter(t => !t.success);
    if (failedUploads.length > 0) {
      overallStatus = 'failure';
      recommendations.push(`❌ ${failedUploads.length} file upload test(s) failed`);
      failedUploads.forEach(test => {
        recommendations.push(`  - ${test.bucket}/${test.fileName}: ${test.error}`);
      });
    }

    // Analyze image optimization results
    const failedOptimizations = imageOptimization.filter(i => !i.success);
    if (failedOptimizations.length > 0) {
      if (overallStatus !== 'failure') overallStatus = 'warning';
      recommendations.push(`⚠️ ${failedOptimizations.length} image optimization test(s) failed`);
    }

    // Performance recommendations
    const slowUploads = uploadTests.filter(t => t.uploadTime && t.uploadTime > 5000);
    if (slowUploads.length > 0) {
      if (overallStatus === 'success') overallStatus = 'warning';
      recommendations.push(`🐌 ${slowUploads.length} upload(s) are slow (>5s)`);
    }

    if (overallStatus === 'success') {
      recommendations.push('✅ All storage buckets are properly configured');
      recommendations.push('✅ File upload functionality is working correctly');
      recommendations.push('✅ Image URL generation and optimization are functional');
      recommendations.push('✅ Storage performance is within acceptable limits');
    }

    return {
      timestamp: new Date(),
      overallStatus,
      buckets,
      uploadTests,
      imageOptimization,
      recommendations
    };
  }
}

export const supabaseStorageValidator = new SupabaseStorageValidator();