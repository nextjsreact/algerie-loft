/**
 * Dual-audience homepage type definitions
 * Supporting both guest and property owner experiences
 */

// ============================================================================
// GUEST EXPERIENCE TYPES
// ============================================================================

export interface GuestExperience {
  searchPreferences: SearchPreferences;
  viewingHistory: LoftView[];
  bookingProgress: BookingStep;
  preferences: UserPreferences;
}

export interface SearchPreferences {
  location?: string;
  dateRange?: DateRange;
  guestCount?: number;
  priceRange?: PriceRange;
  amenities?: string[];
}

export interface DateRange {
  startDate: Date;
  endDate: Date;
}

export interface PriceRange {
  min: number;
  max: number;
  currency: string;
}

export interface LoftView {
  loftId: string;
  viewedAt: Date;
  duration: number; // in seconds
}

export interface BookingStep {
  currentStep: 'search' | 'selection' | 'details' | 'payment' | 'confirmation';
  completedSteps: string[];
  selectedLoft?: string;
  searchCriteria?: SearchPreferences;
}

export interface UserPreferences {
  language: 'fr' | 'en' | 'ar';
  currency: string;
  notifications: boolean;
  theme: 'light' | 'dark' | 'auto';
}

// ============================================================================
// LOFT DATA TYPES
// ============================================================================

export interface LoftCard {
  id: string;
  title: string;
  location: string;
  pricePerNight: number;
  currency: string;
  rating: number;
  reviewCount: number;
  images: string[];
  amenities: string[];
  availability: AvailabilityStatus;
  instantBook: boolean;
  description?: string;
  maxGuests: number;
}

export interface AvailabilityStatus {
  isAvailable: boolean;
  nextAvailableDate?: Date;
  minimumStay: number;
  maxStay?: number;
}

export interface LoftAvailability {
  loftId: string;
  availableDates: Date[];
  pricing: DynamicPricing;
  instantBookable: boolean;
  minimumStay: number;
}

export interface DynamicPricing {
  basePrice: number;
  seasonalMultiplier: number;
  weekendMultiplier: number;
  currency: string;
  lastUpdated: Date;
}

// ============================================================================
// PROPERTY OWNER TYPES
// ============================================================================

export interface OwnerExperience {
  propertyId?: string;
  marketAnalysis: MarketAnalysis;
  revenueProjection: RevenueProjection;
  competitorAnalysis: CompetitorData[];
  partnershipStatus: PartnershipStatus;
}

export interface MarketAnalysis {
  averageRate: number;
  occupancyPotential: number;
  seasonalTrends: SeasonalData[];
  competitivePosition: 'low' | 'medium' | 'high';
}

export interface SeasonalData {
  month: number;
  occupancyRate: number;
  averagePrice: number;
  demand: 'low' | 'medium' | 'high';
}

export interface RevenueProjection {
  monthlyRevenue: number;
  annualRevenue: number;
  occupancyRate: number;
  averageDailyRate: number;
  currency: string;
  confidence: number; // 0-1
}

export interface CompetitorData {
  name: string;
  averagePrice: number;
  occupancyRate: number;
  rating: number;
  amenities: string[];
}

export interface PartnershipStatus {
  status: 'inquiry' | 'evaluation' | 'negotiation' | 'active' | 'inactive';
  applicationDate?: Date;
  evaluationScore?: number;
  contractStartDate?: Date;
}

// ============================================================================
// UI COMPONENT TYPES
// ============================================================================

export interface HeroSectionProps {
  primaryMessage: PrimaryMessage;
  searchWidget: SearchWidgetProps;
  featuredImage: string;
  trustBadges: TrustBadge[];
  locale: string;
}

export interface PrimaryMessage {
  headline: string;
  subheadline: string;
  ctaPrimary: string;
  ctaSecondary: string;
}

export interface SearchWidgetProps {
  location: LocationSelector;
  dates: DateRangePicker;
  guests: GuestCounter;
  instantSearch: boolean;
  onSearch: (criteria: SearchPreferences) => void;
}

export interface LocationSelector {
  selectedLocation?: string;
  availableLocations: Location[];
  placeholder: string;
}

export interface Location {
  id: string;
  name: string;
  region: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
}

export interface DateRangePicker {
  startDate?: Date;
  endDate?: Date;
  minDate: Date;
  maxDate: Date;
  placeholder: string;
}

export interface GuestCounter {
  adults: number;
  children: number;
  maxGuests: number;
}

export interface TrustBadge {
  id: string;
  name: string;
  icon: string;
  description: string;
  verified: boolean;
}

// ============================================================================
// FEATURED LOFTS SECTION TYPES
// ============================================================================

export interface FeaturedLoftsProps {
  lofts: LoftCard[];
  filters: FilterOptions;
  sortOptions: SortOption[];
  viewMode: 'grid' | 'list' | 'map';
  onFilterChange: (filters: FilterOptions) => void;
  onSortChange: (sort: SortOption) => void;
  onViewModeChange: (mode: 'grid' | 'list' | 'map') => void;
}

export interface FilterOptions {
  priceRange?: PriceRange;
  amenities?: string[];
  location?: string[];
  rating?: number;
  instantBook?: boolean;
  availability?: {
    startDate: Date;
    endDate: Date;
  };
}

export interface SortOption {
  key: 'price' | 'rating' | 'availability' | 'popularity';
  direction: 'asc' | 'desc';
  label: string;
}

// ============================================================================
// TRUST & SOCIAL PROOF TYPES
// ============================================================================

export interface TrustSectionProps {
  guestReviews: Review[];
  certifications: Certification[];
  stats: TrustStats;
  guarantees: Guarantee[];
  locale: string;
}

export interface Review {
  id: string;
  guestName: string;
  guestAvatar?: string;
  rating: number;
  comment: string;
  loftName: string;
  stayDate: Date;
  verified: boolean;
  photos?: string[];
}

export interface Certification {
  id: string;
  name: string;
  issuer: string;
  icon: string;
  validUntil?: Date;
  description: string;
}

export interface TrustStats {
  totalGuests: number;
  averageRating: number;
  loftsAvailable: number;
  yearsExperience: number;
  satisfactionRate: number;
}

export interface Guarantee {
  id: string;
  title: string;
  description: string;
  icon: string;
  coverage: string;
}

// ============================================================================
// PROPERTY OWNER SECTION TYPES
// ============================================================================

export interface OwnerSectionProps {
  revenueMetrics: RevenueMetrics;
  services: OwnerService[];
  caseStudies: CaseStudy[];
  ctaButton: CTAButton;
  locale: string;
}

export interface RevenueMetrics {
  averageIncrease: string;
  occupancyRate: string;
  averageRevenue: string;
  managedProperties: number;
  totalRevenue: string;
}

export interface OwnerService {
  id: string;
  title: string;
  description: string;
  icon: string;
  features: string[];
  pricing?: string;
}

export interface CaseStudy {
  id: string;
  propertyName: string;
  location: string;
  beforeRevenue: number;
  afterRevenue: number;
  timeframe: string;
  improvements: string[];
  ownerTestimonial?: string;
  images?: string[];
}

export interface CTAButton {
  text: string;
  action: 'modal' | 'page';
  href?: string;
  onClick?: () => void;
}

// ============================================================================
// RESPONSIVE GRID SYSTEM TYPES
// ============================================================================

export interface GridSystemProps {
  children: React.ReactNode;
  columns?: {
    mobile: number;
    tablet: number;
    desktop: number;
  };
  gap?: {
    mobile: string;
    tablet: string;
    desktop: string;
  };
  className?: string;
}

export interface ResponsiveBreakpoints {
  mobile: string;
  tablet: string;
  desktop: string;
}

// ============================================================================
// ANALYTICS & CONVERSION TYPES
// ============================================================================

export interface ConversionMetrics {
  guestConversions: {
    searchToView: number;
    viewToInquiry: number;
    inquiryToBooking: number;
  };
  ownerConversions: {
    visitToInquiry: number;
    inquiryToEvaluation: number;
    evaluationToPartnership: number;
  };
}

export interface UserFlow {
  sessionId: string;
  userType: 'guest' | 'owner' | 'unknown';
  steps: FlowStep[];
  startTime: Date;
  endTime?: Date;
  converted: boolean;
  conversionType?: 'booking' | 'inquiry' | 'partnership';
}

export interface FlowStep {
  action: string;
  timestamp: Date;
  section: string;
  data?: Record<string, any>;
}