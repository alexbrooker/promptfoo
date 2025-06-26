# Red Team Phase Separation Proposal - Ultra-Simplified Version

## Overview

This document proposes an **ultra-simplified enhancement** to promptfoo's red team functionality by separating test generation from execution using **only Supabase mapping tables**. This approach maintains full upstream compatibility and removes all approval workflows for maximum simplicity.

## Current Architecture Analysis

### Two-Phase Process
The current red team system operates in two distinct phases:

1. **Phase 1: Test Generation** (`src/redteam/index.ts`)
   - Plugin-based test generation using security attack patterns
   - Strategy application (multilingual, jailbreak, retry, etc.)
   - Outputs expanded test cases to temporary YAML file

2. **Phase 2: Evaluation Execution** (`src/redteam/shared.ts`)
   - Loads expanded test cases from temporary file
   - Executes tests against target providers
   - Stores results in database

### Existing User Isolation Strategy
The system **already uses mapping tables** for user isolation:
- **Location**: Supabase `user_configs` table maps promptfoo `configsTable.id` to `profiles.id`
- **Results**: Filtered by `evalsTable.author` field 
- **No Core Schema Changes**: Core promptfoo SQLite schema remains unchanged

### Dataset Persistence
The system already persists expanded test sets as datasets:
- **Location**: `datasetsTable` in Drizzle SQLite database
- **Content**: Fully expanded test cases (not original plugin configs)
- **ID**: SHA256 hash of serialized test cases for deduplication
- **Relationships**: Linked to evaluations via `evalsToDatasetsTable`

## Ultra-Simplified Enhancement Proposal

### Goals
- **Upstream Compatibility**: Zero changes to core promptfoo schema
- **Cost Control**: Separate billing for generation vs execution
- **Transparency**: Users see exactly what tests will be run
- **Reusability**: Execute same dataset against multiple targets
- **Maximum Simplicity**: No approval workflows or complex state management

### Architecture Changes (Supabase Only)

#### 1. User-Dataset Mapping Table
```sql
-- supabase/migrations/user_datasets_table.sql
CREATE TABLE user_datasets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  dataset_id TEXT NOT NULL, -- Maps to promptfoo datasetsTable.id
  metadata JSONB DEFAULT '{}', -- Store config details for display
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(user_id, dataset_id)
);

-- Indexes for performance
CREATE INDEX user_datasets_user_id_idx ON user_datasets(user_id);
CREATE INDEX user_datasets_dataset_id_idx ON user_datasets(dataset_id);

-- Enable RLS
ALTER TABLE user_datasets ENABLE ROW LEVEL SECURITY;

-- RLS Policy
CREATE POLICY "Users can only see their own datasets" ON user_datasets
  FOR ALL USING (auth.uid() = user_id);
```

#### 2. Enhanced Job Tracking (Optional)
```sql
-- Simple job phase tracking for billing
CREATE TABLE user_job_phases (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  job_id TEXT NOT NULL,
  phase TEXT NOT NULL, -- 'generation', 'execution'
  dataset_id TEXT,
  credits_consumed INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### 3. Generation Service (No Core Schema Changes)
```typescript
// src/server/services/redteamGenerationService.ts
export class RedteamGenerationService {
  async generateTestDataset(userId: string, config: RedteamConfig): Promise<{
    datasetId: string;
    testCount: number;
  }> {
    // Use existing synthesize() logic - NO CHANGES to core
    const { testCases } = await synthesize(config);
    
    // Generate deterministic ID (existing logic) - NO CHANGES
    const datasetId = sha256(JSON.stringify(testCases));
    
    // Store in existing datasetsTable - NO CHANGES to schema
    await db.insert(datasetsTable).values({
      id: datasetId,
      tests: testCases,
    });
    
    // Map to user in Supabase ONLY
    await supabase.from('user_datasets').insert({
      user_id: userId,
      dataset_id: datasetId,
      metadata: {
        test_count: testCases.length,
        plugins: config.plugins || [],
        strategies: config.strategies || [],
        generated_at: Date.now(),
        original_config: config
      }
    });
    
    return { datasetId, testCount: testCases.length };
  }
}
```

#### 4. API Endpoints (Minimal Changes)
```typescript
// src/server/routes/redteam.ts - NEW endpoints alongside existing ones

// Generate test dataset only
POST /api/redteam/generate
{
  "config": { plugins: [...], strategies: [...] }
}
Response: { 
  "jobId": "job456",
  "datasetId": "dataset789",
  "testCount": 150
}

// List user's generated datasets
GET /api/redteam/datasets
Response: [{
  "dataset_id": "dataset789",
  "test_count": 150,
  "created_at": "2024-01-01T00:00:00Z",
  "plugins": ["harmful", "pii"],
  "strategies": ["jailbreak"]
}]

// Get dataset details
GET /api/redteam/datasets/:datasetId
Response: {
  "dataset_id": "dataset789",
  "tests": [...], // Full test cases
  "test_count": 150,
  "metadata": { ... }
}

// Execute existing dataset
POST /api/redteam/execute
{
  "datasetId": "dataset789",
  "providers": [...]
}
Response: { "jobId": "exec123" }
```

## Implementation Plan

### Phase 1: Backend Infrastructure (Week 1-2)

#### Database Changes
1. **Create Supabase migration**: `supabase/migrations/user_datasets_table.sql`
2. **Optional job tracking**: `supabase/migrations/user_job_phases_table.sql`

#### New Services
1. **RedteamGenerationService**: `src/server/services/redteamGenerationService.ts`
   - Extract generation logic from existing `src/redteam/index.ts`
   - Add Supabase user-dataset mapping
   - Maintain existing SHA256 deduplication

2. **Enhanced UserJobManager**: `src/server/services/userJobManager.ts`
   - Add generation vs execution job types
   - Track phase-specific credit consumption
   - Support dataset-based execution jobs

#### Enhanced API Routes
3. **Extend redteam routes**: `src/server/routes/redteam.ts`
   - `POST /api/redteam/generate` - Generation only
   - `GET /api/redteam/datasets` - List user datasets
   - `GET /api/redteam/datasets/:id` - Dataset details
   - `POST /api/redteam/execute` - Execute existing dataset
   - Maintain existing `/api/redteam/run` for backwards compatibility

### Phase 2: Frontend UI (Week 3-4)

#### Dataset Management UI
1. **Dataset List Page**: `src/app/src/pages/redteam/datasets/page.tsx`
   - Display user's generated datasets
   - Show test counts, creation dates, plugins used
   - Links to view details or execute

2. **Dataset Detail Page**: `src/app/src/pages/redteam/datasets/[id]/page.tsx`
   - Preview generated test cases
   - Show original configuration
   - Execute button with provider selection

3. **Enhanced Setup Pages**:
   - Modify existing `src/app/src/pages/redteam/setup/` components
   - Add "Generate Only" option alongside "Run Full Scan"
   - Show cost breakdown for generation vs execution

#### Navigation Updates
4. **Update Navigation**: `src/app/src/components/Navigation.tsx`
   - Add "My Datasets" menu item
   - Update existing "Create Security Test" dropdown

### Phase 3: Integration & Testing (Week 5)

#### Backend Integration
1. **Credit System Integration**
   - Separate credit consumption for generation vs execution
   - Update billing calculations in existing services

2. **Job Queue Integration**  
   - Enhance existing job manager to handle dataset-based execution
   - Maintain existing progress tracking and abort functionality

#### Frontend Integration
3. **Report Integration**
   - Ensure existing report components work with dataset-based executions
   - Update result filtering to handle dataset metadata

4. **Testing & Validation**
   - End-to-end testing of generation → dataset → execution flow
   - Backwards compatibility testing with existing `/api/redteam/run`
   - Performance testing with large datasets

## Files to Create/Modify

### New Files
```
supabase/migrations/user_datasets_table.sql
supabase/migrations/user_job_phases_table.sql
src/server/services/redteamGenerationService.ts
src/app/src/pages/redteam/datasets/page.tsx
src/app/src/pages/redteam/datasets/[id]/page.tsx
```

### Modified Files
```
src/server/routes/redteam.ts - Add new endpoints
src/server/services/userJobManager.ts - Add dataset job support
src/app/src/pages/redteam/setup/page.tsx - Add generation option
src/app/src/components/Navigation.tsx - Add datasets menu
```

### Preserved Files (No Changes)
```
src/redteam/index.ts - Core generation logic unchanged
src/redteam/shared.ts - Core execution logic unchanged
src/database/tables.ts - No schema changes
All existing report components - Full compatibility
```

## Benefits of Ultra-Simplified Approach

### Technical Benefits
- **Zero Breaking Changes**: Existing functionality untouched
- **Minimal Code Changes**: Leverages existing architecture
- **Full Upstream Compatibility**: No core schema modifications
- **Easy Rollback**: Can be disabled without affecting existing users

### User Benefits  
- **Cost Transparency**: See generation costs before execution
- **Test Visibility**: Preview all test cases before running
- **Dataset Reusability**: Run same tests against different models
- **Faster Iteration**: Generate once, execute multiple times

### Business Benefits
- **Incremental Revenue**: Separate billing for generation and execution
- **User Retention**: Better cost control increases usage
- **Scalability**: Decouple expensive generation from execution
- **Compliance Ready**: Foundation for future approval workflows if needed

## Migration Strategy

### Backwards Compatibility
- Existing `/api/redteam/run` endpoint continues to work unchanged
- Existing UI flows remain functional
- Gradual user adoption through optional new features

### Data Migration
- No data migration required (existing datasets remain unchanged)
- New mapping table starts empty
- Users gradually build dataset library through new generation flow

This ultra-simplified approach delivers the core value of phase separation while maintaining maximum compatibility and minimizing implementation complexity.