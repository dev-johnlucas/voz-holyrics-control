-- Remove insecure 'churches' table if it exists
-- This table was exposing sensitive API credentials publicly

DROP TABLE IF EXISTS public.churches CASCADE;