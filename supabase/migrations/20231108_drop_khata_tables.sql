-- In case you need to rollback:
-- Drop tables in reverse order of dependencies
DROP TRIGGER IF EXISTS on_ledger_entry_insert ON public.ledger_entries;
DROP FUNCTION IF EXISTS public.update_contact_balance();
DROP TABLE IF EXISTS public.transaction_items;
DROP TABLE IF EXISTS public.transactions;
DROP TABLE IF EXISTS public.ledger_entries;
DROP TABLE IF EXISTS public.contacts;