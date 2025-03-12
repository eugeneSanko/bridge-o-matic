
-- Add raw_api_response column to completed_bridge_transactions table
ALTER TABLE public.completed_bridge_transactions 
ADD COLUMN IF NOT EXISTS raw_api_response JSONB;
