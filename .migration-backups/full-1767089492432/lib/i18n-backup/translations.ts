export type Language = 'en' | 'fr' | 'ar';

export interface TranslationKeys {
  // Pages
  pages: {
    dashboard: {
      title: string;
      subtitle: string;
      welcomeBack: string;
      totalLofts: string;
      occupiedLofts: string;
      activeTasks: string;
      monthlyRevenue: string;
      teams: string;
      billMonitoring: string;
    };
    transactions: {
      title: string;
      subtitle: string;
      addNewTransaction: string;
      amount: string;
      category: string;
      description: string;
      income: string;
      expense: string;
    };
    reservations: {
      title: string;
      subtitle: string;
      totalReservations: string;
      monthlyRevenue: string;
      occupancyRate: string;
      guestSatisfaction: string;
      quickActions: string;
      recentActivity: string;
      newReservation: string;
      professionalTools: string;
      availabilityManagement: string;
      liveView: string;
      manageGuests: string;
      viewReports: string;
      checkInCompleted: string;
      reservationCancelled: string;
      reservationsList: string;
      advancedListView: string;
      advancedListDescription: string;
      reservationAnalytics: string;
      enterpriseAnalyticsSuite: string;
      enterpriseAnalyticsDescription: string;
    };
    // Add other pages...
  };
  
  // Common
  common: {
    actions: {
      add: string;
      edit: string;
      delete: string;
      save: string;
      cancel: string;
    };
    status: {
      active: string;
      inactive: string;
      pending: string;
      completed: string;
    };
    list: string;
    analytics: string;
    comingSoon: string;
    enterprise: string;
    vsLastMonth: string;
    timeAgo: {
      minutes: string;
      hours: string;
    };
  };
  
  // Navigation
  nav: {
    dashboard: string;
    transactions: string;
    lofts: string;
    teams: string;
    settings: string;
  };

  // Reservations specific
  reservations: {
    calendar: {
      title: string;
      month: string;
      week: string;
      day: string;
      agenda: string;
      event: string;
      noEventsInRange: string;
      allDay: string;
      work_week: string;
      yesterday: string;
      tomorrow: string;
      showMore: string;
    };
    status: {
      confirmed: string;
      pending: string;
      cancelled: string;
      completed: string;
    };
    availability: {
      management: string;
      blockDates: string;
      chooseLoft: string;
      endDate: string;
      maintenance: string;
      minimumStay: string;
      other: string;
      personalUse: string;
      priceOverride: string;
      priceOverridePlaceholder: string;
      reasonForBlocking: string;
      renovation: string;
      selectLoft: string;
      selectReason: string;
      startDate: string;
      unblockDates: string;
    };
    upcoming: {
      title: string;
      empty: string;
    };
    nights: string;
    form: {
      title: string;
      loft: string;
      selectLoft: string;
      guestCount: string;
      guest: string;
      guests: string;
      checkIn: string;
      checkOut: string;
      guestInfo: string;
      guestName: string;
      guestEmail: string;
      guestPhone: string;
      guestNationality: string;
      specialRequests: string;
      specialRequestsPlaceholder: string;
      checkingAvailability: string;
      notAvailable: string;
      available: string;
      basePrice: string;
      cleaningFee: string;
      serviceFee: string;
      taxes: string;
      total: string;
      creating: string;
      createReservation: string;
      errorCreating: string;
      successCreated: string;
      successDescription: string;
      propertyGuestDetails: string;
      stayDates: string;
      pricingBreakdown: string;
      availabilityPerfect: string;
      professional: string;
    };
  };
  internetConnections: {
    title: string;
    subtitle: string;
    createConnectionType: string;
    createConnectionTypeDescription: string;
    editConnectionType: string;
    updateConnectionInfo: string;
    addNewConnectionType: string;
    createNewConnectionType: string;
    connectionDetails: string;
    enterConnectionInfo: string;
    type: string;
    typePlaceholder: string;
    speed: string;
    speedPlaceholder: string;
    provider: string;
    providerPlaceholder: string;
    status: string;
    statusPlaceholder: string;
    cost: string;
    costPlaceholder: string;
    create: string;
    saveChanges: string;
    existingConnectionTypes: string;
    noConnectionTypesFound: string;
    addFirstConnection: string;
    loadError: string;
  };
}

export const defaultLanguage: Language = 'ar';
export const supportedLanguages: Language[] = ['en', 'fr', 'ar'];