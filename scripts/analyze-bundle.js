const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function analyzeBundle() {
  log('🔍 Analyzing bundle size and performance...', 'cyan');
  
  try {
    // Build the project first
    log('📦 Building project...', 'yellow');
    execSync('npm run build', { stdio: 'inherit' });
    
    // Analyze .next directory
    const nextDir = path.join(process.cwd(), '.next');
    const staticDir = path.join(nextDir, 'static');
    
    if (!fs.existsSync(nextDir)) {
      log('❌ .next directory not found. Please run npm run build first.', 'red');
      return;
    }
    
    log('\n📊 Bundle Analysis Results:', 'bright');
    log('=' .repeat(50), 'blue');
    
    // Analyze JavaScript bundles
    analyzeJavaScriptBundles(staticDir);
    
    // Analyze CSS files
    analyzeCSSFiles(staticDir);
    
    // Analyze images and assets
    analyzeAssets(staticDir);
    
    // Generate recommendations
    generateRecommendations();
    
    log('\n✅ Analysis complete!', 'green');
    
  } catch (error) {
    log(`❌ Error during analysis: ${error.message}`, 'red');
  }
}

function analyzeJavaScriptBundles(staticDir) {
  log('\n📄 JavaScript Bundles:', 'magenta');
  
  const chunksDir = path.join(staticDir, 'chunks');
  if (!fs.existsSync(chunksDir)) {
    log('No chunks directory found', 'yellow');
    return;
  }
  
  const jsFiles = [];
  
  function scanDirectory(dir, prefix = '') {
    const files = fs.readdirSync(dir);
    
    files.forEach(file => {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);
      
      if (stat.isDirectory()) {
        scanDirectory(filePath, `${prefix}${file}/`);
      } else if (file.endsWith('.js')) {
        jsFiles.push({
          name: `${prefix}${file}`,
          size: stat.size,
          path: filePath
        });
      }
    });
  }
  
  scanDirectory(chunksDir);
  
  // Sort by size (largest first)
  jsFiles.sort((a, b) => b.size - a.size);
  
  let totalJSSize = 0;
  jsFiles.forEach(file => {
    totalJSSize += file.size;
    const sizeColor = file.size > 500000 ? 'red' : file.size > 100000 ? 'yellow' : 'green';
    log(`  ${file.name}: ${formatBytes(file.size)}`, sizeColor);
  });
  
  log(`\n  Total JS Size: ${formatBytes(totalJSSize)}`, 'bright');
  
  // Identify large bundles
  const largeBundles = jsFiles.filter(file => file.size > 500000);
  if (largeBundles.length > 0) {
    log('\n⚠️  Large bundles detected (>500KB):', 'yellow');
    largeBundles.forEach(bundle => {
      log(`    ${bundle.name}: ${formatBytes(bundle.size)}`, 'red');
    });
  }
}

function analyzeCSSFiles(staticDir) {
  log('\n🎨 CSS Files:', 'magenta');
  
  const cssFiles = [];
  
  function scanForCSS(dir, prefix = '') {
    if (!fs.existsSync(dir)) return;
    
    const files = fs.readdirSync(dir);
    
    files.forEach(file => {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);
      
      if (stat.isDirectory()) {
        scanForCSS(filePath, `${prefix}${file}/`);
      } else if (file.endsWith('.css')) {
        cssFiles.push({
          name: `${prefix}${file}`,
          size: stat.size
        });
      }
    });
  }
  
  scanForCSS(staticDir);
  
  if (cssFiles.length === 0) {
    log('  No CSS files found', 'yellow');
    return;
  }
  
  cssFiles.sort((a, b) => b.size - a.size);
  
  let totalCSSSize = 0;
  cssFiles.forEach(file => {
    totalCSSSize += file.size;
    log(`  ${file.name}: ${formatBytes(file.size)}`, 'green');
  });
  
  log(`\n  Total CSS Size: ${formatBytes(totalCSSSize)}`, 'bright');
}

function analyzeAssets(staticDir) {
  log('\n🖼️  Static Assets:', 'magenta');
  
  const assetFiles = [];
  const mediaDir = path.join(staticDir, 'media');
  
  function scanForAssets(dir, prefix = '') {
    if (!fs.existsSync(dir)) return;
    
    const files = fs.readdirSync(dir);
    
    files.forEach(file => {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);
      
      if (stat.isDirectory()) {
        scanForAssets(filePath, `${prefix}${file}/`);
      } else if (/\\.(png|jpg|jpeg|gif|svg|webp|ico|woff|woff2|ttf|eot)$/i.test(file)) {
        assetFiles.push({
          name: `${prefix}${file}`,
          size: stat.size,
          type: path.extname(file).toLowerCase()
        });
      }
    });
  }
  
  scanForAssets(mediaDir);
  scanForAssets(path.join(process.cwd(), 'public'));
  
  if (assetFiles.length === 0) {
    log('  No assets found', 'yellow');
    return;
  }
  
  // Group by type
  const assetsByType = {};
  assetFiles.forEach(asset => {
    if (!assetsByType[asset.type]) {
      assetsByType[asset.type] = [];
    }
    assetsByType[asset.type].push(asset);
  });
  
  Object.keys(assetsByType).forEach(type => {
    const assets = assetsByType[type];
    const totalSize = assets.reduce((sum, asset) => sum + asset.size, 0);
    log(`\n  ${type.toUpperCase()} files (${assets.length}): ${formatBytes(totalSize)}`, 'cyan');
    
    // Show largest files of this type
    assets.sort((a, b) => b.size - a.size);
    assets.slice(0, 3).forEach(asset => {
      const sizeColor = asset.size > 1000000 ? 'red' : asset.size > 100000 ? 'yellow' : 'green';
      log(`    ${asset.name}: ${formatBytes(asset.size)}`, sizeColor);
    });
  });
}

function generateRecommendations() {
  log('\n💡 Performance Recommendations:', 'bright');
  log('=' .repeat(50), 'blue');
  
  const recommendations = [
    '🔧 Enable compression (Gzip/Brotli) in your deployment',
    '📦 Consider code splitting for large components',
    '🖼️  Optimize images using WebP/AVIF formats',
    '🗜️  Minify and compress CSS/JS files',
    '📱 Implement lazy loading for non-critical components',
    '🔄 Use dynamic imports for route-based code splitting',
    '💾 Implement proper caching strategies',
    '🎯 Remove unused dependencies and code',
    '📊 Monitor bundle size in CI/CD pipeline',
    '⚡ Consider using a CDN for static assets'
  ];
  
  recommendations.forEach(rec => {
    log(`  ${rec}`, 'green');
  });
  
  log('\n📈 Next Steps:', 'yellow');
  log('  1. Run `npm run build` regularly to monitor bundle size', 'cyan');
  log('  2. Use webpack-bundle-analyzer for detailed analysis', 'cyan');
  log('  3. Implement performance monitoring in production', 'cyan');
  log('  4. Set up bundle size budgets in your CI/CD', 'cyan');
}

// Run the analysis
if (require.main === module) {
  analyzeBundle();
}

module.exports = { analyzeBundle };