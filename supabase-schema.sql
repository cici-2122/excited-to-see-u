-- Database Schema for Couple GPS Tracker
-- Run this in your Supabase SQL Editor

-- Create the locations table
CREATE TABLE IF NOT EXISTS public.locations (
  user_id TEXT PRIMARY KEY,
  lat DOUBLE PRECISION NOT NULL,
  lng DOUBLE PRECISION NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

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
