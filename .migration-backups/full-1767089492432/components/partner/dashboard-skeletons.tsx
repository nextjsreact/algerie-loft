"use client"

import React from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';

// Base skeleton component
export function Skeleton({ 
  className = '', 
  width, 
  height 
}: { 
  className?: string;
  width?: string | number;
  height?: string | number;
}) {
  const style = {
    width: typeof width === 'number' ? `${width}px` : width,
    height: typeof height === 'number' ? `${height}px` : height,
  };

  return (
    <div 
      className={`animate-pulse bg-gray-200 dark:bg-gray-700 rounded ${className}`}
      style={style}
    />
  );
}

// Dashboard stats skeleton - matches the StatCard layout
export function DashboardStatsSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {[...Array(5)].map((_, i) => (
        <Card key={i}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-5 w-5 rounded" />
            </div>
            <Skeleton className="h-8 w-16 mb-1" />
            <Skeleton className="h-4 w-20" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// Properties overview skeleton - matches the PropertiesOverview layout
export function PropertiesOverviewSkeleton({ limit = 3 }: { limit?: number }) {
  return (
    <div className="lg:col-span-2">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-9 w-20" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(limit)].map((_, i) => (
              <div key={i} className="flex items-center gap-4 p-4 border rounded-lg">
                <Skeleton className="h-16 w-16 rounded" />
                <div className="flex-1">
                  <Skeleton className="h-5 w-32 mb-2" />
                  <Skeleton className="h-4 w-48 mb-1" />
                  <div className="flex items-center gap-4 mt-2">
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-4 w-24" />
                  </div>
                </div>
                <div className="text-right">
                  <Skeleton className="h-6 w-16 mb-1" />
                  <Skeleton className="h-4 w-12" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Recent bookings skeleton - matches the RecentBookingsSection layout
export function RecentBookingsSkeleton({ limit = 5 }: { limit?: number }) {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-6 w-40" />
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {[...Array(limit)].map((_, i) => (
            <div key={i} className="p-4 border rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <Skeleton className="h-5 w-32" />
                <Skeleton className="h-5 w-20 rounded-full" />
              </div>
              <Skeleton className="h-4 w-48 mb-2" />
              <div className="flex items-center gap-4">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-20" />
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// Quick actions skeleton
export function QuickActionsSkeleton() {
  return (
    <Card className="mb-8">
      <CardHeader>
        <Skeleton className="h-6 w-32" />
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-3">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-10 w-40 rounded-md" />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// Complete dashboard skeleton
export function DashboardPageSkeleton() {
  return (
    <div className="container mx-auto p-6">
      {/* Header skeleton */}
      <div className="mb-8">
        <Skeleton className="h-9 w-64 mb-2" />
        <Skeleton className="h-5 w-96" />
      </div>

      {/* Stats skeleton */}
      <DashboardStatsSkeleton />

      {/* Quick actions skeleton */}
      <QuickActionsSkeleton />

      {/* Properties and bookings grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <PropertiesOverviewSkeleton limit={3} />
        <RecentBookingsSkeleton limit={5} />
      </div>
    </div>
  );
}

// Smooth loading transition wrapper
export function LoadingTransition({ 
  isLoading, 
  children,
  skeleton
}: { 
  isLoading: boolean;
  children: React.ReactNode;
  skeleton: React.ReactNode;
}) {
  return (
    <div className="relative">
      <div 
        className={`transition-opacity duration-300 ${
          isLoading ? 'opacity-0' : 'opacity-100'
        }`}
      >
        {children}
      </div>
      {isLoading && (
        <div className="absolute inset-0">
          {skeleton}
        </div>
      )}
    </div>
  );
}

// Inline loading component for sections
export function InlineLoading({ 
  message,
  className = '' 
}: { 
  message?: string;
  className?: string;
}) {
  return (
    <div className={`flex items-center justify-center py-8 ${className}`}>
      <div className="flex items-center space-x-3">
        <div className="animate-spin rounded-full h-6 w-6 border-2 border-gray-300 border-t-blue-600 dark:border-gray-600 dark:border-t-blue-400" />
        {message && (
          <span className="text-gray-600 dark:text-gray-400">{message}</span>
        )}
      </div>
    </div>
  );
}

// Loading overlay for full page
export function LoadingOverlay({ 
  message,
  className = '' 
}: { 
  message?: string;
  className?: string;
}) {
  return (
    <div className={`fixed inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center z-50 ${className}`}>
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 flex items-center space-x-4 shadow-xl">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-gray-300 border-t-blue-600 dark:border-gray-600 dark:border-t-blue-400" />
        {message && (
          <span className="text-gray-700 dark:text-gray-300 font-medium">{message}</span>
        )}
      </div>
    </div>
  );
}
