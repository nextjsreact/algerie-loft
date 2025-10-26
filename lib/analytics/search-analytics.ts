import { trackEvent } from './gtag';

export interface SearchQuery {
  id: string;
  query: string;
  filters: SearchFilters;
  timestamp: Date;
  userId: string;
  sessionId: string;
  resultsCount: number;
  resultIds: string[];
  searchDuration: number;
  source: 'homepage' | 'search_page' | 'navigation' | 'autocomplete';
}

export interface SearchFilters {
  location?: string;
  dateRange?: {
    checkIn: Date;
    checkOut: Date;
  };
  guestCount?: number;
  priceRange?: {
    min: number;
    max: number;
  };
  amenities?: string[];
  propertyType?: string[];
  rating?: number;
  instantBook?: boolean;
}

export interface SearchResult {
  id: string;
  queryId: string;
  loftId: string;
  position: number;
  clicked: boolean;
  clickedAt?: Date;
  viewDuration?: number;
  booked: boolean;
  bookedAt?: Date;
}

export interface SearchConversion {
  queryId: string;
  loftId: string;
  conversionType: 'view' | 'inquiry' | 'booking' | 'favorite';
  timestamp: Date;
  value?: number;
  metadata?: Record<string, any>;
}

export interface SearchPattern {
  userId: string;
  sessionId: string;
  searchSequence: SearchQuery[];
  totalSearches: number;
  uniqueQueries: number;
  averageResultsPerSearch: number;
  mostUsedFilters: string[];
  conversionRate: number;
  timeToConversion?: number;
  abandonmentPoint?: string;
}

export interface PopularSearch {
  query: string;
  filters: SearchFilters;
  frequency: number;
  conversionRate: number;
  averageResultsCount: number;
  lastUsed: Date;
}

export class SearchAnalytics {
  private static instance: SearchAnalytics;
  private currentQuery: SearchQuery | null = null;
  private searchHistory: SearchQuery[] = [];
  private searchResults: Map<string, SearchResult[]> = new Map();
  private userId: string = '';
  private sessionId: string = '';

  static getInstance(): SearchAnalytics {
    if (!SearchAnalytics.instance) {
      SearchAnalytics.instance = new SearchAnalytics();
    }
    return SearchAnalytics.instance;
  }

  // Initialize search analytics
  init(userId?: string, sessionId?: string) {
    if (typeof window === 'undefined') return;

    this.userId = userId || this.generateUserId();
    this.sessionId = sessionId || this.generateSessionId();

    // Load search history from storage
    this.loadSearchHistory();

    console.log('[Search Analytics] Initialized');
  }

  // Generate unique user ID
  private generateUserId(): string {
    let userId = localStorage.getItem('search_user_id');
    if (!userId) {
      userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      localStorage.setItem('search_user_id', userId);
    }
    return userId;
  }

  // Generate session ID
  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Load search history from storage
  private loadSearchHistory() {
    if (typeof window === 'undefined') return;

    const stored = sessionStorage.getItem('search_history');
    if (stored) {
      try {
        this.searchHistory = JSON.parse(stored).map((item: any) => ({
          ...item,
          timestamp: new Date(item.timestamp),
          filters: {
            ...item.filters,
            dateRange: item.filters.dateRange ? {
              checkIn: new Date(item.filters.dateRange.checkIn),
              checkOut: new Date(item.filters.dateRange.checkOut),
            } : undefined,
          },
        }));
      } catch (error) {
        console.error('Failed to load search history:', error);
      }
    }
  }

  // Save search history to storage
  private saveSearchHistory() {
    if (typeof window === 'undefined') return;

    sessionStorage.setItem('search_history', JSON.stringify(this.searchHistory));
  }

  // Start tracking a search query
  startSearch(
    query: string,
    filters: SearchFilters,
    source: SearchQuery['source'] = 'homepage'
  ): string {
    const searchId = `search_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const startTime = Date.now();

    this.currentQuery = {
      id: searchId,
      query: query.trim().toLowerCase(),
      filters: { ...filters },
      timestamp: new Date(),
      userId: this.userId,
      sessionId: this.sessionId,
      resultsCount: 0,
      resultIds: [],
      searchDuration: 0,
      source,
    };

    // Track search start event
    trackEvent('search_start', 'search', 'search_initiated', query, 1, {
      search_id: searchId,
      source,
      has_filters: Object.keys(filters).length > 0,
      filter_count: Object.keys(filters).length,
      location: filters.location,
      guest_count: filters.guestCount,
      has_date_range: !!filters.dateRange,
      has_price_range: !!filters.priceRange,
      amenities_count: filters.amenities?.length || 0,
    });

    console.log(`[Search Analytics] Search started: ${searchId} - "${query}"`);
    return searchId;
  }

  // Complete search with results
  completeSearch(searchId: string, results: { id: string; [key: string]: any }[]) {
    if (!this.currentQuery || this.currentQuery.id !== searchId) {
      console.warn(`[Search Analytics] No active search found for ID: ${searchId}`);
      return;
    }

    const endTime = Date.now();
    const searchDuration = endTime - this.currentQuery.timestamp.getTime();

    // Update current query with results
    this.currentQuery.resultsCount = results.length;
    this.currentQuery.resultIds = results.map(r => r.id);
    this.currentQuery.searchDuration = searchDuration;

    // Add to search history
    this.searchHistory.push({ ...this.currentQuery });
    this.saveSearchHistory();

    // Initialize search results tracking
    const searchResults: SearchResult[] = results.map((result, index) => ({
      id: `result_${searchId}_${index}`,
      queryId: searchId,
      loftId: result.id,
      position: index + 1,
      clicked: false,
      booked: false,
    }));

    this.searchResults.set(searchId, searchResults);

    // Track search completion event
    trackEvent('search_complete', 'search', 'search_completed', this.currentQuery.query, results.length, {
      search_id: searchId,
      results_count: results.length,
      search_duration: searchDuration,
      source: this.currentQuery.source,
      has_results: results.length > 0,
      filters_used: Object.keys(this.currentQuery.filters).length,
    });

    // Send search data to API
    this.sendSearchToAPI(this.currentQuery);

    console.log(`[Search Analytics] Search completed: ${searchId} - ${results.length} results in ${searchDuration}ms`);

    // Clear current query
    this.currentQuery = null;
  }

  // Track search result click
  trackResultClick(searchId: string, loftId: string, position: number) {
    const results = this.searchResults.get(searchId);
    if (!results) return;

    const result = results.find(r => r.loftId === loftId);
    if (!result) return;

    result.clicked = true;
    result.clickedAt = new Date();

    // Track click event
    trackEvent('search_result_click', 'search', 'result_click', loftId, position, {
      search_id: searchId,
      loft_id: loftId,
      position,
      click_timestamp: Date.now(),
    });

    // Send click data to API
    this.sendResultClickToAPI(searchId, loftId, position);

    console.log(`[Search Analytics] Result clicked: ${loftId} at position ${position}`);
  }

  // Track search result view duration
  trackResultView(searchId: string, loftId: string, viewDuration: number) {
    const results = this.searchResults.get(searchId);
    if (!results) return;

    const result = results.find(r => r.loftId === loftId);
    if (!result) return;

    result.viewDuration = viewDuration;

    // Track view event
    trackEvent('search_result_view', 'search', 'result_view', loftId, viewDuration, {
      search_id: searchId,
      loft_id: loftId,
      view_duration: viewDuration,
      position: result.position,
    });
  }

  // Track search conversion
  trackConversion(
    searchId: string,
    loftId: string,
    conversionType: SearchConversion['conversionType'],
    value?: number,
    metadata?: Record<string, any>
  ) {
    const results = this.searchResults.get(searchId);
    if (results) {
      const result = results.find(r => r.loftId === loftId);
      if (result && conversionType === 'booking') {
        result.booked = true;
        result.bookedAt = new Date();
      }
    }

    const conversion: SearchConversion = {
      queryId: searchId,
      loftId,
      conversionType,
      timestamp: new Date(),
      value,
      metadata,
    };

    // Track conversion event
    trackEvent('search_conversion', 'search', conversionType, loftId, value || 1, {
      search_id: searchId,
      loft_id: loftId,
      conversion_type: conversionType,
      conversion_value: value,
      ...metadata,
    });

    // Send conversion data to API
    this.sendConversionToAPI(conversion);

    console.log(`[Search Analytics] Conversion tracked: ${conversionType} for ${loftId}`);
  }

  // Track search abandonment
  trackSearchAbandonment(searchId: string, abandonmentPoint: string) {
    trackEvent('search_abandonment', 'search', 'abandonment', abandonmentPoint, 1, {
      search_id: searchId,
      abandonment_point: abandonmentPoint,
      timestamp: Date.now(),
    });

    console.log(`[Search Analytics] Search abandoned at: ${abandonmentPoint}`);
  }

  // Track filter usage
  trackFilterUsage(filterType: string, filterValue: any, searchId?: string) {
    trackEvent('search_filter_usage', 'search', 'filter_used', filterType, 1, {
      search_id: searchId,
      filter_type: filterType,
      filter_value: typeof filterValue === 'object' ? JSON.stringify(filterValue) : filterValue,
    });
  }

  // Track autocomplete usage
  trackAutocomplete(query: string, suggestion: string, position: number) {
    trackEvent('search_autocomplete', 'search', 'autocomplete_select', suggestion, position, {
      original_query: query,
      selected_suggestion: suggestion,
      suggestion_position: position,
    });
  }

  // Get search patterns for current session
  getSearchPatterns(): SearchPattern {
    const searches = this.searchHistory;
    const uniqueQueries = new Set(searches.map(s => s.query)).size;
    const totalResults = searches.reduce((sum, s) => sum + s.resultsCount, 0);
    const averageResults = searches.length > 0 ? totalResults / searches.length : 0;

    // Calculate most used filters
    const filterUsage: Record<string, number> = {};
    searches.forEach(search => {
      Object.keys(search.filters).forEach(filter => {
        filterUsage[filter] = (filterUsage[filter] || 0) + 1;
      });
    });

    const mostUsedFilters = Object.entries(filterUsage)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([filter]) => filter);

    // Calculate conversion rate
    const conversions = Array.from(this.searchResults.values())
      .flat()
      .filter(result => result.booked).length;
    const totalClicks = Array.from(this.searchResults.values())
      .flat()
      .filter(result => result.clicked).length;
    const conversionRate = totalClicks > 0 ? (conversions / totalClicks) * 100 : 0;

    return {
      userId: this.userId,
      sessionId: this.sessionId,
      searchSequence: searches,
      totalSearches: searches.length,
      uniqueQueries,
      averageResultsPerSearch: averageResults,
      mostUsedFilters,
      conversionRate,
    };
  }

  // Get popular searches (would typically come from API)
  async getPopularSearches(): Promise<PopularSearch[]> {
    try {
      const response = await fetch('/api/analytics/popular-searches');
      return await response.json();
    } catch (error) {
      console.error('Failed to fetch popular searches:', error);
      return this.getDefaultPopularSearches();
    }
  }

  // Get default popular searches
  private getDefaultPopularSearches(): PopularSearch[] {
    return [
      {
        query: 'loft alger centre',
        filters: { location: 'Alger Centre' },
        frequency: 150,
        conversionRate: 12.5,
        averageResultsCount: 8,
        lastUsed: new Date(),
      },
      {
        query: 'loft oran',
        filters: { location: 'Oran' },
        frequency: 120,
        conversionRate: 15.2,
        averageResultsCount: 6,
        lastUsed: new Date(),
      },
      {
        query: 'loft constantine',
        filters: { location: 'Constantine' },
        frequency: 95,
        conversionRate: 18.7,
        averageResultsCount: 4,
        lastUsed: new Date(),
      },
    ];
  }

  // Send search data to API
  private async sendSearchToAPI(query: SearchQuery) {
    try {
      await fetch('/api/analytics/searches', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(query),
      });
    } catch (error) {
      console.error('Failed to send search data:', error);
    }
  }

  // Send result click to API
  private async sendResultClickToAPI(searchId: string, loftId: string, position: number) {
    try {
      await fetch('/api/analytics/search-clicks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          searchId,
          loftId,
          position,
          timestamp: new Date(),
        }),
      });
    } catch (error) {
      console.error('Failed to send click data:', error);
    }
  }

  // Send conversion data to API
  private async sendConversionToAPI(conversion: SearchConversion) {
    try {
      await fetch('/api/analytics/search-conversions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(conversion),
      });
    } catch (error) {
      console.error('Failed to send conversion data:', error);
    }
  }

  // Clear search history
  clearHistory() {
    this.searchHistory = [];
    this.searchResults.clear();
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('search_history');
    }
  }

  // Get search history
  getSearchHistory(): SearchQuery[] {
    return [...this.searchHistory];
  }

  // Get current search
  getCurrentSearch(): SearchQuery | null {
    return this.currentQuery;
  }
}

// Initialize search analytics
export function initSearchAnalytics(userId?: string, sessionId?: string) {
  if (typeof window === 'undefined') return null;

  const analytics = SearchAnalytics.getInstance();
  analytics.init(userId, sessionId);
  return analytics;
}

// Convenience functions
export const startSearch = (query: string, filters: SearchFilters, source?: SearchQuery['source']) => {
  return SearchAnalytics.getInstance().startSearch(query, filters, source);
};

export const completeSearch = (searchId: string, results: { id: string; [key: string]: any }[]) => {
  return SearchAnalytics.getInstance().completeSearch(searchId, results);
};

export const trackResultClick = (searchId: string, loftId: string, position: number) => {
  return SearchAnalytics.getInstance().trackResultClick(searchId, loftId, position);
};

export const trackResultView = (searchId: string, loftId: string, viewDuration: number) => {
  return SearchAnalytics.getInstance().trackResultView(searchId, loftId, viewDuration);
};

export const trackSearchConversion = (
  searchId: string,
  loftId: string,
  conversionType: SearchConversion['conversionType'],
  value?: number,
  metadata?: Record<string, any>
) => {
  return SearchAnalytics.getInstance().trackConversion(searchId, loftId, conversionType, value, metadata);
};

export const trackFilterUsage = (filterType: string, filterValue: any, searchId?: string) => {
  return SearchAnalytics.getInstance().trackFilterUsage(filterType, filterValue, searchId);
};

export const trackAutocomplete = (query: string, suggestion: string, position: number) => {
  return SearchAnalytics.getInstance().trackAutocomplete(query, suggestion, position);
};

export const getSearchPatterns = () => {
  return SearchAnalytics.getInstance().getSearchPatterns();
};