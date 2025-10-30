// =====================================================
// ANALYTICS API ENDPOINT
// =====================================================
// Server-side analytics collection and processing
// Requirements: 10.4, 10.5
// =====================================================

import { createClient } from '@supabase/supabase-js';
import { rateLimit } from '../../../lib/rate-limit';

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Rate limiting configuration
const limiter = rateLimit({
  interval: 60 * 1000, // 1 minute
  uniqueTokenPerInterval: 500, // Limit each IP to 500 requests per minute
});

// =====================================================
// ANALYTICS DATA PROCESSOR
// =====================================================
class AnalyticsProcessor {
  constructor() {
    this.batchSize = 100;
    this.validEvents = new Set([
      'page_view',
      'user_interaction',
      'form_submission',
      'search',
      'reservation_started',
      'reservation_completed',
      'reservation_cancelled',
      'payment_initiated',
      'payment_completed',
      'payment_failed',
      'conversion',
      'error',
      'performance_metric',
      'navigation_timing',
      'slow_resource'
    ]);
  }

  // Validate event data
  validateEvent(event) {
    if (!event || typeof event !== 'object') {
      return { valid: false, error: 'Invalid event format' };
    }

    if (!event.event || !this.validEvents.has(event.event)) {
      return { valid: false, error: 'Invalid event type' };
    }

    if (!event.properties || typeof event.properties !== 'object') {
      return { valid: false, error: 'Invalid event properties' };
    }

    if (!event.properties.timestamp || !event.properties.session_id) {
      return { valid: false, error: 'Missing required properties' };
    }

    return { valid: true };
  }

  // Sanitize event data
  sanitizeEvent(event) {
    const sanitized = {
      event_type: event.event,
      session_id: event.properties.session_id,
      user_id: event.properties.user_id || null,
      timestamp: new Date(event.properties.timestamp),
      url: event.properties.url,
      referrer: event.properties.referrer || null,
      user_agent: event.properties.user_agent,
      ip_address: null, // Will be set from request
      properties: {}
    };

    // Copy relevant properties based on event type
    switch (event.event) {
      case 'page_view':
        sanitized.properties = {
          page_path: event.properties.page_path,
          page_title: event.properties.page_title
        };
        break;

      case 'user_interaction':
        sanitized.properties = {
          element_type: event.properties.element_type,
          element_id: event.properties.element_id,
          action: event.properties.action
        };
        break;

      case 'form_submission':
        sanitized.properties = {
          form_name: event.properties.form_name,
          success: event.properties.success,
          errors: event.properties.errors
        };
        break;

      case 'search':
        sanitized.properties = {
          search_query: event.properties.search_query,
          results_count: event.properties.results_count,
          filters: event.properties.filters
        };
        break;

      case 'reservation_started':
      case 'reservation_completed':
      case 'reservation_cancelled':
        sanitized.properties = {
          loft_id: event.properties.loft_id,
          check_in: event.properties.check_in,
          check_out: event.properties.check_out,
          guests: event.properties.guests,
          total_amount: event.properties.total_amount
        };
        break;

      case 'payment_initiated':
      case 'payment_completed':
      case 'payment_failed':
        sanitized.properties = {
          payment_method: event.properties.payment_method,
          amount: event.properties.amount,
          currency: event.properties.currency,
          reservation_id: event.properties.reservation_id
        };
        break;

      case 'conversion':
        sanitized.properties = {
          conversion_type: event.properties.conversion_type,
          value: event.properties.value,
          currency: event.properties.currency
        };
        break;

      case 'error':
        sanitized.properties = {
          error_message: event.properties.error_message,
          error_type: event.properties.type,
          error_stack: event.properties.error_stack
        };
        break;

      case 'performance_metric':
        sanitized.properties = {
          metric_name: event.properties.metric_name,
          metric_value: event.properties.metric_value,
          status: event.properties.status
        };
        break;

      default:
        sanitized.properties = event.properties;
    }

    return sanitized;
  }

  // Store events in database
  async storeEvents(events, clientIP) {
    const sanitizedEvents = events.map(event => {
      const sanitized = this.sanitizeEvent(event);
      sanitized.ip_address = clientIP;
      return sanitized;
    });

    try {
      const { data, error } = await supabase
        .from('analytics_events')
        .insert(sanitizedEvents);

      if (error) {
        console.error('Database insert error:', error);
        return { success: false, error: error.message };
      }

      return { success: true, inserted: sanitizedEvents.length };
    } catch (error) {
      console.error('Analytics storage error:', error);
      return { success: false, error: error.message };
    }
  }

  // Process business metrics
  async processBusinessMetrics(events) {
    const businessEvents = events.filter(event => 
      event.event.startsWith('reservation_') || 
      event.event.startsWith('payment_') ||
      event.event === 'conversion'
    );

    if (businessEvents.length === 0) return;

    // Update real-time metrics
    for (const event of businessEvents) {
      await this.updateRealtimeMetrics(event);
    }
  }

  // Update real-time metrics
  async updateRealtimeMetrics(event) {
    const today = new Date().toISOString().split('T')[0];
    
    try {
      switch (event.event) {
        case 'reservation_started':
          await this.incrementMetric('reservation_attempts', today);
          break;
        
        case 'reservation_completed':
          await this.incrementMetric('reservation_completions', today);
          await this.addRevenueMetric('reservation_revenue', today, event.properties.total_amount);
          break;
        
        case 'payment_completed':
          await this.incrementMetric('payment_completions', today);
          break;
        
        case 'payment_failed':
          await this.incrementMetric('payment_failures', today);
          break;
      }
    } catch (error) {
      console.error('Metrics update error:', error);
    }
  }

  // Increment metric counter
  async incrementMetric(metricName, date) {
    const { error } = await supabase.rpc('increment_daily_metric', {
      metric_name: metricName,
      metric_date: date
    });

    if (error) {
      console.error(`Failed to increment ${metricName}:`, error);
    }
  }

  // Add revenue metric
  async addRevenueMetric(metricName, date, amount) {
    const { error } = await supabase.rpc('add_revenue_metric', {
      metric_name: metricName,
      metric_date: date,
      amount: amount
    });

    if (error) {
      console.error(`Failed to add revenue ${metricName}:`, error);
    }
  }
}

// =====================================================
// API HANDLER
// =====================================================
export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Apply rate limiting
    await limiter.check(res, 10, 'ANALYTICS_CACHE_TOKEN');
  } catch {
    return res.status(429).json({ error: 'Rate limit exceeded' });
  }

  // Get client IP
  const clientIP = req.headers['x-forwarded-for'] || 
                   req.headers['x-real-ip'] || 
                   req.connection.remoteAddress || 
                   'unknown';

  // Validate request body
  const { events } = req.body;
  
  if (!events || !Array.isArray(events)) {
    return res.status(400).json({ error: 'Invalid request format' });
  }

  if (events.length === 0) {
    return res.status(400).json({ error: 'No events provided' });
  }

  if (events.length > 100) {
    return res.status(400).json({ error: 'Too many events (max 100)' });
  }

  const processor = new AnalyticsProcessor();
  const validEvents = [];
  const errors = [];

  // Validate all events
  for (let i = 0; i < events.length; i++) {
    const validation = processor.validateEvent(events[i]);
    if (validation.valid) {
      validEvents.push(events[i]);
    } else {
      errors.push({ index: i, error: validation.error });
    }
  }

  if (validEvents.length === 0) {
    return res.status(400).json({ 
      error: 'No valid events found',
      validation_errors: errors
    });
  }

  try {
    // Store events
    const result = await processor.storeEvents(validEvents, clientIP);
    
    if (!result.success) {
      return res.status(500).json({ error: 'Failed to store events' });
    }

    // Process business metrics asynchronously
    processor.processBusinessMetrics(validEvents).catch(error => {
      console.error('Business metrics processing error:', error);
    });

    // Return success response
    res.status(200).json({
      success: true,
      processed: result.inserted,
      skipped: events.length - validEvents.length,
      validation_errors: errors.length > 0 ? errors : undefined
    });

  } catch (error) {
    console.error('Analytics API error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

// =====================================================
// DATABASE SCHEMA FOR ANALYTICS
// =====================================================
/*
-- Analytics events table
CREATE TABLE IF NOT EXISTS analytics_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type VARCHAR(50) NOT NULL,
  session_id VARCHAR(100) NOT NULL,
  user_id UUID REFERENCES customers(id),
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
  url TEXT,
  referrer TEXT,
  user_agent TEXT,
  ip_address INET,
  properties JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for analytics
CREATE INDEX IF NOT EXISTS idx_analytics_events_type ON analytics_events(event_type);
CREATE INDEX IF NOT EXISTS idx_analytics_events_timestamp ON analytics_events(timestamp);
CREATE INDEX IF NOT EXISTS idx_analytics_events_session ON analytics_events(session_id);
CREATE INDEX IF NOT EXISTS idx_analytics_events_user ON analytics_events(user_id);
CREATE INDEX IF NOT EXISTS idx_analytics_events_properties ON analytics_events USING GIN(properties);

-- Daily metrics table
CREATE TABLE IF NOT EXISTS daily_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  metric_name VARCHAR(100) NOT NULL,
  metric_date DATE NOT NULL,
  metric_value DECIMAL(15,2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(metric_name, metric_date)
);

-- Function to increment daily metric
CREATE OR REPLACE FUNCTION increment_daily_metric(metric_name TEXT, metric_date DATE)
RETURNS VOID AS $
BEGIN
  INSERT INTO daily_metrics (metric_name, metric_date, metric_value)
  VALUES (metric_name, metric_date, 1)
  ON CONFLICT (metric_name, metric_date)
  DO UPDATE SET 
    metric_value = daily_metrics.metric_value + 1,
    updated_at = NOW();
END;
$ LANGUAGE plpgsql;

-- Function to add revenue metric
CREATE OR REPLACE FUNCTION add_revenue_metric(metric_name TEXT, metric_date DATE, amount DECIMAL)
RETURNS VOID AS $
BEGIN
  INSERT INTO daily_metrics (metric_name, metric_date, metric_value)
  VALUES (metric_name, metric_date, amount)
  ON CONFLICT (metric_name, metric_date)
  DO UPDATE SET 
    metric_value = daily_metrics.metric_value + amount,
    updated_at = NOW();
END;
$ LANGUAGE plpgsql;
*/