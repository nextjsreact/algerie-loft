-- Migration: add currency tracking columns to reservations
-- currency_code: ISO code of the currency used at booking time (e.g. 'EUR', 'USD', 'DZD')
-- currency_ratio: exchange rate to DA at the time of booking (e.g. 145.5 means 1 EUR = 145.5 DA)
-- price_per_night_input: the per-night price as entered by the user in the chosen currency

ALTER TABLE reservations
  ADD COLUMN IF NOT EXISTS currency_code VARCHAR(10) DEFAULT 'DZD',
  ADD COLUMN IF NOT EXISTS currency_ratio NUMERIC(12, 4) DEFAULT 1,
  ADD COLUMN IF NOT EXISTS price_per_night_input NUMERIC(12, 2) DEFAULT NULL;
