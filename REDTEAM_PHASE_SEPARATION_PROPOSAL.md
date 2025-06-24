# Red Team Phase Separation Proposal

## Overview

This document proposes enhancing promptfoo's red team functionality by separating test generation from execution, providing SaaS users with better control, cost transparency, and compliance capabilities.

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

### Dataset Persistence
The system already persists expanded test sets as datasets:
- **Location**: `datasetsTable` in Drizzle SQLite database
- **Content**: Fully expanded test cases (not original plugin configs)
- **ID**: SHA256 hash of serialized test cases for deduplication
- **Relationships**: Linked to evaluations via `evalsToDatasetsTable`

## Proposed Enhancement

### Goals
- **Cost Control**: Separate billing for generation vs execution
- **Compliance**: Review test cases before execution
- **Transparency**: Users see exactly what tests will run
- **Reusability**: Execute same dataset against multiple targets
- **Audit Trail**: Track generation, approval, and execution history

### Architecture Changes

#### 1. Enhanced Dataset Schema
```sql
-- Extend existing datasets table
ALTER TABLE datasets ADD COLUMN metadata TEXT JSON;

-- Track approval workflow
CREATE TABLE dataset_approvals (
  dataset_id TEXT REFERENCES datasets(id),
  user_id TEXT,
  action TEXT, -- 'approved', 'rejected', 'modified'
  timestamp INTEGER,
  notes TEXT,
  PRIMARY KEY (dataset_id, user_id, timestamp)
);
```

#### 2. Generation Service Enhancement
```typescript
// src/server/services/redteamGenerationService.ts
class RedteamGenerationService {
  async generateTestDataset(config: RedteamConfig): Promise<{
    datasetId: string;
    testCount: number;
    status: 'draft' | 'approved' | 'rejected';
  }> {
    // Use existing synthesize() logic
    const { testCases } = await synthesize(config);
    
    // Generate deterministic ID (existing logic)
    const datasetId = sha256(JSON.stringify(testCases));
    
    // Store with approval status
    await db.insert(datasetsTable).values({
      id: datasetId,
      tests: testCases,
      metadata: { 
        status: 'draft',
        generatedAt: Date.now(),
        generatedBy: userId,
        requiresApproval: true,
        originalConfig: config
      }
    });
    
    return { datasetId, testCount: testCases.length, status: 'draft' };
  }
}
```

#### 3. Enhanced Job Management
```typescript
// src/server/services/userJobManager.ts
interface QueuedJob {
  // ... existing fields
  phase: 'generation' | 'approval' | 'execution';
  datasetId?: string; // Link to generated dataset
  requiresApproval: boolean;
}

class UserJobManager {
  async enqueueGenerationJob(userId: string, config: RedteamConfig): Promise<string> {
    // Create job for generation phase only
    // Returns datasetId for subsequent approval/execution
  }

  async enqueueExecutionJob(userId: string, datasetId: string, targetConfig: any): Promise<string> {
    // Verify dataset is approved
    // Execute using existing doEval logic with approved dataset
  }
}
```

#### 4. API Endpoints
```typescript
// src/server/routes/redteam.ts - Enhanced endpoints

// Generate test dataset only
POST /api/redteam/generate
{
  "config": { plugins: [...], strategies: [...] },
  "userId": "user123"
}
Response: { 
  "jobId": "job456", 
  "datasetId": "dataset789", 
  "status": "generating" 
}

// Review generated dataset
GET /api/datasets/:datasetId
Response: {
  "id": "dataset789",
  "tests": [...], // Full expanded test cases
  "metadata": {
    "status": "draft",
    "testCount": 150,
    "generatedAt": 1640995200000,
    "plugins": ["harmful", "pii"],
    "strategies": ["jailbreak"]
  }
}

// Approve dataset for execution
POST /api/datasets/:datasetId/approve
{
  "userId": "user123",
  "notes": "Reviewed and approved for internal testing"
}
Response: { "status": "approved" }

// Execute approved dataset
POST /api/redteam/execute
{
  "datasetId": "dataset789",
  "targetConfig": { providers: [...] },
  "userId": "user123"
}
Response: { "jobId": "exec123", "status": "queued" }
```

## Implementation Plan

### Phase 1: Core Separation (Minimal Changes)
1. **Database Schema Updates**
   - Add `metadata` JSON column to `datasets` table
   - Create `dataset_approvals` table
   - Migrate existing datasets to include metadata

2. **Service Layer**
   - Extract generation logic into `RedteamGenerationService`
   - Modify job manager to handle dataset approval workflow
   - Update existing routes to support new endpoints

3. **API Enhancements**
   - Add dataset review/approval endpoints
   - Separate generation and execution job types
   - Maintain backward compatibility

### Phase 2: Advanced Features
1. **Dataset Management**
   - UI for reviewing generated test cases
   - Batch approval/rejection capabilities
   - Test case filtering and modification

2. **Enhanced Workflow**
   - Multi-user approval processes
   - Approval templates and policies
   - Integration with external approval systems

3. **Analytics & Reporting**
   - Dataset reuse metrics
   - Cost analysis and forecasting
   - Compliance reporting

## Benefits

### For SaaS Users
- **Cost Transparency**: Know generation costs before execution
- **Compliance Control**: Review tests before running
- **Resource Planning**: Understand exact test counts and execution time
- **Audit Requirements**: Full trail of what was generated and approved

### For Platform
- **Revenue Optimization**: Separate pricing for generation vs execution
- **Resource Management**: Better capacity planning and load balancing
- **User Experience**: Progressive disclosure of complex operations
- **Compliance**: Meet enterprise security and approval requirements

### Technical Benefits
- **Reusability**: Same dataset can be executed multiple times
- **Caching**: Leverage existing dataset deduplication
- **Scalability**: Separate scaling for generation vs execution workloads
- **Debugging**: Isolate issues to specific phases

## Migration Strategy

### Backward Compatibility
- Existing `/api/redteam/run` endpoint continues to work
- Auto-approve datasets for legacy workflows
- Gradual migration path for existing users

### Database Migration
```sql
-- Add metadata column with default values
ALTER TABLE datasets ADD COLUMN metadata TEXT JSON DEFAULT '{"status": "approved", "legacy": true}';

-- Update existing datasets
UPDATE datasets SET metadata = json_object(
  'status', 'approved',
  'legacy', true,
  'generatedAt', created_at
) WHERE metadata IS NULL;
```

### API Versioning
- Version 1: Current combined generation+execution
- Version 2: Separated phases with approval workflow
- Both versions supported during transition period

## Success Metrics

### User Adoption
- % of users using separated workflow
- Dataset approval rates
- Time from generation to execution

### Business Impact
- Revenue per user improvement
- Support ticket reduction
- Compliance audit success rate

### Technical Performance
- Dataset reuse rate
- Generation vs execution resource utilization
- System throughput improvements

## Risks and Mitigation

### Complexity Risk
- **Risk**: Increased complexity for simple use cases
- **Mitigation**: Maintain simple one-click option for basic users

### Storage Risk
- **Risk**: Increased database storage for pending datasets
- **Mitigation**: Implement dataset cleanup policies and archiving

### Performance Risk
- **Risk**: Additional database queries for approval workflow
- **Mitigation**: Optimize queries and implement caching

## Timeline

### Month 1: Foundation
- Database schema updates
- Core service layer changes
- Basic API endpoints

### Month 2: Integration
- Job manager enhancements
- UI for dataset review
- Testing and validation

### Month 3: Rollout
- Gradual user migration
- Documentation and training
- Monitoring and optimization

## Conclusion

This proposal leverages promptfoo's existing robust dataset architecture to provide enhanced control and transparency for SaaS users. By building incrementally on proven foundations, we can deliver significant value with minimal risk and development effort.

The separated phases align with enterprise requirements for compliance, cost control, and audit trails while maintaining the powerful plugin and strategy system that makes promptfoo's red teaming capabilities industry-leading.