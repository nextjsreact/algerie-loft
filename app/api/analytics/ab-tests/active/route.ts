import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // In a real implementation, you would fetch active A/B tests from your database
    // For now, return the default tests for dual-audience homepage
    
    const activeTests = [
      {
        id: 'homepage_hero_layout',
        name: 'Homepage Hero Layout Test',
        description: 'Test different hero section arrangements for guest vs owner focus',
        variants: [
          {
            id: 'control',
            name: 'Current Layout',
            description: 'Existing hero section layout',
            weight: 50,
            config: { layout: 'current' },
            isControl: true,
          },
          {
            id: 'guest_first',
            name: 'Guest-First Layout',
            description: 'Hero optimized for guest booking experience',
            weight: 50,
            config: { 
              layout: 'guest_first',
              heroHeadline: 'Réservez votre loft idéal en Algérie',
              ctaPrimary: 'Rechercher maintenant',
              searchWidgetPosition: 'prominent'
            },
            isControl: false,
          },
        ],
        trafficAllocation: 100,
        startDate: new Date().toISOString(),
        status: 'active',
        targetMetric: 'booking_conversion',
        minimumSampleSize: 1000,
        confidenceLevel: 95,
      },
      {
        id: 'cta_button_text',
        name: 'CTA Button Text Test',
        description: 'Test different call-to-action button texts',
        variants: [
          {
            id: 'control',
            name: 'Réserver maintenant',
            description: 'Current booking CTA text',
            weight: 33.33,
            config: { ctaText: 'Réserver maintenant' },
            isControl: true,
          },
          {
            id: 'variant_a',
            name: 'Voir disponibilités',
            description: 'Availability-focused CTA',
            weight: 33.33,
            config: { ctaText: 'Voir disponibilités' },
            isControl: false,
          },
          {
            id: 'variant_b',
            name: 'Découvrir nos lofts',
            description: 'Discovery-focused CTA',
            weight: 33.34,
            config: { ctaText: 'Découvrir nos lofts' },
            isControl: false,
          },
        ],
        trafficAllocation: 50,
        startDate: new Date().toISOString(),
        status: 'active',
        targetMetric: 'cta_click_rate',
        minimumSampleSize: 500,
        confidenceLevel: 95,
      },
      {
        id: 'owner_section_position',
        name: 'Owner Section Position Test',
        description: 'Test optimal positioning of property owner section',
        variants: [
          {
            id: 'control',
            name: 'After Trust Section',
            description: 'Owner section positioned after trust indicators',
            weight: 50,
            config: { ownerSectionPosition: 'after_trust' },
            isControl: true,
          },
          {
            id: 'variant',
            name: 'After Featured Lofts',
            description: 'Owner section positioned after featured lofts',
            weight: 50,
            config: { ownerSectionPosition: 'after_lofts' },
            isControl: false,
          },
        ],
        trafficAllocation: 30,
        startDate: new Date().toISOString(),
        status: 'active',
        targetMetric: 'owner_inquiry_rate',
        minimumSampleSize: 300,
        confidenceLevel: 90,
      },
    ];

    return NextResponse.json(activeTests);
  } catch (error) {
    console.error('[Analytics API] Error fetching active A/B tests:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}