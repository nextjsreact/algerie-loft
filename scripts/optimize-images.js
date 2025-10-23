const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

// Configuration for image optimization
const OPTIMIZATION_CONFIG = {
  jpeg: {
    quality: 85,
    progressive: true,
    mozjpeg: true
  },
  png: {
    quality: 90,
    compressionLevel: 9,
    progressive: true
  },
  webp: {
    quality: 85,
    effort: 6
  },
  avif: {
    quality: 80,
    effort: 4
  }
};

// Supported image formats
const SUPPORTED_FORMATS = ['.jpg', '.jpeg', '.png', '.gif', '.tiff', '.bmp'];

// Output formats to generate
const OUTPUT_FORMATS = ['webp', 'avif'];

class ImageOptimizer {
  constructor(inputDir = 'public', outputDir = 'public/optimized') {
    this.inputDir = inputDir;
    this.outputDir = outputDir;
    this.stats = {
      processed: 0,
      originalSize: 0,
      optimizedSize: 0,
      errors: []
    };
  }

  async optimize() {
    console.log('🖼️  Starting image optimization...');
    
    // Ensure output directory exists
    if (!fs.existsSync(this.outputDir)) {
      fs.mkdirSync(this.outputDir, { recursive: true });
    }

    // Find all images
    const images = await this.findImages(this.inputDir);
    console.log(`Found ${images.length} images to optimize`);

    // Process images
    for (const imagePath of images) {
      await this.processImage(imagePath);
    }

    // Print statistics
    this.printStats();
  }

  async findImages(dir, images = []) {
    const files = fs.readdirSync(dir);

    for (const file of files) {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);

      if (stat.isDirectory()) {
        // Skip node_modules and .next directories
        if (!file.startsWith('.') && file !== 'node_modules' && file !== 'optimized') {
          await this.findImages(filePath, images);
        }
      } else {
        const ext = path.extname(file).toLowerCase();
        if (SUPPORTED_FORMATS.includes(ext)) {
          images.push(filePath);
        }
      }
    }

    return images;
  }

  async processImage(imagePath) {
    try {
      const relativePath = path.relative(this.inputDir, imagePath);
      const parsedPath = path.parse(relativePath);
      const originalSize = fs.statSync(imagePath).size;
      
      console.log(`Processing: ${relativePath}`);

      // Create output directory structure
      const outputSubDir = path.join(this.outputDir, parsedPath.dir);
      if (!fs.existsSync(outputSubDir)) {
        fs.mkdirSync(outputSubDir, { recursive: true });
      }

      // Load image with Sharp
      const image = sharp(imagePath);
      const metadata = await image.metadata();

      // Optimize original format
      await this.optimizeOriginalFormat(image, imagePath, outputSubDir, parsedPath, metadata);

      // Generate modern formats
      for (const format of OUTPUT_FORMATS) {
        await this.generateModernFormat(image, outputSubDir, parsedPath, format, metadata);
      }

      // Generate responsive sizes
      await this.generateResponsiveSizes(image, outputSubDir, parsedPath, metadata);

      this.stats.processed++;
      this.stats.originalSize += originalSize;

    } catch (error) {
      console.error(`Error processing ${imagePath}:`, error.message);
      this.stats.errors.push({ path: imagePath, error: error.message });
    }
  }

  async optimizeOriginalFormat(image, originalPath, outputDir, parsedPath, metadata) {
    const format = metadata.format;
    const outputPath = path.join(outputDir, `${parsedPath.name}${parsedPath.ext}`);

    let optimized;
    
    switch (format) {
      case 'jpeg':
      case 'jpg':
        optimized = image.jpeg(OPTIMIZATION_CONFIG.jpeg);
        break;
      case 'png':
        optimized = image.png(OPTIMIZATION_CONFIG.png);
        break;
      case 'gif':
        // For GIFs, just copy as-is (Sharp doesn't optimize animated GIFs well)
        fs.copyFileSync(originalPath, outputPath);
        return;
      default:
        optimized = image;
    }

    await optimized.toFile(outputPath);
    
    const optimizedSize = fs.statSync(outputPath).size;
    this.stats.optimizedSize += optimizedSize;
    
    const savings = ((fs.statSync(originalPath).size - optimizedSize) / fs.statSync(originalPath).size * 100).toFixed(1);
    console.log(`  ✅ ${parsedPath.name}${parsedPath.ext}: ${savings}% smaller`);
  }

  async generateModernFormat(image, outputDir, parsedPath, format, metadata) {
    const outputPath = path.join(outputDir, `${parsedPath.name}.${format}`);
    
    let converted;
    
    switch (format) {
      case 'webp':
        converted = image.webp(OPTIMIZATION_CONFIG.webp);
        break;
      case 'avif':
        converted = image.avif(OPTIMIZATION_CONFIG.avif);
        break;
      default:
        return;
    }

    await converted.toFile(outputPath);
    
    const convertedSize = fs.statSync(outputPath).size;
    console.log(`  📦 Generated ${format.toUpperCase()}: ${this.formatBytes(convertedSize)}`);
  }

  async generateResponsiveSizes(image, outputDir, parsedPath, metadata) {
    const { width, height } = metadata;
    
    // Common responsive breakpoints
    const breakpoints = [
      { suffix: '-sm', width: 640 },
      { suffix: '-md', width: 768 },
      { suffix: '-lg', width: 1024 },
      { suffix: '-xl', width: 1280 }
    ];

    for (const breakpoint of breakpoints) {
      if (width && width > breakpoint.width) {
        const responsiveHeight = Math.round((height || 0) * (breakpoint.width / width));
        
        // Generate for original format
        const originalPath = path.join(outputDir, `${parsedPath.name}${breakpoint.suffix}${parsedPath.ext}`);
        await image
          .resize(breakpoint.width, responsiveHeight)
          .toFile(originalPath);

        // Generate for modern formats
        for (const format of OUTPUT_FORMATS) {
          const modernPath = path.join(outputDir, `${parsedPath.name}${breakpoint.suffix}.${format}`);
          
          let converted;
          switch (format) {
            case 'webp':
              converted = image.resize(breakpoint.width, responsiveHeight).webp(OPTIMIZATION_CONFIG.webp);
              break;
            case 'avif':
              converted = image.resize(breakpoint.width, responsiveHeight).avif(OPTIMIZATION_CONFIG.avif);
              break;
          }
          
          if (converted) {
            await converted.toFile(modernPath);
          }
        }
        
        console.log(`  📱 Generated ${breakpoint.width}w variant`);
      }
    }
  }

  formatBytes(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  printStats() {
    console.log('\n📊 Optimization Results:');
    console.log('========================');
    console.log(`Images processed: ${this.stats.processed}`);
    console.log(`Original total size: ${this.formatBytes(this.stats.originalSize)}`);
    console.log(`Optimized total size: ${this.formatBytes(this.stats.optimizedSize)}`);
    
    if (this.stats.originalSize > 0) {
      const totalSavings = ((this.stats.originalSize - this.stats.optimizedSize) / this.stats.originalSize * 100).toFixed(1);
      console.log(`Total savings: ${totalSavings}%`);
    }
    
    if (this.stats.errors.length > 0) {
      console.log(`\n❌ Errors: ${this.stats.errors.length}`);
      this.stats.errors.forEach(error => {
        console.log(`  ${error.path}: ${error.error}`);
      });
    }
    
    console.log('\n💡 Next steps:');
    console.log('- Update your components to use the optimized images');
    console.log('- Implement responsive image loading with srcset');
    console.log('- Use modern formats (WebP/AVIF) with fallbacks');
    console.log('- Consider implementing lazy loading for non-critical images');
  }
}

// Generate picture element helper
function generatePictureElement(imageName, alt, className = '', sizes = '100vw') {
  const baseName = path.parse(imageName).name;
  const ext = path.parse(imageName).ext;
  
  return `
<picture className="${className}">
  <source
    srcSet="
      /optimized/${baseName}-sm.avif 640w,
      /optimized/${baseName}-md.avif 768w,
      /optimized/${baseName}-lg.avif 1024w,
      /optimized/${baseName}-xl.avif 1280w,
      /optimized/${baseName}.avif
    "
    sizes="${sizes}"
    type="image/avif"
  />
  <source
    srcSet="
      /optimized/${baseName}-sm.webp 640w,
      /optimized/${baseName}-md.webp 768w,
      /optimized/${baseName}-lg.webp 1024w,
      /optimized/${baseName}-xl.webp 1280w,
      /optimized/${baseName}.webp
    "
    sizes="${sizes}"
    type="image/webp"
  />
  <img
    src="/optimized/${baseName}${ext}"
    srcSet="
      /optimized/${baseName}-sm${ext} 640w,
      /optimized/${baseName}-md${ext} 768w,
      /optimized/${baseName}-lg${ext} 1024w,
      /optimized/${baseName}-xl${ext} 1280w,
      /optimized/${baseName}${ext}
    "
    sizes="${sizes}"
    alt="${alt}"
    loading="lazy"
    decoding="async"
  />
</picture>`.trim();
}

// CLI interface
if (require.main === module) {
  const args = process.argv.slice(2);
  const inputDir = args[0] || 'public';
  const outputDir = args[1] || 'public/optimized';
  
  const optimizer = new ImageOptimizer(inputDir, outputDir);
  
  optimizer.optimize().catch(error => {
    console.error('Optimization failed:', error);
    process.exit(1);
  });
}

module.exports = { ImageOptimizer, generatePictureElement };