import type { Config } from '../pages/redteam/setup/types';
import { DEFAULT_HTTP_TARGET } from '../pages/redteam/setup/hooks/useRedTeamConfig';
import type { OnboardingData } from '../stores/userStore';

interface QuickScanCustomization {
  plugins: string[];
  strategies: string[];
  applicationDefinition: Config['applicationDefinition'];
  description: string;
  targetLabel: string;
}

// Core security plugins - one per major category for quick scan
const CORE_QUICK_SCAN_PLUGINS = [
  'prompt-extraction',      // OWASP LLM #01 & #07 - Prompt Injection & System Prompt Leakage
  'pii:direct',            // OWASP LLM #02 - Sensitive Information Disclosure
  'harmful:hate',          // OWASP LLM #04 - Data and Model Poisoning (specific harmful plugin)
  'excessive-agency',      // OWASP LLM #06 - Excessive Agency
  'hallucination',         // OWASP LLM #09 - Misinformation
];

// Compliance-specific plugins (one per compliance type)
const COMPLIANCE_PLUGINS: Record<string, string[]> = {
  'GDPR': ['pii:direct', 'harmful:privacy'],
  'HIPAA': ['pii:direct', 'pii:session'], 
  'SOX': ['rbac', 'excessive-agency'],
  'PCI DSS': ['pii:api-db', 'shell-injection'],
  'CCPA': ['pii:direct', 'harmful:privacy'],
  'ISO 27001': ['rbac', 'harmful:privacy'],
  'NIST': ['excessive-agency', 'harmful:misinformation-disinformation'],
  'SOC 2': ['rbac', 'pii:session'],
};

// Industry-specific additional plugins
const INDUSTRY_PLUGINS: Record<string, string[]> = {
  'Healthcare': ['pii:direct', 'harmful:specialized-advice'],
  'Financial Services': ['pii:api-db', 'rbac'],
  'Education': ['harmful:misinformation-disinformation', 'pii:direct'],
  'Government': ['rbac', 'harmful:privacy'],
  'Technology': ['shell-injection', 'excessive-agency'],
  'Retail': ['pii:direct', 'harmful:privacy'],
  'Legal': ['harmful:misinformation-disinformation', 'pii:direct'],
};

// Use case specific plugins
const USE_CASE_PLUGINS: Record<string, string[]> = {
  'Customer Support': ['pii:direct', 'harmful:privacy'],
  'Content Generation': ['harmful:misinformation-disinformation', 'hallucination'],
  'Data Analysis': ['pii:api-db', 'excessive-agency'],
  'Code Generation': ['shell-injection', 'harmful:cybercrime'],
  'Research Assistant': ['hallucination', 'harmful:misinformation-disinformation'],
  'HR Assistant': ['pii:direct', 'harmful:hate'],
  'Financial Analysis': ['pii:api-db', 'harmful:misinformation-disinformation'],
  'Medical Assistant': ['harmful:specialized-advice', 'pii:direct'],
};

// Core strategies for quick scan
const QUICK_SCAN_STRATEGIES = [
  'jailbreak',
  'prompt-injection',
  'jailbreak:composite',
];

function generateApplicationDefinition(onboardingData: OnboardingData): Config['applicationDefinition'] {
  const { chatbotRole, industry, useCase, complianceNeeds, company } = onboardingData;
  
  return {
    purpose: chatbotRole 
      ? `${chatbotRole} - ${useCase || 'AI Assistant'} for ${company || 'organization'}`
      : `AI Assistant for ${useCase || 'general purposes'}`,
    
    industry: industry || '',
    
    securityRequirements: complianceNeeds?.length 
      ? `Compliance requirements: ${complianceNeeds.join(', ')}`
      : 'Standard security requirements for AI applications',
    
    userTypes: industry 
      ? `${industry} professionals, customers, and stakeholders`
      : 'General users and stakeholders',
    
    sensitiveDataTypes: generateSensitiveDataTypes(industry, useCase),
    
    criticalActions: generateCriticalActions(useCase),
    
    forbiddenTopics: generateForbiddenTopics(industry),
    
    redteamUser: 'Security tester evaluating AI system vulnerabilities',
    
    accessToData: generateAccessToData(useCase),
    
    forbiddenData: 'Unauthorized user data, system credentials, internal configurations',
    
    accessToActions: generateAccessToActions(useCase),
    
    forbiddenActions: 'System modifications, unauthorized data access, privilege escalation',
    
    connectedSystems: generateConnectedSystems(industry, useCase),
  };
}

function generateSensitiveDataTypes(industry?: string, useCase?: string): string {
  const types = ['Personal information', 'Authentication credentials'];
  
  if (industry === 'Healthcare') {
    types.push('Medical records', 'Patient health information', 'HIPAA protected data');
  } else if (industry === 'Financial Services') {
    types.push('Financial records', 'Account information', 'Payment data', 'Credit information');
  } else if (industry === 'Education') {
    types.push('Student records', 'Educational data', 'FERPA protected information');
  } else if (industry === 'Legal') {
    types.push('Client information', 'Legal documents', 'Attorney-client privileged communications');
  }
  
  if (useCase?.includes('HR') || useCase?.includes('Human Resources')) {
    types.push('Employee records', 'Salary information', 'Performance data');
  }
  
  return types.join(', ');
}

function generateCriticalActions(useCase?: string): string {
  const actions = ['Data modification', 'System configuration changes'];
  
  if (useCase?.includes('Code') || useCase?.includes('Development')) {
    actions.push('Code execution', 'System commands', 'File operations');
  } else if (useCase?.includes('Financial') || useCase?.includes('Payment')) {
    actions.push('Financial transactions', 'Account modifications', 'Payment processing');
  } else if (useCase?.includes('Medical') || useCase?.includes('Healthcare')) {
    actions.push('Medical recommendations', 'Treatment suggestions', 'Prescription guidance');
  }
  
  return actions.join(', ');
}

function generateForbiddenTopics(industry?: string): string {
  const topics = ['Illegal activities', 'Harmful content', 'Unauthorized system access'];
  
  if (industry === 'Healthcare') {
    topics.push('Unqualified medical advice', 'Diagnostic recommendations without proper credentials');
  } else if (industry === 'Financial Services') {
    topics.push('Unauthorized financial advice', 'Investment recommendations without proper licensing');
  } else if (industry === 'Legal') {
    topics.push('Legal advice without proper qualification', 'Attorney-client privilege violations');
  }
  
  return topics.join(', ');
}

function generateAccessToData(useCase?: string): string {
  const access = ['User-provided information', 'Public knowledge base'];
  
  if (useCase?.includes('Customer Support')) {
    access.push('Customer account information', 'Support ticket history');
  } else if (useCase?.includes('Data Analysis')) {
    access.push('Authorized datasets', 'Aggregated analytics data');
  } else if (useCase?.includes('Research')) {
    access.push('Research databases', 'Published academic content');
  }
  
  return access.join(', ');
}

function generateAccessToActions(useCase?: string): string {
  const actions = ['Information retrieval', 'Content generation', 'Query processing'];
  
  if (useCase?.includes('Customer Support')) {
    actions.push('Ticket creation', 'Knowledge base search', 'Escalation requests');
  } else if (useCase?.includes('Code')) {
    actions.push('Code suggestions', 'Documentation generation', 'Code review assistance');
  } else if (useCase?.includes('Data Analysis')) {
    actions.push('Data querying', 'Report generation', 'Statistical analysis');
  }
  
  return actions.join(', ');
}

function generateConnectedSystems(industry?: string, useCase?: string): string {
  const systems = ['Knowledge base', 'Authentication system'];
  
  if (industry === 'Healthcare') {
    systems.push('Electronic Health Records (EHR)', 'Patient management systems');
  } else if (industry === 'Financial Services') {
    systems.push('Banking systems', 'Payment processors', 'Risk management platforms');
  } else if (useCase?.includes('Customer Support')) {
    systems.push('CRM systems', 'Ticketing platforms', 'Customer databases');
  }
  
  return systems.join(', ');
}

// Quick scan optimized run settings
export const QUICK_SCAN_RUN_SETTINGS = {
  maxConcurrency: 3,     // Moderate concurrency for speed vs stability
  delayMs: 500,          // 500ms delay to avoid rate limits
  debugMode: false,      // Disable debug for cleaner output
  force: true,           // Always regenerate for fresh results
} as const;

export function customizeQuickScanConfig(
  baseTemplate: Config,
  onboardingData: OnboardingData
): Config {
  const customization = generateQuickScanCustomization(onboardingData);
  
  return {
    ...baseTemplate,
    description: customization.description,
    plugins: customization.plugins,
    strategies: customization.strategies,
    applicationDefinition: customization.applicationDefinition,
    target: {
      ...DEFAULT_HTTP_TARGET,
      label: customization.targetLabel,
    },
    // Keep the baseTemplate's numTests or use the default from config
  };
}

function generateQuickScanCustomization(onboardingData: OnboardingData): QuickScanCustomization {
  const { company, chatbotRole, industry, useCase, complianceNeeds } = onboardingData;
  
  // Start with core plugins
  let plugins = [...CORE_QUICK_SCAN_PLUGINS];
  
  // Add compliance-specific plugins (max 1 additional)
  if (complianceNeeds?.length) {
    for (const compliance of complianceNeeds) {
      const compliancePlugins = COMPLIANCE_PLUGINS[compliance];
      if (compliancePlugins) {
        // Add the first compliance plugin that's not already included
        const newPlugin = compliancePlugins.find(p => !plugins.includes(p));
        if (newPlugin) {
          plugins.push(newPlugin);
          break; // Only add one compliance plugin
        }
      }
    }
  }
  
  // Add industry-specific plugin (max 1 additional)
  if (industry && INDUSTRY_PLUGINS[industry]) {
    const industryPlugins = INDUSTRY_PLUGINS[industry];
    const newPlugin = industryPlugins.find(p => !plugins.includes(p));
    if (newPlugin) {
      plugins.push(newPlugin);
    }
  }
  
  // Add use case specific plugin (max 1 additional)
  if (useCase && USE_CASE_PLUGINS[useCase]) {
    const useCasePlugins = USE_CASE_PLUGINS[useCase];
    const newPlugin = useCasePlugins.find(p => !plugins.includes(p));
    if (newPlugin) {
      plugins.push(newPlugin);
    }
  }
  
  // Limit to max 8 plugins for quick scan
  plugins = plugins.slice(0, 8);
  
  return {
    plugins,
    strategies: QUICK_SCAN_STRATEGIES,
    applicationDefinition: generateApplicationDefinition(onboardingData),
    description: `Quick Security Scan - ${company || chatbotRole || 'AI System'}`,
    targetLabel: chatbotRole || company || 'quick-scan-target',
  };
}