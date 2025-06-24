-- Create user_configs mapping table for per-user test plan isolation
-- This maps promptfoo config IDs to users without modifying core promptfoo schema

CREATE TABLE user_configs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  config_id TEXT NOT NULL, -- Maps to promptfoo configsTable.id
  config_type TEXT NOT NULL DEFAULT 'redteam',
  config_name TEXT, -- Cached name for faster queries
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Ensure one user can't claim the same config twice
  UNIQUE(user_id, config_id)
);

-- Indexes for performance
CREATE INDEX user_configs_user_id_idx ON user_configs(user_id);
CREATE INDEX user_configs_config_id_idx ON user_configs(config_id);
CREATE INDEX user_configs_type_idx ON user_configs(config_type);
CREATE INDEX user_configs_user_type_idx ON user_configs(user_id, config_type);

-- Enable RLS
ALTER TABLE user_configs ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can only see their own config mappings" ON user_configs
  FOR ALL USING (auth.uid() = user_id);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_user_configs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at
CREATE TRIGGER update_user_configs_updated_at
  BEFORE UPDATE ON user_configs
  FOR EACH ROW
  EXECUTE FUNCTION update_user_configs_updated_at();

-- Add helpful comments
COMMENT ON TABLE user_configs IS 'Maps promptfoo config IDs to users for per-user test plan isolation';
COMMENT ON COLUMN user_configs.config_id IS 'References the ID from promptfoo configsTable';
COMMENT ON COLUMN user_configs.config_name IS 'Cached config name for faster display without joining';