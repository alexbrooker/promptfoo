-- Create user_datasets mapping table for redteam phase separation
-- This maps promptfoo dataset IDs to users without modifying core promptfoo schema

CREATE TABLE user_datasets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  dataset_id TEXT NOT NULL, -- Maps to promptfoo datasetsTable.id
  metadata JSONB DEFAULT '{}', -- Store config details for display
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Ensure unique mapping per user-dataset combination
  UNIQUE(user_id, dataset_id)
);

-- Indexes for performance
CREATE INDEX user_datasets_user_id_idx ON user_datasets(user_id);
CREATE INDEX user_datasets_dataset_id_idx ON user_datasets(dataset_id);
CREATE INDEX user_datasets_created_at_idx ON user_datasets(created_at);

-- Enable RLS for security
ALTER TABLE user_datasets ENABLE ROW LEVEL SECURITY;

-- RLS Policy - users can only see their own datasets
CREATE POLICY "Users can only see their own datasets" ON user_datasets
  FOR ALL USING (auth.uid() = user_id);

-- Function to update updated_at timestamp (for future use)
CREATE OR REPLACE FUNCTION update_user_datasets_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.created_at = COALESCE(NEW.created_at, NOW());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Optional: Job phase tracking for billing separation
CREATE TABLE user_job_phases (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  job_id TEXT NOT NULL,
  phase TEXT NOT NULL CHECK (phase IN ('generation', 'execution')),
  dataset_id TEXT,
  credits_consumed INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for job phase tracking
CREATE INDEX user_job_phases_user_id_idx ON user_job_phases(user_id);
CREATE INDEX user_job_phases_job_id_idx ON user_job_phases(job_id);
CREATE INDEX user_job_phases_dataset_id_idx ON user_job_phases(dataset_id);
CREATE INDEX user_job_phases_phase_idx ON user_job_phases(phase);

-- Enable RLS for job phases
ALTER TABLE user_job_phases ENABLE ROW LEVEL SECURITY;

-- RLS Policy for job phases
CREATE POLICY "Users can only see their own job phases" ON user_job_phases
  FOR ALL USING (auth.uid() = user_id);

-- Add helpful comments
COMMENT ON TABLE user_datasets IS 'Maps promptfoo dataset IDs to users for redteam phase separation';
COMMENT ON COLUMN user_datasets.dataset_id IS 'References the ID from promptfoo datasetsTable';
COMMENT ON COLUMN user_datasets.metadata IS 'Stores display info: test_count, plugins, strategies, original_config';

COMMENT ON TABLE user_job_phases IS 'Tracks generation vs execution phases for billing separation';
COMMENT ON COLUMN user_job_phases.phase IS 'Either generation or execution phase';
COMMENT ON COLUMN user_job_phases.credits_consumed IS 'Credits consumed for this specific phase';