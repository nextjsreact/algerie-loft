import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Get all amenities grouped by category
    const { data: amenities, error } = await supabase
      .from('loft_amenities')
      .select('id, name, category, icon, description')
      .order('category, name');

    if (error) {
      console.error("Error fetching amenities:", error);
      return NextResponse.json(
        { error: "Failed to fetch amenities" },
        { status: 500 }
      );
    }

    // Group amenities by category
    const groupedAmenities = (amenities || []).reduce((acc: any, amenity) => {
      if (!acc[amenity.category]) {
        acc[amenity.category] = [];
      }
      acc[amenity.category].push(amenity);
      return acc;
    }, {});

    return NextResponse.json({ 
      amenities: amenities || [],
      grouped: groupedAmenities
    });
  } catch (error) {
    console.error("Amenities API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}