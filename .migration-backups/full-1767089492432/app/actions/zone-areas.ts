"use server"

import { revalidatePath } from "next/cache";
import type { Database } from "@/lib/types"
import { createClient } from '@/utils/supabase/server'; // Import the new createClient

export type ZoneArea = Database['public']['Tables']['zone_areas']['Row']

export async function getZoneAreas(): Promise<ZoneArea[]> {
  const supabase = await createClient(); // Create client here
  const { data, error } = await supabase
    .from("zone_areas")
    .select("*")
    .order("name")

  if (error) {
    console.error("Error getting zone areas:", error);
    throw error;
  }

  return data;
}

export async function updateZoneArea(id: string, data: { name: string } | FormData) {
  const supabase = await createClient(); // Create client here
  const name = data instanceof FormData ? data.get("name") as string : data.name;

  if (!name || name.trim() === "") {
    return { error: "Zone area name cannot be empty." };
  }

  const { error } = await supabase
    .from("zone_areas")
    .update({ name })
    .eq("id", id)

  if (error) {
    if (error.code === '23505') { // Unique violation error code
      return { error: `Zone area '${name}' already exists.` };
    }
    console.error("Error updating zone area:", error);
    throw error;
  }

  revalidatePath("/settings/zone-areas");
  return { success: true };
}

export async function createZoneArea(data: { name: string } | FormData) {
  const supabase = await createClient(); // Create client here
  const name = data instanceof FormData ? data.get("name") as string : data.name;

  if (!name || name.trim() === "") {
    return { error: "Zone area name cannot be empty." };
  }

  const { error } = await supabase.from("zone_areas").insert({ name })

  if (error) {
    if (error.code === '23505') { // Unique violation error code
      return { error: `Zone area '${name}' already exists.` };
    }
    console.error("Error creating zone area:", error);
    throw error;
  }

  revalidatePath("/settings/zone-areas");
  return { success: true };
}

export async function deleteZoneArea(id: string) {
  const supabase = await createClient(); // Create client here
  const { error } = await supabase.from("zone_areas").delete().eq("id", id)

  if (error) {
    console.error("Error deleting zone area:", error);
    throw error;
  }

  revalidatePath("/settings/zone-areas");
  return { success: true };
}
