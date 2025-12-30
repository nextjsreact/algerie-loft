'use client';

import React from 'react';
import { CustomerServiceRatings } from './CustomerServiceRatings';

/**
 * Test component for CustomerServiceRatings
 * This component can be used to test the customer service ratings display
 */
export default function CustomerServiceRatingsTest() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8">
      <div className="max-w-6xl mx-auto space-y-12">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
            Customer Service Ratings Test
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Testing the customer service ratings and availability display component
          </p>
        </div>

        {/* French Version */}
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
            French Version
          </h2>
          <CustomerServiceRatings 
            locale="fr"
            showDetailedMetrics={true}
          />
        </div>

        {/* English Version */}
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
            English Version
          </h2>
          <CustomerServiceRatings 
            locale="en"
            showDetailedMetrics={true}
          />
        </div>

        {/* Arabic Version */}
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
            Arabic Version
          </h2>
          <CustomerServiceRatings 
            locale="ar"
            showDetailedMetrics={true}
          />
        </div>

        {/* Compact Version */}
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
            Compact Version (No Detailed Metrics)
          </h2>
          <CustomerServiceRatings 
            locale="fr"
            showDetailedMetrics={false}
          />
        </div>
      </div>
    </div>
  );
}