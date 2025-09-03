import { getZoneAreas } from "@/app/actions/zone-areas";
import { ZoneAreasWrapper } from "@/components/settings/zone-areas-wrapper";

export default async function ZoneAreasPage() {
  const initialZoneAreas = await getZoneAreas();

  return (
    <ZoneAreasWrapper initialZoneAreas={initialZoneAreas} />
  );
}
