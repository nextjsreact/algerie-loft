import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth';
import { createClient } from '@/utils/supabase/server';

// PATCH /api/partner/properties/[id]/status - Update property status
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await requireRole(['partner']);
    const { id } = params;
    const body = await request.json();

    const {
      status,
      is_published,
      price_per_night,
      price_per_month,
      maintenance_notes,
      availability_notes,
    } = body;

    const supabase = await createClient();

    // Verify ownership first
    const { data: existingProperty, error: fetchError } = await supabase
      .from('lofts')
      .select('id, partner_id, status')
      .eq('id', id)
      .eq('partner_id', session.user.id)
      .single();

    if (fetchError || !existingProperty) {
      return NextResponse.json(
        { error: 'Property not found' },
        { status: 404 }
      );
    }

    // Prepare update data
    const updateData: any = {
      updated_at: new Date().toISOString(),
    };

    if (status !== undefined) {
      updateData.status = status;
      
      // Auto-unpublish if setting to maintenance
      if (status === 'maintenance') {
        updateData.is_published = false;
      }
    }

    if (is_published !== undefined && status !== 'maintenance') {
      updateData.is_published = is_published;
    }

    if (price_per_night !== undefined) {
      updateData.price_per_night = price_per_night;
    }

    if (price_per_month !== undefined) {
      updateData.price_per_month = price_per_month;
    }

    if (maintenance_notes !== undefined) {
      updateData.maintenance_notes = maintenance_notes;
    }

    if (availability_notes !== undefined) {
      updateData.availability_notes = availability_notes;
    }

    // Update the property
    const { data: property, error } = await supabase
      .from('lofts')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating property status:', error);
      return NextResponse.json(
        { error: 'Failed to update property status' },
        { status: 500 }
      );
    }

    // If property is being set to maintenance, cancel pending bookings
    if (status === 'maintenance' && existingProperty.status !== 'maintenance') {
      const { error: cancelError } = await supabase
        .from('bookings')
        .update({
          status: 'cancelled',
          cancellation_reason: 'Property under maintenance',
          cancelled_at: new Date().toISOString(),
        })
        .eq('loft_id', id)
        .eq('status', 'pending');

      if (cancelError) {
        console.error('Error cancelling bookings:', cancelError);
        // Don't fail the request, just log the error
      }
    }

    return NextResponse.json({
      success: true,
      property,
    });

  } catch (error) {
    console.error('Error in PATCH /api/partner/properties/[id]/status:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}