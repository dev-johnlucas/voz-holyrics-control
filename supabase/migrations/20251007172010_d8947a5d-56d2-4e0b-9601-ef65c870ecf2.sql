-- Create table for storing user Holyrics configurations
CREATE TABLE public.user_holyrics_configs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  mode TEXT NOT NULL CHECK (mode IN ('local', 'web')),
  local_host TEXT,
  local_port INTEGER,
  token TEXT NOT NULL,
  api_key TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Enable Row Level Security
ALTER TABLE public.user_holyrics_configs ENABLE ROW LEVEL SECURITY;

-- Users can only view their own config
CREATE POLICY "Users can view their own Holyrics config" 
ON public.user_holyrics_configs 
FOR SELECT 
USING (auth.uid() = user_id);

-- Users can insert their own config
CREATE POLICY "Users can insert their own Holyrics config" 
ON public.user_holyrics_configs 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Users can update their own config
CREATE POLICY "Users can update their own Holyrics config" 
ON public.user_holyrics_configs 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Users can delete their own config
CREATE POLICY "Users can delete their own Holyrics config" 
ON public.user_holyrics_configs 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_user_holyrics_configs_updated_at
BEFORE UPDATE ON public.user_holyrics_configs
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();