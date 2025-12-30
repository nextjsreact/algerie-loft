// Temporary mock for @sentry/nextjs
// This provides basic Sentry functionality without the full package

export interface SentryBreadcrumb {
  category?: string;
  message?: string;
  level?: 'debug' | 'info' | 'warning' | 'error' | 'fatal';
  data?: Record<string, any>;
}

export interface SentryCaptureContext {
  level?: 'debug' | 'info' | 'warning' | 'error' | 'fatal';
  tags?: Record<string, string>;
  extra?: Record<string, any>;
}

export interface SentryConfig {
  dsn?: string;
  tracesSampleRate?: number;
  replaysSessionSampleRate?: number;
  replaysOnErrorSampleRate?: number;
  environment?: string;
  release?: string;
  debug?: boolean;
  captureUnhandledRejections?: boolean;
  beforeSend?: (event: any, hint?: any) => any;
  integrations?: any[];
  initialScope?: any;
}

// Mock Sentry functions
export const addBreadcrumb = (breadcrumb: SentryBreadcrumb): void => {
  if (process.env.NODE_ENV === 'development') {
    console.log('[Sentry Mock] Breadcrumb:', breadcrumb);
  }
};

export const captureMessage = (message: string, context?: SentryCaptureContext): void => {
  if (process.env.NODE_ENV === 'development') {
    console.log('[Sentry Mock] Message:', message, context);
  }
};

export const captureException = (error: Error | unknown, context?: SentryCaptureContext): void => {
  if (process.env.NODE_ENV === 'development') {
    console.error('[Sentry Mock] Exception:', error, context);
  }
};

export const init = (config: SentryConfig): void => {
  if (process.env.NODE_ENV === 'development') {
    console.log('[Sentry Mock] Initialized with config:', config);
  }
};

export const configureScope = (callback: (scope: any) => void): void => {
  if (process.env.NODE_ENV === 'development') {
    console.log('[Sentry Mock] Configure scope called');
  }
};

export const withScope = (callback: (scope: any) => void): void => {
  if (process.env.NODE_ENV === 'development') {
    console.log('[Sentry Mock] With scope called');
  }
};

export const setUser = (user: any): void => {
  if (process.env.NODE_ENV === 'development') {
    console.log('[Sentry Mock] Set user:', user);
  }
};

export const setContext = (key: string, context: any): void => {
  if (process.env.NODE_ENV === 'development') {
    console.log('[Sentry Mock] Set context:', key, context);
  }
};

// Mock integrations
export const Integrations = {
  Http: class MockHttp {
    constructor(config?: any) {
      if (process.env.NODE_ENV === 'development') {
        console.log('[Sentry Mock] Http integration created:', config);
      }
    }
  },
  BrowserTracing: class MockBrowserTracing {
    constructor(config?: any) {
      if (process.env.NODE_ENV === 'development') {
        console.log('[Sentry Mock] BrowserTracing integration created:', config);
      }
    }
  },
  Replay: class MockReplay {
    constructor(config?: any) {
      if (process.env.NODE_ENV === 'development') {
        console.log('[Sentry Mock] Replay integration created:', config);
      }
    }
  }
};

// Default export for compatibility
const Sentry = {
  addBreadcrumb,
  captureMessage,
  captureException,
  init,
  configureScope,
  withScope,
  setUser,
  setContext,
  Integrations,
};

export default Sentry;