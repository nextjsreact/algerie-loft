-- Add wifi_password column to lofts table
ALTER TABLE lofts 
ADD COLUMN IF NOT EXISTS wifi_password TEXT;

-- Add comment
COMMENT ON COLUMN lofts.wifi_password IS 'WiFi password for the loft (plain text for guest access)';

-- Example: Update a loft with WiFi password
-- UPDATE lofts SET wifi_password = 'YourWiFiPassword123' WHERE id = 'your-loft-id';
