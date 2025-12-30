'use client';

import { useState } from 'react';
import { useAnalytics } from '@/components/providers/analytics-provider';
import { measurePerformance } from '@/lib/monitoring/performance';
import * as Sentry from '@sentry/nextjs';

interface ContactFormData {
  name: string;
  email: string;
  message: string;
}

/**
 * Example contact form with comprehensive monitoring integration
 * This demonstrates how to use all monitoring features in a real component
 */
export function MonitoredContactForm() {
  const [formData, setFormData] = useState<ContactFormData>({
    name: '',
    email: '',
    message: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const { trackFormSubmission, trackContact, trackEvent } = useAnalytics();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitStatus('idle');

    try {
      // Track form start
      trackEvent('form_start', 'forms', 'contact-form');

      // Measure form submission performance
      const result = await measurePerformance('contact-form-submission', async () => {
        // Simulate API call
        const response = await fetch('/api/contact', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(formData),
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        return response.json();
      });

      // Success tracking
      setSubmitStatus('success');
      trackFormSubmission('contact-form', true);
      trackContact('form', window.location.pathname);
      
      // Track successful conversion
      trackEvent('generate_lead', 'conversions', 'contact-form', 1);

      // Add success breadcrumb to Sentry
      Sentry.addBreadcrumb({
        category: 'form',
        message: 'Contact form submitted successfully',
        level: 'info',
        data: {
          formType: 'contact',
          hasName: !!formData.name,
          hasEmail: !!formData.email,
          messageLength: formData.message.length,
        },
      });

      // Reset form
      setFormData({ name: '', email: '', message: '' });

    } catch (error) {
      console.error('Form submission error:', error);
      
      // Error tracking
      setSubmitStatus('error');
      trackFormSubmission('contact-form', false);
      trackEvent('form_error', 'errors', 'contact-form', 1);

      // Send error to Sentry with context
      Sentry.captureException(error, {
        tags: {
          component: 'contact-form',
          action: 'submit',
        },
        extra: {
          formData: {
            hasName: !!formData.name,
            hasEmail: !!formData.email,
            messageLength: formData.message.length,
          },
          userAgent: navigator.userAgent,
          url: window.location.href,
        },
        level: 'error',
      });

    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field: keyof ContactFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Track form interaction
    trackEvent('form_interact', 'forms', `contact-form-${field}`);
  };

  const handleFocus = (field: string) => {
    // Track field focus for UX insights
    trackEvent('form_field_focus', 'forms', `contact-form-${field}`);
  };

  return (
    <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold mb-6 text-gray-900">Contact Us</h2>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
            Name
          </label>
          <input
            type="text"
            id="name"
            value={formData.name}
            onChange={(e) => handleInputChange('name', e.target.value)}
            onFocus={() => handleFocus('name')}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Your name"
          />
        </div>

        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
            Email
          </label>
          <input
            type="email"
            id="email"
            value={formData.email}
            onChange={(e) => handleInputChange('email', e.target.value)}
            onFocus={() => handleFocus('email')}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="your@email.com"
          />
        </div>

        <div>
          <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-1">
            Message
          </label>
          <textarea
            id="message"
            value={formData.message}
            onChange={(e) => handleInputChange('message', e.target.value)}
            onFocus={() => handleFocus('message')}
            required
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Your message..."
          />
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className={`w-full py-2 px-4 rounded-md font-medium transition-colors ${
            isSubmitting
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500'
          } text-white`}
        >
          {isSubmitting ? 'Sending...' : 'Send Message'}
        </button>
      </form>

      {/* Status Messages */}
      {submitStatus === 'success' && (
        <div className="mt-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded">
          Thank you! Your message has been sent successfully.
        </div>
      )}

      {submitStatus === 'error' && (
        <div className="mt-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
          Sorry, there was an error sending your message. Please try again.
        </div>
      )}

      {/* Development Monitoring Info */}
      {process.env.NODE_ENV === 'development' && (
        <div className="mt-6 p-3 bg-gray-100 rounded text-xs text-gray-600">
          <strong>Monitoring Active:</strong>
          <ul className="mt-1 space-y-1">
            <li>• Form interactions tracked</li>
            <li>• Performance measured</li>
            <li>• Errors sent to Sentry</li>
            <li>• Analytics events fired</li>
          </ul>
        </div>
      )}
    </div>
  );
}