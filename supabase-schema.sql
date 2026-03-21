-- Database Schema for Couple GPS Tracker
-- Run this in your Supabase SQL Editor

-- Create the locations table
CREATE TABLE IF NOT EXISTS public.locations (
  user_id TEXT PRIMARY KEY,
  lat DOUBLE PRECISION NOT NULL,
  lng DOUBLE PRECISION NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  session_id TEXT DEFAULT gen_random_uuid()
);

-- Add session_id column if table already exists (run separately if needed)
-- ALTER TABLE public.locations ADD COLUMN IF NOT EXISTS session_id TEXT DEFAULT gen_random_uuid();
-- UPDATE public.locations SET session_id = gen_random_uuid() WHERE session_id IS NULL;

-- Enable Row Level Security (RLS)
ALTER TABLE public.locations ENABLE ROW LEVEL SECURITY;

-- Create policy to allow all authenticated users to read all locations
-- Note: In a production app, you might want to restrict this more strictly
CREATE POLICY "Allow all authenticated users to read locations" 
ON public.locations 
FOR SELECT 
USING (true);

-- Create policy to allow all authenticated users to insert/update locations
CREATE POLICY "Allow all authenticated users to insert/update locations" 
ON public.locations 
FOR ALL 
USING (true);

-- Optional: Create an index on updated_at for better query performance
CREATE INDEX IF NOT EXISTS idx_locations_updated_at 
ON public.locations(updated_at DESC);
