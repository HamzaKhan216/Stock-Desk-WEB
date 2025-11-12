-- Create contacts table
CREATE TABLE public.contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  phone_number TEXT,
  contact_type TEXT NOT NULL CHECK (contact_type IN ('customer', 'supplier')),
  current_balance DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add security policies for contacts
ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "contacts_select_own" ON public.contacts 
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "contacts_insert_own" ON public.contacts 
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "contacts_update_own" ON public.contacts 
  FOR UPDATE USING (auth.uid() = user_id);

-- Create ledger_entries table
CREATE TABLE public.ledger_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_id UUID NOT NULL REFERENCES public.contacts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount DECIMAL(10, 2) NOT NULL,
  entry_type TEXT NOT NULL CHECK (entry_type IN ('credit_given', 'payment_received')),
  description TEXT,
  transaction_date TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add security policies for ledger_entries
ALTER TABLE public.ledger_entries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ledger_entries_select_own" ON public.ledger_entries 
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "ledger_entries_insert_own" ON public.ledger_entries 
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create transactions table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.transactions (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    subtotal DECIMAL(10, 2) NOT NULL,
    discount_percent DECIMAL(5, 2) NOT NULL DEFAULT 0,
    total DECIMAL(10, 2) NOT NULL,
    contact_id UUID REFERENCES public.contacts(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create transaction_items table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.transaction_items (
    id SERIAL PRIMARY KEY,
    transaction_id INTEGER NOT NULL REFERENCES public.transactions(id) ON DELETE CASCADE,
    product_sku TEXT NOT NULL,
    name TEXT NOT NULL,
    quantity_sold INTEGER NOT NULL,
    price_per_item DECIMAL(10, 2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add RLS to transactions
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "transactions_select_own" ON public.transactions
    FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "transactions_insert_own" ON public.transactions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Add RLS to transaction_items
ALTER TABLE public.transaction_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "transaction_items_select_through_transaction" ON public.transaction_items
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.transactions
            WHERE id = transaction_items.transaction_id
            AND user_id = auth.uid()
        )
    );
CREATE POLICY "transaction_items_insert_through_transaction" ON public.transaction_items
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.transactions
            WHERE id = transaction_items.transaction_id
            AND user_id = auth.uid()
        )
    );

-- Create trigger function to update contact balance
CREATE OR REPLACE FUNCTION public.update_contact_balance()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.entry_type = 'credit_given' THEN
      -- Customer owes more
      UPDATE public.contacts
      SET current_balance = current_balance + NEW.amount
      WHERE id = NEW.contact_id;
    ELSIF NEW.entry_type = 'payment_received' THEN
      -- Customer paid back
      UPDATE public.contacts
      SET current_balance = current_balance - NEW.amount
      WHERE id = NEW.contact_id;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger
CREATE TRIGGER on_ledger_entry_insert
  AFTER INSERT ON public.ledger_entries
  FOR EACH ROW
  EXECUTE FUNCTION public.update_contact_balance();