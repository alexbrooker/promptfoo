// Define Config interface locally to avoid app dependency in server
interface ApplicationDefinition {
  purpose?: string;
  features?: string;
  hasAccessTo?: string;
  doesNotHaveAccessTo?: string;
  userTypes?: string;
  securityRequirements?: string;
  exampleIdentifiers?: string;
  industry?: string;
  sensitiveDataTypes?: string;
  criticalActions?: string;
  forbiddenTopics?: string;
  competitors?: string;
  systemPrompt?: string;
  redteamUser?: string;
  accessToData?: string;
  forbiddenData?: string;
  accessToActions?: string;
  forbiddenActions?: string;
  connectedSystems?: string;
  attackConstraints?: string;
}

interface ProviderOptions {
  id: string;
  label?: string;
  delay?: number;
  config: {
    [key: string]: any;
    type?: 'http' | 'websocket' | 'browser';
    url?: string;
    method?: string;
    headers?: Record<string, string>;
    body?: string | object;
  };
}

interface Config {
  description: string;
  prompts: string[];
  target: ProviderOptions;
  plugins: (string | { id: string; config?: any })[];
  strategies: string[];
  purpose?: string;
  numTests?: number;
  applicationDefinition: ApplicationDefinition;
  entities: string[];
  extensions?: string[];
}

// $49 Quick Check Template - Essential AI Safety Scan
export const quickCheckTemplate: Config = {
  description: "Quick Check - Essential AI Safety Scan ($49)",
  prompts: ["{{prompt}}"],
  target: {
    id: 'http',
    config: {
      url: '', // User needs to fill this
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: '{{prompt}}' }),
    },
  },
  plugins: [
    // Critical Safety (High Priority)
    'hate',
    'self-harm', 
    'child-exploitation',
    
    // Core Security
    'prompt-extraction',
    'pii-direct',
    'hijacking',
    
    // Business Risk
    'hallucination',
    'excessive-agency',
    
    // Basic Compliance  
    'harmful:unspecified',
    'contracts',
  ],
  strategies: [
    'basic',
    'jailbreak',
  ],
  numTests: 100,
  applicationDefinition: {
    purpose: "Quick compliance scan for AI system safety",
    securityRequirements: "Essential safety checks and basic compliance verification",
    features: "AI chatbot or assistant system",
    industry: "General",
  },
  entities: [],
  extensions: [],
};

// $499 Business Case Scan - Comprehensive Security Assessment  
export const businessScanTemplate: Config = {
  description: "Business Case Scan - Comprehensive AI Security Assessment ($499)",
  prompts: ["{{prompt}}"],
  target: {
    id: 'http',
    config: {
      url: '', // User needs to fill this
      method: 'POST', 
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: '{{prompt}}' }),
    },
  },
  plugins: [
    // === SECURITY & ACCESS CONTROL ===
    'ascii-smuggling',
    'bfla', // Broken Function Level Authorization
    'bola', // Broken Object Level Authorization  
    'debug-access',
    'shell-injection',
    'sql-injection',
    'ssrf',
    'rbac',
    'cross-session-leak',
    'prompt-extraction',
    'tool-discovery',
    
    // === HARMFUL CONTENT (Complete Coverage) ===
    'hate',
    'self-harm',
    'child-exploitation', 
    'violent-crime',
    'chemical-biological-weapons',
    'cybercrime',
    'harassment-bullying',
    'sexual-content',
    'misinformation',
    'illegal-drugs',
    'terrorism',
    'graphic-content',
    'non-violent-crime',
    'privacy',
    'intellectual-property',
    'indiscriminate-weapons',
    'specialized-advice-financial',
    'specialized-advice-legal',
    'specialized-advice-medical',
    'radicalization',
    'harmful:unspecified',
    
    // === PII & PRIVACY ===
    'pii-direct',
    'pii-api-db', 
    'pii-session',
    'pii-social',
    
    // === BUSINESS RISK ===
    'competitors',
    'contracts',
    'excessive-agency',
    'hallucination',
    'hijacking',
    'imitation',
    'politics',
    'religion',
    
    // === DATASET-BASED TESTING ===
    'beavertails',
    'cyberseceval',
    'harmbench',
    'toxicchat',
    'xstest',
  ],
  strategies: [
    'basic',
    'jailbreak',
    'jailbreak:composite',
    'crescendo',
    'multilingual',
    'base64',
    'leetspeak',
    'best-of-n',
  ],
  numTests: 2000,
  applicationDefinition: {
    purpose: "Comprehensive business-grade AI security assessment covering OWASP LLM Top 10, MITRE ATLAS, and EU AI Act compliance",
    securityRequirements: "Full framework compliance including OWASP LLM Top 10, MITRE ATLAS, EU AI Act prohibited practices, and industry-specific regulations",
    features: "Production AI system with comprehensive functionality",
    industry: "Enterprise",
    hasAccessTo: "Business data, user information, external APIs",
    doesNotHaveAccessTo: "Administrative systems, financial transactions, personal health records",
    userTypes: "End users, business users, administrators",
    criticalActions: "Data processing, decision making, content generation",
    forbiddenTopics: "Harmful content, illegal activities, privacy violations",
    sensitiveDataTypes: "PII, business confidential information, user data",
    connectedSystems: "Databases, APIs, external services",
  },
  entities: [
    'competitors',
    'personal information', 
    'business data',
    'financial information',
    'health records',
    'legal documents',
  ],
  extensions: [],
};

export const templates = {
  quick: quickCheckTemplate,
  business: businessScanTemplate,
} as const;

export type TemplateTier = keyof typeof templates;