'use client';

import { useEffect, useRef } from 'react';
import { useAnimationSystem, useReducedMotion } from '@/hooks/useAnimationSystem';

interface AnimatedBackgroundProps {
  variant?: 'hero' | 'section' | 'subtle';
  showParticles?: boolean;
  className?: string;
  children?: React.ReactNode;
}

export default function AnimatedBackground({ 
  variant = 'hero', 
  showParticles = true, 
  className = '',
  children 
}: AnimatedBackgroundProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { createParticles } = useAnimationSystem();
  const prefersReducedMotion = useReducedMotion();

  useEffect(() => {
    if (!prefersReducedMotion && showParticles && containerRef.current) {
      // Create initial particles
      createParticles(containerRef.current);
      
      // Create new particles periodically
      const interval = setInterval(() => {
        if (containerRef.current) {
          createParticles(containerRef.current);
        }
      }, 10000); // New particles every 10 seconds

      return () => clearInterval(interval);
    }
  }, [createParticles, showParticles, prefersReducedMotion]);

  const getBackgroundClasses = () => {
    const baseClasses = 'relative overflow-hidden';
    
    switch (variant) {
      case 'hero':
        return `${baseClasses} bg-gradient-hero animate-gradient min-h-screen`;
      case 'section':
        return `${baseClasses} bg-gradient-primary animate-gradient`;
      case 'subtle':
        return `${baseClasses} bg-gradient-accent opacity-20`;
      default:
        return baseClasses;
    }
  };

  return (
    <div 
      ref={containerRef}
      className={`${getBackgroundClasses()} ${className}`}
    >
      {/* Animated Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-600/20 via-blue-600/20 to-cyan-600/20 animate-gradient" />
      
      {/* Geometric Shapes */}
      {!prefersReducedMotion && (
        <>
          <div className="absolute top-1/4 left-1/4 w-32 h-32 bg-gradient-primary rounded-full opacity-10 animate-float" />
          <div className="absolute top-3/4 right-1/4 w-24 h-24 bg-gradient-secondary rounded-full opacity-15 animate-float" style={{ animationDelay: '2s' }} />
          <div className="absolute top-1/2 left-3/4 w-16 h-16 bg-gradient-accent rounded-full opacity-20 animate-float" style={{ animationDelay: '4s' }} />
        </>
      )}

      {/* Particle Container */}
      {showParticles && !prefersReducedMotion && (
        <div className="particle-container" />
      )}

      {/* Content */}
      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
}

// Specialized background components
export function HeroBackground({ children, className = '' }: { children?: React.ReactNode; className?: string }) {
  return (
    <AnimatedBackground variant="hero" showParticles={true} className={className}>
      {children}
    </AnimatedBackground>
  );
}

export function SectionBackground({ children, className = '' }: { children?: React.ReactNode; className?: string }) {
  return (
    <AnimatedBackground variant="section" showParticles={false} className={className}>
      {children}
    </AnimatedBackground>
  );
}

export function SubtleBackground({ children, className = '' }: { children?: React.ReactNode; className?: string }) {
  return (
    <AnimatedBackground variant="subtle" showParticles={false} className={className}>
      {children}
    </AnimatedBackground>
  );
}