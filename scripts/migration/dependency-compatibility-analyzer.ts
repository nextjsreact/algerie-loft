import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

interface PackageInfo {
  name: string;
  currentVersion: string;
  latestVersion?: string;
  nextjs16Compatible: boolean;
  upgradeRequired: boolean;
  riskLevel: 'low' | 'medium' | 'high';
  notes: string[];
  upgradeCommand?: string;
}

interface CompatibilityReport {
  totalPackages: number;
  compatiblePackages: PackageInfo[];
  incompatiblePackages: PackageInfo[];
  upgradeRequired: PackageInfo[];
  riskAssessment: {
    low: number;
    medium: number;
    high: number;
  };
  recommendations: string[];
}

class DependencyCompatibilityAnalyzer {
  private packageJson: any;
  private knownCompatibility: Record<string, {
    nextjs16Compatible: boolean;
    minVersion?: string;
    riskLevel: 'low' | 'medium' | 'high';
    notes: string[];
    upgradeCommand?: string;
  }> = {
    // Next.js ecosystem
    'next': {
      nextjs16Compatible: true,
      minVersion: '16.0.0',
      riskLevel: 'low',
      notes: ['Already at Next.js 16.1.1 - compatible'],
    },
    'next-intl': {
      nextjs16Compatible: true,
      minVersion: '4.0.0',
      riskLevel: 'low',
      notes: ['Version 4.3.5 is compatible with Next.js 16', 'No breaking changes expected'],
    },
    'next-themes': {
      nextjs16Compatible: true,
      riskLevel: 'low',
      notes: ['Version 0.4.4 is compatible with Next.js 16'],
    },

    // React ecosystem
    'react': {
      nextjs16Compatible: true,
      minVersion: '18.0.0',
      riskLevel: 'low',
      notes: ['React 18 is fully compatible with Next.js 16'],
    },
    'react-dom': {
      nextjs16Compatible: true,
      minVersion: '18.0.0',
      riskLevel: 'low',
      notes: ['React DOM 18 is fully compatible with Next.js 16'],
    },

    // Radix UI packages - all compatible
    '@radix-ui/react-accordion': {
      nextjs16Compatible: true,
      riskLevel: 'low',
      notes: ['Radix UI packages are compatible with Next.js 16'],
    },
    '@radix-ui/react-alert-dialog': {
      nextjs16Compatible: true,
      riskLevel: 'low',
      notes: ['Radix UI packages are compatible with Next.js 16'],
    },
    '@radix-ui/react-aspect-ratio': {
      nextjs16Compatible: true,
      riskLevel: 'low',
      notes: ['Radix UI packages are compatible with Next.js 16'],
    },
    '@radix-ui/react-avatar': {
      nextjs16Compatible: true,
      riskLevel: 'low',
      notes: ['Radix UI packages are compatible with Next.js 16'],
    },
    '@radix-ui/react-checkbox': {
      nextjs16Compatible: true,
      riskLevel: 'low',
      notes: ['Radix UI packages are compatible with Next.js 16'],
    },
    '@radix-ui/react-collapsible': {
      nextjs16Compatible: true,
      riskLevel: 'low',
      notes: ['Radix UI packages are compatible with Next.js 16'],
    },
    '@radix-ui/react-context-menu': {
      nextjs16Compatible: true,
      riskLevel: 'low',
      notes: ['Radix UI packages are compatible with Next.js 16'],
    },
    '@radix-ui/react-dialog': {
      nextjs16Compatible: true,
      riskLevel: 'low',
      notes: ['Radix UI packages are compatible with Next.js 16'],
    },
    '@radix-ui/react-dropdown-menu': {
      nextjs16Compatible: true,
      riskLevel: 'low',
      notes: ['Radix UI packages are compatible with Next.js 16'],
    },
    '@radix-ui/react-hover-card': {
      nextjs16Compatible: true,
      riskLevel: 'low',
      notes: ['Radix UI packages are compatible with Next.js 16'],
    },
    '@radix-ui/react-label': {
      nextjs16Compatible: true,
      riskLevel: 'low',
      notes: ['Radix UI packages are compatible with Next.js 16'],
    },
    '@radix-ui/react-menubar': {
      nextjs16Compatible: true,
      riskLevel: 'low',
      notes: ['Radix UI packages are compatible with Next.js 16'],
    },
    '@radix-ui/react-navigation-menu': {
      nextjs16Compatible: true,
      riskLevel: 'low',
      notes: ['Radix UI packages are compatible with Next.js 16'],
    },
    '@radix-ui/react-popover': {
      nextjs16Compatible: true,
      riskLevel: 'low',
      notes: ['Radix UI packages are compatible with Next.js 16'],
    },
    '@radix-ui/react-progress': {
      nextjs16Compatible: true,
      riskLevel: 'low',
      notes: ['Radix UI packages are compatible with Next.js 16'],
    },
    '@radix-ui/react-radio-group': {
      nextjs16Compatible: true,
      riskLevel: 'low',
      notes: ['Radix UI packages are compatible with Next.js 16'],
    },
    '@radix-ui/react-scroll-area': {
      nextjs16Compatible: true,
      riskLevel: 'low',
      notes: ['Radix UI packages are compatible with Next.js 16'],
    },
    '@radix-ui/react-select': {
      nextjs16Compatible: true,
      riskLevel: 'low',
      notes: ['Radix UI packages are compatible with Next.js 16'],
    },
    '@radix-ui/react-separator': {
      nextjs16Compatible: true,
      riskLevel: 'low',
      notes: ['Radix UI packages are compatible with Next.js 16'],
    },
    '@radix-ui/react-slider': {
      nextjs16Compatible: true,
      riskLevel: 'low',
      notes: ['Radix UI packages are compatible with Next.js 16'],
    },
    '@radix-ui/react-slot': {
      nextjs16Compatible: true,
      riskLevel: 'low',
      notes: ['Radix UI packages are compatible with Next.js 16'],
    },
    '@radix-ui/react-switch': {
      nextjs16Compatible: true,
      riskLevel: 'low',
      notes: ['Radix UI packages are compatible with Next.js 16'],
    },
    '@radix-ui/react-tabs': {
      nextjs16Compatible: true,
      riskLevel: 'low',
      notes: ['Radix UI packages are compatible with Next.js 16'],
    },
    '@radix-ui/react-toast': {
      nextjs16Compatible: true,
      riskLevel: 'low',
      notes: ['Radix UI packages are compatible with Next.js 16'],
    },
    '@radix-ui/react-toggle': {
      nextjs16Compatible: true,
      riskLevel: 'low',
      notes: ['Radix UI packages are compatible with Next.js 16'],
    },
    '@radix-ui/react-toggle-group': {
      nextjs16Compatible: true,
      riskLevel: 'low',
      notes: ['Radix UI packages are compatible with Next.js 16'],
    },
    '@radix-ui/react-tooltip': {
      nextjs16Compatible: true,
      riskLevel: 'low',
      notes: ['Radix UI packages are compatible with Next.js 16'],
    },

    // Supabase
    '@supabase/ssr': {
      nextjs16Compatible: true,
      riskLevel: 'low',
      notes: ['Supabase SSR 0.6.1 is compatible with Next.js 16'],
    },
    '@supabase/supabase-js': {
      nextjs16Compatible: true,
      riskLevel: 'low',
      notes: ['Supabase JS 2.50.3 is compatible with Next.js 16'],
    },

    // Sentry
    '@sentry/nextjs': {
      nextjs16Compatible: true,
      minVersion: '10.0.0',
      riskLevel: 'low',
      notes: ['Sentry 10.20.0 supports Next.js 16'],
    },

    // UI Libraries
    'framer-motion': {
      nextjs16Compatible: true,
      riskLevel: 'low',
      notes: ['Framer Motion 12.23.24 is compatible with Next.js 16'],
    },
    'lucide-react': {
      nextjs16Compatible: true,
      riskLevel: 'low',
      notes: ['Lucide React 0.454.0 is compatible with Next.js 16'],
    },
    'embla-carousel-react': {
      nextjs16Compatible: true,
      riskLevel: 'low',
      notes: ['Embla Carousel 8.5.1 is compatible with Next.js 16'],
    },

    // Form handling
    'react-hook-form': {
      nextjs16Compatible: true,
      riskLevel: 'low',
      notes: ['React Hook Form latest version is compatible with Next.js 16'],
    },
    '@hookform/resolvers': {
      nextjs16Compatible: true,
      riskLevel: 'low',
      notes: ['Hookform resolvers latest version is compatible with Next.js 16'],
    },

    // Styling
    'tailwindcss': {
      nextjs16Compatible: true,
      riskLevel: 'low',
      notes: ['Tailwind CSS 3.4.17 is compatible with Next.js 16'],
    },
    'tailwind-merge': {
      nextjs16Compatible: true,
      riskLevel: 'low',
      notes: ['Tailwind Merge 2.5.5 is compatible with Next.js 16'],
    },
    'tailwindcss-animate': {
      nextjs16Compatible: true,
      riskLevel: 'low',
      notes: ['Tailwind CSS Animate 1.0.7 is compatible with Next.js 16'],
    },
    'class-variance-authority': {
      nextjs16Compatible: true,
      riskLevel: 'low',
      notes: ['CVA 0.7.1 is compatible with Next.js 16'],
    },
    'clsx': {
      nextjs16Compatible: true,
      riskLevel: 'low',
      notes: ['CLSX 2.1.1 is compatible with Next.js 16'],
    },

    // Data fetching
    'swr': {
      nextjs16Compatible: true,
      riskLevel: 'low',
      notes: ['SWR 2.3.6 is compatible with Next.js 16'],
    },

    // Validation
    'zod': {
      nextjs16Compatible: true,
      riskLevel: 'low',
      notes: ['Zod 4.1.12 is compatible with Next.js 16'],
    },

    // Analytics
    '@vercel/analytics': {
      nextjs16Compatible: true,
      riskLevel: 'low',
      notes: ['Vercel Analytics 1.5.0 is compatible with Next.js 16'],
    },

    // Potentially problematic packages
    'autoprefixer': {
      nextjs16Compatible: true,
      riskLevel: 'medium',
      notes: ['May need update for optimal compatibility', 'Monitor for CSS processing issues'],
    },
    'postcss': {
      nextjs16Compatible: true,
      riskLevel: 'medium',
      notes: ['May need update for optimal compatibility', 'Monitor for CSS processing issues'],
    },
  };

  constructor() {
    try {
      const packageJsonPath = join(process.cwd(), 'package.json');
      this.packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));
    } catch (error) {
      console.error(chalk.red('Error reading package.json:'), error);
      process.exit(1);
    }
  }

  private analyzePackage(name: string, version: string): PackageInfo {
    const knownInfo = this.knownCompatibility[name];
    
    if (knownInfo) {
      return {
        name,
        currentVersion: version,
        nextjs16Compatible: knownInfo.nextjs16Compatible,
        upgradeRequired: knownInfo.minVersion ? this.needsUpgrade(version, knownInfo.minVersion) : false,
        riskLevel: knownInfo.riskLevel,
        notes: knownInfo.notes,
        upgradeCommand: knownInfo.upgradeCommand,
      };
    }

    // For unknown packages, assume compatible but flag for manual review
    return {
      name,
      currentVersion: version,
      nextjs16Compatible: true,
      upgradeRequired: false,
      riskLevel: 'low',
      notes: ['Unknown compatibility - manual review recommended'],
    };
  }

  private needsUpgrade(current: string, minimum: string): boolean {
    // Simple version comparison - in real implementation, use semver
    const currentParts = current.replace(/[^\d.]/g, '').split('.').map(Number);
    const minimumParts = minimum.split('.').map(Number);
    
    for (let i = 0; i < Math.max(currentParts.length, minimumParts.length); i++) {
      const currentPart = currentParts[i] || 0;
      const minimumPart = minimumParts[i] || 0;
      
      if (currentPart < minimumPart) return true;
      if (currentPart > minimumPart) return false;
    }
    
    return false;
  }

  public analyzeAllDependencies(): CompatibilityReport {
    const allDependencies = {
      ...this.packageJson.dependencies,
      ...this.packageJson.devDependencies,
    };

    const packageInfos: PackageInfo[] = [];
    
    for (const [name, version] of Object.entries(allDependencies)) {
      packageInfos.push(this.analyzePackage(name, version as string));
    }

    const compatiblePackages = packageInfos.filter(pkg => pkg.nextjs16Compatible && !pkg.upgradeRequired);
    const incompatiblePackages = packageInfos.filter(pkg => !pkg.nextjs16Compatible);
    const upgradeRequired = packageInfos.filter(pkg => pkg.upgradeRequired);

    const riskAssessment = packageInfos.reduce(
      (acc, pkg) => {
        acc[pkg.riskLevel]++;
        return acc;
      },
      { low: 0, medium: 0, high: 0 }
    );

    const recommendations = this.generateRecommendations(packageInfos);

    return {
      totalPackages: packageInfos.length,
      compatiblePackages,
      incompatiblePackages,
      upgradeRequired,
      riskAssessment,
      recommendations,
    };
  }

  private generateRecommendations(packages: PackageInfo[]): string[] {
    const recommendations: string[] = [];

    const highRiskPackages = packages.filter(pkg => pkg.riskLevel === 'high');
    if (highRiskPackages.length > 0) {
      recommendations.push(`🚨 High-risk packages found: ${highRiskPackages.map(p => p.name).join(', ')}`);
    }

    const upgradeNeeded = packages.filter(pkg => pkg.upgradeRequired);
    if (upgradeNeeded.length > 0) {
      recommendations.push(`⬆️ Packages requiring upgrade: ${upgradeNeeded.map(p => p.name).join(', ')}`);
    }

    const unknownPackages = packages.filter(pkg => pkg.notes.some(note => note.includes('Unknown compatibility')));
    if (unknownPackages.length > 0) {
      recommendations.push(`❓ Packages requiring manual review: ${unknownPackages.map(p => p.name).join(', ')}`);
    }

    if (recommendations.length === 0) {
      recommendations.push('✅ All packages appear compatible with Next.js 16');
    }

    return recommendations;
  }

  public generateReport(): void {
    console.log('\n🔍 Next.js 16 Dependency Compatibility Analysis\n');
    
    const report = this.analyzeAllDependencies();
    
    // Summary
    console.log('📊 Summary:');
    console.log(`Total packages: ${report.totalPackages}`);
    console.log(`Compatible: ${report.compatiblePackages.length}`);
    console.log(`Incompatible: ${report.incompatiblePackages.length}`);
    console.log(`Require upgrade: ${report.upgradeRequired.length}`);
    
    // Risk assessment
    console.log('\n⚠️ Risk Assessment:');
    console.log(`Low risk: ${report.riskAssessment.low}`);
    console.log(`Medium risk: ${report.riskAssessment.medium}`);
    console.log(`High risk: ${report.riskAssessment.high}`);

    // Incompatible packages
    if (report.incompatiblePackages.length > 0) {
      console.log('\n❌ Incompatible Packages:');
      report.incompatiblePackages.forEach(pkg => {
        console.log(`  • ${pkg.name}@${pkg.currentVersion}`);
        pkg.notes.forEach(note => console.log(`    ${note}`));
      });
    }

    // Packages requiring upgrade
    if (report.upgradeRequired.length > 0) {
      console.log('\n⬆️ Packages Requiring Upgrade:');
      report.upgradeRequired.forEach(pkg => {
        console.log(`  • ${pkg.name}@${pkg.currentVersion}`);
        pkg.notes.forEach(note => console.log(`    ${note}`));
        if (pkg.upgradeCommand) {
          console.log(`    Command: ${pkg.upgradeCommand}`);
        }
      });
    }

    // Critical packages status
    console.log('\n🔑 Critical Packages Status:');
    const criticalPackages = ['next', 'next-intl', 'react', 'react-dom', '@supabase/ssr', '@sentry/nextjs'];
    criticalPackages.forEach(pkgName => {
      const pkg = report.compatiblePackages.find(p => p.name === pkgName) ||
                  report.upgradeRequired.find(p => p.name === pkgName) ||
                  report.incompatiblePackages.find(p => p.name === pkgName);
      
      if (pkg) {
        const status = pkg.nextjs16Compatible ? 
          (pkg.upgradeRequired ? '⬆️ UPGRADE NEEDED' : '✅ COMPATIBLE') :
          '❌ INCOMPATIBLE';
        console.log(`  ${pkg.name}@${pkg.currentVersion}: ${status}`);
      }
    });

    // Recommendations
    console.log('\n💡 Recommendations:');
    report.recommendations.forEach(rec => {
      console.log(`  ${rec}`);
    });

    // Save detailed report
    const reportPath = join(process.cwd(), 'migration-compatibility-report.json');
    writeFileSync(reportPath, JSON.stringify(report, null, 2));
    console.log(`\n📄 Detailed report saved to: ${reportPath}`);

    console.log('\n🎯 Next Steps:');
    console.log('1. Review any incompatible packages and find alternatives');
    console.log('2. Upgrade packages that require updates');
    console.log('3. Test critical functionality after each upgrade');
    console.log('4. Run the migration validation script');
  }
}

// Run the analysis
if (import.meta.url === `file://${process.argv[1]}`) {
  const analyzer = new DependencyCompatibilityAnalyzer();
  analyzer.generateReport();
}

export { DependencyCompatibilityAnalyzer };