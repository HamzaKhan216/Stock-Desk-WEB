-- Migration: add expiry_date to products

ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS expiry_date TIMESTAMPTZ;

-- Optional: backfill from local JSON or external source if needed.
-- Example to set expiry_date for a given SKU (run as needed):
-- UPDATE public.products SET expiry_date = '2025-11-20' WHERE sku = 'SKU123';
