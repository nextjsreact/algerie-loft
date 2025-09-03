ALTER TABLE lofts
ADD COLUMN IF NOT EXISTS zone_area_id UUID REFERENCES zone_areas(id);
