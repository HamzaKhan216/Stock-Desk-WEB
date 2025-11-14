-- Migration: Add units_per_item, loose_price_per_unit and convert quantities to NUMERIC
-- Run this in your Supabase SQL editor. Review and backup before applying.

DO $main_block$
BEGIN

-- Add new columns if missing
ALTER TABLE IF EXISTS public.products
    ADD COLUMN IF NOT EXISTS units_per_item INTEGER NOT NULL DEFAULT 1 CHECK (units_per_item > 0),
    ADD COLUMN IF NOT EXISTS loose_price_per_unit NUMERIC NOT NULL DEFAULT 0 CHECK (loose_price_per_unit >= 0);

-- Convert quantity to NUMERIC if currently INTEGER
DO $$
BEGIN
    IF EXISTS(
        SELECT 1 FROM information_schema.columns
        WHERE table_name='products' AND column_name='quantity' AND data_type='integer'
    ) THEN
        ALTER TABLE public.products ALTER COLUMN quantity TYPE NUMERIC USING quantity::NUMERIC;
    END IF;
END $$;

-- Convert transaction_items.quantity_sold to NUMERIC if currently INTEGER
DO $$
BEGIN
    IF EXISTS(
        SELECT 1 FROM information_schema.columns
        WHERE table_name='transaction_items' AND column_name='quantity_sold' AND data_type='integer'
    ) THEN
        ALTER TABLE public.transaction_items ALTER COLUMN quantity_sold TYPE NUMERIC USING quantity_sold::NUMERIC;
    END IF;
END $$;

-- (Optional) Add cost_price and sale_unit to transaction_items for historical accuracy
-- Uncomment if you want to persist cost price and sale unit per item
-- ALTER TABLE IF EXISTS public.transaction_items
--     ADD COLUMN IF NOT EXISTS cost_price NUMERIC,
--     ADD COLUMN IF NOT EXISTS sale_unit TEXT CHECK (sale_unit IN ('box','loose'));

END;
$main_block$;
