// Frontend-compatible constants extracted from backend
const OWASP_LLM_TOP_10_NAMES = [
  'Prompt Injection',
  'Sensitive Information Disclosure',
  'Supply Chain',
  'Data and Model Poisoning',
  'Improper Output Handling',
  'Excessive Agency',
  'System Prompt Leakage',
  'Vector and Embedding Weaknesses',
  'Misinformation',
  'Unbounded Consumption',
];

const OWASP_LLM_TOP_10_MAPPING: Record<string, { plugins: string[]; strategies: string[] }> = {
  'owasp:llm:01': {
    plugins: ['ascii-smuggling', 'indirect-prompt-injection', 'prompt-extraction', 'harmful'],
    strategies: ['jailbreak', 'prompt-injection', 'jailbreak:composite'],
  },
  'owasp:llm:02': {
    plugins: ['pii:api-db', 'pii:direct', 'pii:session', 'pii:social', 'harmful:privacy', 'cross-session-leak', 'prompt-extraction'],
    strategies: ['jailbreak', 'prompt-injection', 'jailbreak:composite'],
  },
  'owasp:llm:03': {
    plugins: [],
    strategies: [],
  },
  'owasp:llm:04': {
    plugins: ['harmful:misinformation-disinformation', 'harmful:hate', 'bias:gender', 'harmful:radicalization', 'harmful:specialized-advice'],
    strategies: ['jailbreak', 'prompt-injection', 'jailbreak:composite'],
  },
  'owasp:llm:05': {
    plugins: ['shell-injection', 'sql-injection', 'ssrf', 'debug-access'],
    strategies: ['jailbreak', 'prompt-injection'],
  },
  'owasp:llm:06': {
    plugins: ['excessive-agency', 'rbac', 'bfla', 'bola', 'shell-injection', 'sql-injection', 'ssrf'],
    strategies: ['jailbreak', 'prompt-injection', 'jailbreak:composite'],
  },
  'owasp:llm:07': {
    plugins: ['prompt-extraction', 'rbac', 'harmful:privacy', 'pii:api-db', 'pii:direct', 'pii:session', 'pii:social'],
    strategies: ['jailbreak', 'prompt-injection', 'jailbreak:composite'],
  },
  'owasp:llm:08': {
    plugins: ['cross-session-leak', 'harmful:privacy', 'pii:api-db', 'pii:direct', 'pii:session', 'pii:social'],
    strategies: ['jailbreak', 'prompt-injection', 'jailbreak:composite'],
  },
  'owasp:llm:09': {
    plugins: ['hallucination', 'overreliance', 'harmful:misinformation-disinformation', 'harmful:specialized-advice'],
    strategies: ['jailbreak', 'prompt-injection', 'jailbreak:composite'],
  },
  'owasp:llm:10': {
    plugins: ['divergent-repetition', 'reasoning-dos'],
    strategies: [],
  },
};

// Hardcoded testing goals - all priorities we support
const ALL_TESTING_GOALS = [
  'Prevent data leaks and privacy violations',
  'Ensure safe responses to harmful content',
  'Test resistance to jailbreaking attempts',
  'Check for bias and fairness issues',
  'Validate prompt injection defenses',
  'Test output quality and accuracy',
  'Ensure appropriate content filtering',
  'Verify system security boundaries'
];

const FOUNDATION_PLUGINS = [
  'ascii-smuggling', 'beavertails', 'bias:gender', 'contracts', 'cyberseceval', 'donotanswer',
  'divergent-repetition', 'excessive-agency', 'hallucination', 'harmful:chemical-biological-weapons',
  'harmful:child-exploitation', 'harmful:copyright-violations', 'harmful:cybercrime', 'harmful:cybercrime:malicious-code',
  'harmful:graphic-content', 'harmful:harassment-bullying', 'harmful:hate', 'harmful:illegal-activities',
  'harmful:illegal-drugs', 'harmful:indiscriminate-weapons', 'harmful:insults', 'harmful:intellectual-property',
  'harmful:misinformation-disinformation', 'harmful:non-violent-crime', 'harmful:privacy', 'harmful:profanity',
  'harmful:radicalization', 'harmful:self-harm', 'harmful:sex-crime', 'harmful:sexual-content',
  'harmful:specialized-advice', 'harmful:specialized-advice:financial', 'harmful:specialized-advice:government',
  'harmful:specialized-advice:legal', 'harmful:specialized-advice:medical', 'harmful:violent-crime'
];

const PII_PLUGINS = [
  'pii:api-db', 'pii:direct', 'pii:session', 'pii:social'
];

interface GuestOnboardingData {
  chatbotRole: string;
  industry: string[];
  useCase: string[];
  complianceNeeds: string[];
  countryOfOperation: string;
}

interface TestPlanItem {
  id: string;
  name: string;
  description: string;
  plugins: string[];
  strategies: string[];
  testCount: number;
  priority: 'high' | 'medium' | 'low';
}

interface GeneratedTestPlan {
  summary: {
    totalTests: number;
    frameworks: string[];
    coverage: string;
  };
  owaspMapping: TestPlanItem[];
  additionalTests: TestPlanItem[];
  config: any; // The actual config object to save
}

// Industry-specific plugin mappings
const INDUSTRY_PLUGINS: Record<string, string[]> = {
  healthcare: [
    'harmful:specialized-advice:medical',
    'pii:direct',
    'pii:session',
    'harmful:privacy',
    'contracts',
  ],
  finance: [
    'harmful:specialized-advice:financial',
    'pii:api-db',
    'pii:direct',
    'harmful:cybercrime',
    'contracts',
  ],
  education: [
    'harmful:child-exploitation',
    'pii:direct',
    'bias:gender',
    'harmful:hate',
    'harmful:misinformation-disinformation',
  ],
  'legal-services': [
    'harmful:specialized-advice:legal',
    'contracts',
    'pii:direct',
    'harmful:privacy',
    'bias:gender',
  ],
  ecommerce: [
    'harmful:cybercrime',
    'pii:api-db',
    'pii:direct',
    'excessive-agency',
    'bola',
  ],
  'customer-service': [
    'harmful:insults',
    'harmful:harassment-bullying',
    'pii:direct',
    'excessive-agency',
    'harmful:hate',
  ],
  technology: [
    'harmful:cybercrime:malicious-code',
    'shell-injection',
    'sql-injection',
    'ssrf',
    'debug-access',
  ],
  government: [
    'harmful:misinformation-disinformation',
    'pii:direct',
    'bias:gender',
    'harmful:privacy',
    'contracts',
  ],
};

// Use case specific plugins
const USE_CASE_PLUGINS: Record<string, string[]> = {
  'customer-support': [
    'harmful:insults',
    'harmful:harassment-bullying',
    'excessive-agency',
    'pii:direct',
  ],
  'content-generation': [
    'harmful:copyright-violations',
    'harmful:misinformation-disinformation',
    'hallucination',
    'harmful:hate',
  ],
  'code-assistant': [
    'harmful:cybercrime:malicious-code',
    'shell-injection',
    'sql-injection',
    'debug-access',
  ],
  'data-analysis': [
    'pii:api-db',
    'pii:direct',
    'harmful:privacy',
    'overreliance',
  ],
  'education-tutoring': [
    'harmful:child-exploitation',
    'harmful:misinformation-disinformation',
    'bias:gender',
    'harmful:specialized-advice',
  ],
  'healthcare-assistant': [
    'harmful:specialized-advice:medical',
    'pii:direct',
    'harmful:misinformation-disinformation',
    'overreliance',
  ],
  'financial-advisor': [
    'harmful:specialized-advice:financial',
    'pii:api-db',
    'harmful:cybercrime',
    'overreliance',
  ],
  'legal-assistant': [
    'harmful:specialized-advice:legal',
    'contracts',
    'pii:direct',
    'bias:gender',
  ],
};

// Compliance framework mappings
const COMPLIANCE_PLUGINS: Record<string, string[]> = {
  // Core AI Security Frameworks
  'OWASP LLM Top 10': [
    'ascii-smuggling', 'indirect-prompt-injection', 'prompt-extraction', 'harmful',
    'pii:api-db', 'pii:direct', 'pii:session', 'pii:social', 'harmful:privacy',
    'shell-injection', 'sql-injection', 'ssrf', 'debug-access', 'excessive-agency',
    'rbac', 'bfla', 'bola', 'cross-session-leak', 'hallucination', 'overreliance',
    'harmful:misinformation-disinformation', 'divergent-repetition', 'reasoning-dos'
  ],
  'OWASP API Security': [
    'bola', 'bfla', 'rbac', 'excessive-agency', 'sql-injection', 'shell-injection',
    'ssrf', 'debug-access', 'pii:api-db', 'harmful:cybercrime', 'cross-session-leak'
  ],
  'MITRE ATLAS': [
    'prompt-extraction', 'harmful:misinformation-disinformation', 'hallucination',
    'overreliance', 'harmful:specialized-advice', 'bias:gender', 'harmful:hate',
    'ascii-smuggling', 'indirect-prompt-injection', 'reasoning-dos'
  ],
  'NIST AI Framework': [
    'bias:gender', 'harmful:hate', 'harmful:misinformation-disinformation',
    'hallucination', 'overreliance', 'harmful:specialized-advice', 'pii:direct',
    'harmful:privacy', 'rbac', 'excessive-agency', 'contracts'
  ],
  'EU AI Act': [
    'bias:gender', 'harmful:hate', 'harmful:misinformation-disinformation',
    'pii:direct', 'pii:session', 'harmful:privacy', 'harmful:specialized-advice',
    'hallucination', 'overreliance', 'harmful:child-exploitation'
  ],
  
  // Additional Compliance Standards
  'HIPAA': ['pii:direct', 'pii:session', 'harmful:privacy', 'cross-session-leak'],
  'PCI-DSS': ['pii:api-db', 'harmful:cybercrime', 'sql-injection', 'debug-access'],
  'GDPR': ['pii:direct', 'pii:session', 'harmful:privacy', 'cross-session-leak'],
  'SOC-2': ['pii:api-db', 'harmful:privacy', 'debug-access', 'rbac'],
  'ISO-27001': ['harmful:cybercrime', 'sql-injection', 'shell-injection', 'rbac'],
  'FERPA': ['pii:direct', 'harmful:child-exploitation', 'harmful:privacy'],
};

export function generateGuestTestPlan(data: GuestOnboardingData): GeneratedTestPlan {
  const selectedPlugins = new Set<string>();
  const owaspItems: TestPlanItem[] = [];
  
  // Always include core foundation plugins
  FOUNDATION_PLUGINS.slice(0, 20).forEach(plugin => selectedPlugins.add(plugin));
  
  // Add industry-specific plugins
  data.industry.forEach(industry => {
    const industryPlugins = INDUSTRY_PLUGINS[industry.toLowerCase()] || [];
    industryPlugins.forEach(plugin => selectedPlugins.add(plugin));
  });
  
  // Add use case specific plugins
  data.useCase.forEach(useCase => {
    const useCasePlugins = USE_CASE_PLUGINS[useCase.toLowerCase()] || [];
    useCasePlugins.forEach(plugin => selectedPlugins.add(plugin));
  });
  
  // Add compliance-specific plugins
  data.complianceNeeds.forEach(compliance => {
    const compliancePlugins = COMPLIANCE_PLUGINS[compliance] || [];
    compliancePlugins.forEach(plugin => selectedPlugins.add(plugin));
  });
  
  // Generate OWASP LLM Top 10 mapping
  Object.entries(OWASP_LLM_TOP_10_MAPPING).forEach(([key, mapping], index) => {
    const relevantPlugins = mapping.plugins.filter(plugin => selectedPlugins.has(plugin));
    
    if (relevantPlugins.length > 0) {
      owaspItems.push({
        id: key,
        name: `LLM-${String(index + 1).padStart(2, '0')}: ${OWASP_LLM_TOP_10_NAMES[index]}`,
        description: getOwaspDescription(index + 1),
        plugins: relevantPlugins,
        strategies: mapping.strategies,
        testCount: Math.min(relevantPlugins.length * 3, 15),
        priority: getPriority(index + 1, data),
      });
    }
  });
  
  // Add framework-specific additional tests
  const additionalTests: TestPlanItem[] = [];
  
  // OWASP API Security specific tests
  if (data.complianceNeeds.includes('OWASP API Security')) {
    const apiPlugins = COMPLIANCE_PLUGINS['OWASP API Security'].filter(plugin => selectedPlugins.has(plugin));
    if (apiPlugins.length > 0) {
      additionalTests.push({
        id: 'owasp-api-security',
        name: 'OWASP API Security Testing',
        description: 'Comprehensive API security vulnerability assessment including BOLA, BFLA, and injection attacks',
        plugins: apiPlugins,
        strategies: ['jailbreak', 'prompt-injection'],
        testCount: Math.min(apiPlugins.length * 2, 25),
        priority: 'high',
      });
    }
  }
  
  // MITRE ATLAS specific tests
  if (data.complianceNeeds.includes('MITRE ATLAS')) {
    const mitrePlugins = COMPLIANCE_PLUGINS['MITRE ATLAS'].filter(plugin => selectedPlugins.has(plugin));
    if (mitrePlugins.length > 0) {
      additionalTests.push({
        id: 'mitre-atlas',
        name: 'MITRE ATLAS Threat Assessment',
        description: 'AI/ML specific threat modeling based on MITRE ATLAS framework',
        plugins: mitrePlugins,
        strategies: ['jailbreak', 'prompt-injection', 'jailbreak:composite'],
        testCount: Math.min(mitrePlugins.length * 2, 20),
        priority: 'medium',
      });
    }
  }
  
  // NIST AI Framework specific tests
  if (data.complianceNeeds.includes('NIST AI Framework')) {
    const nistPlugins = COMPLIANCE_PLUGINS['NIST AI Framework'].filter(plugin => selectedPlugins.has(plugin));
    if (nistPlugins.length > 0) {
      additionalTests.push({
        id: 'nist-ai-framework',
        name: 'NIST AI Risk Management',
        description: 'AI governance and risk management testing aligned with NIST AI Framework',
        plugins: nistPlugins,
        strategies: ['jailbreak', 'prompt-injection'],
        testCount: Math.min(nistPlugins.length * 2, 20),
        priority: 'medium',
      });
    }
  }
  
  // EU AI Act specific tests
  if (data.complianceNeeds.includes('EU AI Act')) {
    const euPlugins = COMPLIANCE_PLUGINS['EU AI Act'].filter(plugin => selectedPlugins.has(plugin));
    if (euPlugins.length > 0) {
      additionalTests.push({
        id: 'eu-ai-act',
        name: 'EU AI Act Compliance',
        description: 'European AI regulation compliance testing for bias, transparency, and safety',
        plugins: euPlugins,
        strategies: ['jailbreak', 'prompt-injection'],
        testCount: Math.min(euPlugins.length * 2, 18),
        priority: 'high',
      });
    }
  }
  
  // PII-specific comprehensive tests for data protection frameworks
  if (data.complianceNeeds.some(c => ['HIPAA', 'GDPR', 'PCI-DSS'].includes(c))) {
    additionalTests.push({
      id: 'pii-comprehensive',
      name: 'Comprehensive PII Protection',
      description: 'Advanced tests for personally identifiable information protection',
      plugins: PII_PLUGINS.filter(plugin => selectedPlugins.has(plugin)),
      strategies: ['jailbreak', 'prompt-injection'],
      testCount: 20,
      priority: 'high',
    });
  }
  
  const totalTests = owaspItems.reduce((sum, item) => sum + item.testCount, 0) +
                    additionalTests.reduce((sum, item) => sum + item.testCount, 0);
  
  // Generate the actual config object
  const config = {
    description: `Personalized security test plan - ${data.chatbotRole}`,
    prompts: [`You are a ${data.chatbotRole} in the ${data.industry.join(', ')} industry.`],
    target: {
      id: 'custom-target',
      config: {
        // This would be filled in later when user provides their API details
      },
    },
    plugins: Array.from(selectedPlugins).map(plugin => ({ id: plugin, numTests: 3 })),
    strategies: ['jailbreak', 'prompt-injection'],
    purpose: `Security testing for ${data.useCase.join(', ')} use cases`,
    numTests: Math.min(totalTests, 200), // Professional tier limit
    applicationDefinition: {
      purpose: data.useCase,
      industry: data.industry,
      complianceRequirements: data.complianceNeeds,
    },
  };
  
  return {
    summary: {
      totalTests,
      frameworks: ['OWASP LLM Top 10', ...data.complianceNeeds],
      coverage: `${owaspItems.length}/10 OWASP LLM categories`,
    },
    owaspMapping: owaspItems,
    additionalTests,
    config,
  };
}

function getOwaspDescription(number: number): string {
  const descriptions: Record<number, string> = {
    1: 'Tests for prompt injection vulnerabilities and jailbreaking attempts',
    2: 'Detects unauthorized disclosure of sensitive information and PII',
    3: 'Evaluates supply chain security and third-party component risks',
    4: 'Identifies data poisoning and model manipulation vulnerabilities',
    5: 'Tests for improper output handling and injection attacks',
    6: 'Evaluates excessive agency and unauthorized action capabilities',
    7: 'Tests for system prompt leakage and configuration disclosure',
    8: 'Identifies vector database and embedding security weaknesses',
    9: 'Detects misinformation generation and hallucination issues',
    10: 'Tests for resource exhaustion and denial of service vulnerabilities',
  };
  return descriptions[number] || 'Security vulnerability assessment';
}

function getPriority(owaspNumber: number, data: GuestOnboardingData): 'high' | 'medium' | 'low' {
  // High priority vulnerabilities for most use cases
  const highPriorityGeneral = [1, 2, 6, 9]; // Prompt injection, PII, excessive agency, misinformation
  
  // Industry-specific high priorities
  const industryPriorities: Record<string, number[]> = {
    healthcare: [1, 2, 7, 9], // + system prompt leakage
    finance: [1, 2, 4, 6], // + data poisoning
    education: [1, 2, 4, 9], // + data poisoning, misinformation
    'legal-services': [1, 2, 7, 9], // + system prompt leakage
  };
  
  // Check if any of the user's industries have specific priorities for this OWASP number
  const hasIndustrySpecificPriority = data.industry.some(industry => {
    const industrySpecific = industryPriorities[industry.toLowerCase()] || [];
    return industrySpecific.includes(owaspNumber);
  });
  
  if (highPriorityGeneral.includes(owaspNumber) || hasIndustrySpecificPriority) {
    return 'high';
  }
  
  if ([3, 4, 5, 8].includes(owaspNumber)) {
    return 'medium';
  }
  
  return 'low';
}