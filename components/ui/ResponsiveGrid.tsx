'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { GridSystemProps } from '@/types/dual-audience';

/**
 * Responsive grid system for dual-audience content
 * Provides flexible grid layouts that adapt to different screen sizes
 */
export default function ResponsiveGrid({
  children,
  columns = {
    mobile: 1,
    tablet: 2,
    desktop: 3
  },
  gap = {
    mobile: '1rem',
    tablet: '1.5rem',
    desktop: '2rem'
  },
  className
}: GridSystemProps) {
  // Generate grid column classes based on breakpoints
  const gridClasses = cn(
    'grid w-full',
    // Mobile columns
    `grid-cols-${columns.mobile}`,
    // Tablet columns
    `md:grid-cols-${columns.tablet}`,
    // Desktop columns
    `lg:grid-cols-${columns.desktop}`,
    className
  );

  // Generate gap classes
  const gapClasses = cn(
    'gap-4', // Default mobile gap
    'md:gap-6', // Tablet gap
    'lg:gap-8' // Desktop gap
  );

  return (
    <div 
      className={cn(gridClasses, gapClasses)}
      style={{
        '--grid-gap-mobile': gap.mobile,
        '--grid-gap-tablet': gap.tablet,
        '--grid-gap-desktop': gap.desktop,
      } as React.CSSProperties}
    >
      {children}
    </div>
  );
}

/**
 * Grid item component with responsive sizing options
 */
interface GridItemProps {
  children: React.ReactNode;
  span?: {
    mobile?: number;
    tablet?: number;
    desktop?: number;
  };
  className?: string;
}

export function GridItem({
  children,
  span = {},
  className
}: GridItemProps) {
  const spanClasses = cn(
    // Mobile span
    span.mobile && `col-span-${span.mobile}`,
    // Tablet span
    span.tablet && `md:col-span-${span.tablet}`,
    // Desktop span
    span.desktop && `lg:col-span-${span.desktop}`,
    className
  );

  return (
    <div className={spanClasses}>
      {children}
    </div>
  );
}

/**
 * Dual-audience layout component
 * Implements the 70/30 guest-first layout strategy
 */
interface DualAudienceLayoutProps {
  guestContent: React.ReactNode;
  ownerContent: React.ReactNode;
  className?: string;
}

export function DualAudienceLayout({
  guestContent,
  ownerContent,
  className
}: DualAudienceLayoutProps) {
  return (
    <div className={cn('w-full', className)}>
      {/* Guest-focused content - Primary (70%) */}
      <div className="w-full">
        {guestContent}
      </div>
      
      {/* Owner-focused content - Secondary (30%) */}
      <div className="w-full mt-16 lg:mt-24">
        {ownerContent}
      </div>
    </div>
  );
}

/**
 * Section container with consistent spacing and responsive behavior
 */
interface SectionContainerProps {
  children: React.ReactNode;
  id?: string;
  className?: string;
  background?: 'default' | 'alternate' | 'gradient';
  padding?: 'small' | 'medium' | 'large';
}

export function SectionContainer({
  children,
  id,
  className,
  background = 'default',
  padding = 'medium'
}: SectionContainerProps) {
  const backgroundClasses = {
    default: 'bg-white dark:bg-gray-900',
    alternate: 'bg-gray-50 dark:bg-gray-800',
    gradient: 'bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800'
  };

  const paddingClasses = {
    small: 'py-8 sm:py-12',
    medium: 'py-12 sm:py-16 lg:py-20',
    large: 'py-16 sm:py-20 lg:py-28'
  };

  return (
    <section
      id={id}
      className={cn(
        'w-full',
        backgroundClasses[background],
        paddingClasses[padding],
        className
      )}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {children}
      </div>
    </section>
  );
}

/**
 * Content wrapper with responsive max-width and centering
 */
interface ContentWrapperProps {
  children: React.ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full';
  className?: string;
}

export function ContentWrapper({
  children,
  maxWidth = 'lg',
  className
}: ContentWrapperProps) {
  const maxWidthClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
    full: 'max-w-full'
  };

  return (
    <div className={cn(
      'mx-auto',
      maxWidthClasses[maxWidth],
      className
    )}>
      {children}
    </div>
  );
}