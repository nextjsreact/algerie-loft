import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { first_name, last_name, email, phone, nationality } = body;

    // Validation
    if (!first_name || !last_name || !email) {
      return NextResponse.json(
        { error: 'Missing required fields: first_name, last_name, email' },
        { status: 400 }
      );
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    // For now, always return mock response for testing
    const mockCustomer = {
      id: `customer-${Date.now()}`,
      first_name,
      last_name,
      email,
      phone: phone || null,
      nationality: nationality || null,
      status: 'prospect',
      language_preference: 'fr',
      currency_preference: 'DZD',
      created_at: new Date().toISOString()
    };

    return NextResponse.json({
      success: true,
      customer: mockCustomer,
      note: 'Mock response for testing - customer creation simulated'
    }, { status: 201 });

  } catch (error) {
    console.error('Customer API error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');

    if (!email) {
      return NextResponse.json(
        { error: 'Email parameter required' },
        { status: 400 }
      );
    }

    // Mock response for testing
    const mockCustomer = {
      id: `customer-mock-${email.replace('@', '-at-')}`,
      first_name: 'Mock',
      last_name: 'Customer',
      email,
      phone: '+213555000000',
      status: 'prospect',
      created_at: new Date().toISOString()
    };

    return NextResponse.json({ 
      customer: mockCustomer,
      note: 'Mock response for testing'
    });

  } catch (error) {
    console.error('Customer lookup error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}