// =====================================================
// PROMETHEUS METRICS API ENDPOINT
// =====================================================
// Expose application metrics for Prometheus scraping
// Requirements: 10.4, 10.5
// =====================================================

import { createClient } from '@supabase/supabase-js';
import { register, Counter, Histogram, Gauge, collectDefaultMetrics } from 'prom-client';

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Collect default Node.js metrics
collectDefaultMetrics({ register });

// =====================================================
// CUSTOM METRICS DEFINITIONS
// =====================================================

// HTTP request metrics
const httpRequestsTotal = new Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code'],
  registers: [register]
});

const httpRequestDuration = new Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.1, 0.3, 0.5, 0.7, 1, 3, 5, 7, 10],
  registers: [register]
});

// Business metrics
const reservationAttemptsTotal = new Counter({
  name: 'reservation_attempts_total',
  help: 'Total number of reservation attempts',
  labelNames: ['status'],
  registers: [register]
});

const reservationRevenueTotal = new Counter({
  name: 'reservation_revenue_total',
  help: 'Total revenue from reservations',
  labelNames: ['currency'],
  registers: [register]
});

const paymentAttemptsTotal = new Counter({
  name: 'payment_attempts_total',
  help: 'Total number of payment attempts',
  labelNames: ['status', 'method'],
  registers: [register]
});

const authAttemptsTotal = new Counter({
  name: 'auth_attempts_total',
  help: 'Total number of authentication attempts',
  labelNames: ['status', 'method'],
  registers: [register]
});

// System metrics
const activeReservations = new Gauge({
  name: 'active_reservations',
  help: 'Number of active reservations',
  registers: [register]
});

const availableLofts = new Gauge({
  name: 'available_lofts',
  help: 'Number of available lofts',
  registers: [register]
});

const databaseConnections = new Gauge({
  name: 'database_connections',
  help: 'Number of active database connections',
  registers: [register]
});

// Performance metrics
const pageLoadTime = new Histogram({
  name: 'page_load_time_seconds',
  help: 'Page load time in seconds',
  labelNames: ['page'],
  buckets: [0.1, 0.5, 1, 2, 5, 10],
  registers: [register]
});

const apiResponseTime = new Histogram({
  name: 'api_response_time_seconds',
  help: 'API response time in seconds',
  labelNames: ['endpoint', 'method'],
  buckets: [0.01, 0.05, 0.1, 0.5, 1, 2, 5],
  registers: [register]
});

// =====================================================
// METRICS COLLECTOR CLASS
// =====================================================
class MetricsCollector {
  constructor() {
    this.lastCollectionTime = Date.now();
  }

  // Collect all business metrics from database
  async collectBusinessMetrics() {
    try {
      // Collect reservation metrics
      await this.collectReservationMetrics();
      
      // Collect loft metrics
      await this.collectLoftMetrics();
      
      // Collect payment metrics
      await this.collectPaymentMetrics();
      
      // Collect user metrics
      await this.collectUserMetrics();
      
      this.lastCollectionTime = Date.now();
    } catch (error) {
      console.error('Error collecting business metrics:', error);
    }
  }

  // Collect reservation metrics
  async collectReservationMetrics() {
    // Active reservations
    const { data: activeRes, error: activeError } = await supabase
      .from('reservations')
      .select('count')
      .in('status', ['pending', 'confirmed'])
      .gte('check_out_date', new Date().toISOString().split('T')[0]);

    if (!activeError && activeRes) {
      activeReservations.set(activeRes.length);
    }

    // Daily reservation attempts (last 24 hours)
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    
    const { data: attempts, error: attemptsError } = await supabase
      .from('reservations')
      .select('status')
      .gte('created_at', yesterday);

    if (!attemptsError && attempts) {
      const statusCounts = attempts.reduce((acc, res) => {
        acc[res.status] = (acc[res.status] || 0) + 1;
        return acc;
      }, {});

      Object.entries(statusCounts).forEach(([status, count]) => {
        reservationAttemptsTotal.labels(status).inc(count);
      });
    }

    // Revenue (last 24 hours)
    const { data: revenue, error: revenueError } = await supabase
      .from('reservations')
      .select('pricing')
      .eq('status', 'confirmed')
      .gte('created_at', yesterday);

    if (!revenueError && revenue) {
      const totalRevenue = revenue.reduce((sum, res) => {
        const amount = res.pricing?.total_amount || 0;
        return sum + parseFloat(amount);
      }, 0);

      reservationRevenueTotal.labels('DZD').inc(totalRevenue);
    }
  }

  // Collect loft metrics
  async collectLoftMetrics() {
    const { data: lofts, error } = await supabase
      .from('lofts')
      .select('status')
      .eq('status', 'available');

    if (!error && lofts) {
      availableLofts.set(lofts.length);
    }
  }

  // Collect payment metrics
  async collectPaymentMetrics() {
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    
    const { data: payments, error } = await supabase
      .from('reservation_payments')
      .select('status, payment_method')
      .gte('created_at', yesterday);

    if (!error && payments) {
      const statusCounts = payments.reduce((acc, payment) => {
        const key = `${payment.status}_${payment.payment_method}`;
        acc[key] = (acc[key] || 0) + 1;
        return acc;
      }, {});

      Object.entries(statusCounts).forEach(([key, count]) => {
        const [status, method] = key.split('_');
        paymentAttemptsTotal.labels(status, method).inc(count);
      });
    }
  }

  // Collect user metrics
  async collectUserMetrics() {
    // This would typically come from authentication logs
    // For now, we'll use a placeholder implementation
    
    // You would implement actual auth metrics collection here
    // based on your authentication system logs
  }

  // Collect performance metrics from analytics
  async collectPerformanceMetrics() {
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    
    try {
      const { data: perfMetrics, error } = await supabase
        .from('analytics_events')
        .select('properties')
        .eq('event_type', 'performance_metric')
        .gte('timestamp', yesterday);

      if (!error && perfMetrics) {
        perfMetrics.forEach(metric => {
          const { metric_name, metric_value } = metric.properties;
          
          if (metric_name === 'page_load_time') {
            pageLoadTime.labels('unknown').observe(metric_value / 1000);
          }
        });
      }
    } catch (error) {
      console.error('Error collecting performance metrics:', error);
    }
  }
}

// =====================================================
// MIDDLEWARE FOR REQUEST TRACKING
// =====================================================
export const trackHttpRequest = (req, res, next) => {
  const start = Date.now();
  const route = req.route?.path || req.url;
  const method = req.method;

  // Track request
  httpRequestsTotal.labels(method, route, 'unknown').inc();

  // Override res.end to capture response time and status
  const originalEnd = res.end;
  res.end = function(...args) {
    const duration = (Date.now() - start) / 1000;
    const statusCode = res.statusCode.toString();
    
    httpRequestDuration.labels(method, route, statusCode).observe(duration);
    httpRequestsTotal.labels(method, route, statusCode).inc();
    
    originalEnd.apply(this, args);
  };

  if (next) next();
};

// =====================================================
// API HANDLER
// =====================================================
export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const collector = new MetricsCollector();
    
    // Collect fresh metrics
    await Promise.all([
      collector.collectBusinessMetrics(),
      collector.collectPerformanceMetrics()
    ]);

    // Get metrics in Prometheus format
    const metrics = await register.metrics();
    
    res.setHeader('Content-Type', register.contentType);
    res.status(200).send(metrics);
    
  } catch (error) {
    console.error('Metrics collection error:', error);
    res.status(500).json({ error: 'Failed to collect metrics' });
  }
}

// =====================================================
// UTILITY FUNCTIONS FOR MANUAL METRIC TRACKING
// =====================================================
export const MetricsUtils = {
  // Track HTTP request manually
  trackRequest: (method, route, statusCode, duration) => {
    httpRequestsTotal.labels(method, route, statusCode).inc();
    httpRequestDuration.labels(method, route, statusCode).observe(duration);
  },

  // Track reservation event
  trackReservation: (status) => {
    reservationAttemptsTotal.labels(status).inc();
  },

  // Track payment event
  trackPayment: (status, method) => {
    paymentAttemptsTotal.labels(status, method).inc();
  },

  // Track authentication event
  trackAuth: (status, method) => {
    authAttemptsTotal.labels(status, method).inc();
  },

  // Track API response time
  trackApiResponse: (endpoint, method, duration) => {
    apiResponseTime.labels(endpoint, method).observe(duration);
  },

  // Update gauge metrics
  updateGauge: (metricName, value) => {
    switch (metricName) {
      case 'active_reservations':
        activeReservations.set(value);
        break;
      case 'available_lofts':
        availableLofts.set(value);
        break;
      case 'database_connections':
        databaseConnections.set(value);
        break;
    }
  }
};

// =====================================================
// HEALTH CHECK METRICS
// =====================================================
export const HealthMetrics = {
  // Check if metrics collection is healthy
  isHealthy: () => {
    const collector = new MetricsCollector();
    const timeSinceLastCollection = Date.now() - collector.lastCollectionTime;
    
    // Consider unhealthy if no collection in last 5 minutes
    return timeSinceLastCollection < 5 * 60 * 1000;
  },

  // Get metrics summary
  getSummary: async () => {
    try {
      const collector = new MetricsCollector();
      await collector.collectBusinessMetrics();
      
      return {
        timestamp: new Date().toISOString(),
        active_reservations: await activeReservations.get(),
        available_lofts: await availableLofts.get(),
        last_collection: new Date(collector.lastCollectionTime).toISOString()
      };
    } catch (error) {
      return {
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }
};

// =====================================================
// USAGE EXAMPLES
// =====================================================
/*
// In API routes:
import { MetricsUtils } from '../metrics';

export default async function handler(req, res) {
  const start = Date.now();
  
  try {
    // Your API logic here
    const result = await processRequest(req);
    
    // Track successful request
    MetricsUtils.trackRequest(req.method, req.url, 200, (Date.now() - start) / 1000);
    
    res.status(200).json(result);
  } catch (error) {
    // Track failed request
    MetricsUtils.trackRequest(req.method, req.url, 500, (Date.now() - start) / 1000);
    
    res.status(500).json({ error: error.message });
  }
}

// In reservation service:
import { MetricsUtils } from '../metrics';

const createReservation = async (data) => {
  try {
    const reservation = await saveReservation(data);
    MetricsUtils.trackReservation('success');
    return reservation;
  } catch (error) {
    MetricsUtils.trackReservation('failed');
    throw error;
  }
};
*/