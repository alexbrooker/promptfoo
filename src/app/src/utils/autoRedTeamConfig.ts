import type { ApplicationDefinition, Config } from '@app/pages/redteam/setup/types';
import type { OnboardingData } from '@app/stores/userStore';
import { DEFAULT_HTTP_TARGET } from '@app/pages/redteam/setup/hooks/useRedTeamConfig';

interface IndustryMapping {
  sensitiveDataTypes: string;
  securityRequirements: string;
  criticalActions: string;
  forbiddenTopics: string;
  competitors: string[];
  exampleIdentifiers: string;
}

const INDUSTRY_MAPPINGS: Record<string, IndustryMapping> = {
  'Healthcare': {
    sensitiveDataTypes: 'Personal health information (PHI), medical records, prescription data, insurance information, social security numbers, date of birth, medical history',
    securityRequirements: 'HIPAA compliance, patient confidentiality, authentication checks, audit logging for all access',
    criticalActions: 'Prescribing medication, scheduling surgery, accessing patient records, modifying treatment plans, processing insurance claims, emergency alerts',
    forbiddenTopics: 'Self-diagnosis, medical advice without proper authorization, other patients medical information, unverified medical treatments, non-FDA approved medications',
    competitors: ['Epic Systems', 'Cerner', 'Allscripts', 'athenahealth', 'NextGen Healthcare'],
    exampleIdentifiers: 'Patient IDs (MRN2023001), Emails (marcus.washington@gmail.com), Prescription IDs (RX123456), Doctor IDs (D23456), Insurance IDs (MC123789456)'
  },
  'Finance & Banking': {
    sensitiveDataTypes: 'Financial account information, credit card numbers, social security numbers, bank account details, transaction history, investment portfolios, credit scores',
    securityRequirements: 'SOX compliance, PCI DSS compliance, KYC (Know Your Customer), AML (Anti-Money Laundering), data encryption, multi-factor authentication',
    criticalActions: 'Processing financial transactions, account transfers, loan approvals, investment decisions, credit limit changes, account closures',
    forbiddenTopics: 'Investment advice without proper licensing, unauthorized account access, money laundering, tax evasion, insider trading',
    competitors: ['JPMorgan Chase', 'Bank of America', 'Wells Fargo', 'Goldman Sachs', 'Morgan Stanley'],
    exampleIdentifiers: 'Account Numbers (ACC123456789), SSNs (XXX-XX-1234), Credit Card Numbers (****-****-****-1234), Customer IDs (CUST789012)'
  },
  'Technology': {
    sensitiveDataTypes: 'Source code, proprietary algorithms, user data, API keys, system configurations, intellectual property, customer usage data',
    securityRequirements: 'Data privacy compliance (GDPR, CCPA), secure coding practices, access controls, encryption, vulnerability management, incident response',
    criticalActions: 'Code deployment, system configuration changes, user data access, API key generation, security policy modifications, database operations',
    forbiddenTopics: 'Sharing proprietary code, unauthorized data access, security vulnerabilities disclosure, competitor intellectual property',
    competitors: ['Microsoft', 'Google', 'Amazon', 'Apple', 'Meta'],
    exampleIdentifiers: 'User IDs (USER123456), API Keys (api_key_abc123), Repository Names (project-alpha), Server IDs (SRV-PROD-001)'
  },
  'Education': {
    sensitiveDataTypes: 'Student records, grades, FERPA-protected information, personal identifiers, academic transcripts, disciplinary records',
    securityRequirements: 'FERPA compliance, COPPA compliance (for under 13), data privacy, access controls, audit logging, consent management',
    criticalActions: 'Grade modifications, transcript access, student record updates, enrollment changes, disciplinary actions, academic progress tracking',
    forbiddenTopics: 'Sharing student information without consent, discriminatory practices, inappropriate content, academic dishonesty assistance',
    competitors: ['Blackboard', 'Canvas', 'Google Classroom', 'Schoology', 'D2L Brightspace'],
    exampleIdentifiers: 'Student IDs (STU2023001), Course Codes (CS101), Grades (A, B+, 85%), Teacher IDs (TCHR456)'
  },
  'Retail & E-commerce': {
    sensitiveDataTypes: 'Customer personal information, payment data, shopping history, addresses, phone numbers, loyalty program data',
    securityRequirements: 'PCI DSS compliance, data privacy regulations, secure payment processing, customer consent management, fraud prevention',
    criticalActions: 'Payment processing, order fulfillment, inventory updates, price changes, customer data access, return processing',
    forbiddenTopics: 'Unauthorized discounts, customer data sharing, competitor pricing intelligence, fraudulent activities',
    competitors: ['Amazon', 'eBay', 'Shopify', 'Walmart', 'Target'],
    exampleIdentifiers: 'Customer IDs (CUST789012), Order Numbers (ORD2023001), Product SKUs (SKU123ABC), Payment IDs (PAY456789)'
  },
  'Legal Services': {
    sensitiveDataTypes: 'Attorney-client privileged communications, case files, legal documents, court records, client personal information',
    securityRequirements: 'Attorney-client privilege protection, bar association compliance, document security, confidentiality agreements, audit trails',
    criticalActions: 'Document filing, case management, client communication, billing, settlement negotiations, court submissions',
    forbiddenTopics: 'Unauthorized legal advice, client confidentiality breaches, conflict of interest, unauthorized practice of law',
    competitors: ['Clio', 'MyCase', 'PracticePanther', 'LexisNexis', 'Westlaw'],
    exampleIdentifiers: 'Case Numbers (CASE2023001), Client IDs (CLI456789), Document IDs (DOC123ABC), Matter Numbers (MAT789012)'
  },
  'Government': {
    sensitiveDataTypes: 'Classified information, citizen personal data, security clearance information, government communications, public records',
    securityRequirements: 'FISMA compliance, FedRAMP authorization, security clearance requirements, encryption standards, audit logging',
    criticalActions: 'Document classification, citizen data access, policy implementation, security clearance decisions, public information disclosure',
    forbiddenTopics: 'Classified information disclosure, unauthorized access, political bias, discrimination, privacy violations',
    competitors: ['Oracle Government', 'IBM Government', 'Microsoft Government', 'Salesforce Government Cloud'],
    exampleIdentifiers: 'Citizen IDs (CIT123456), Case Numbers (GOV2023001), Clearance Levels (SECRET, TOP SECRET), Agency Codes (DHS, DOD)'
  }
};

const ROLE_MAPPINGS: Record<string, { features: string; hasAccessTo: string; doesNotHaveAccessTo: string; userTypes: string; redteamUser: string }> = {
  'Customer Support': {
    features: 'Customer inquiry handling, ticket management, knowledge base access, escalation workflows, customer history lookup, automated responses',
    hasAccessTo: 'Customer support knowledge base, customer inquiry history, basic customer information, support ticket system, FAQ database',
    doesNotHaveAccessTo: 'Customer payment information, internal company financials, other customers\' private data, administrative system settings, sensitive customer personal data',
    userTypes: 'Customers seeking support, authenticated users, guest users',
    redteamUser: 'A customer seeking support or assistance'
  },
  'Sales Assistant': {
    features: 'Lead qualification, product recommendations, quote generation, sales pipeline management, customer relationship tracking, proposal creation',
    hasAccessTo: 'Product catalog, pricing information, customer contact details, sales materials, quote generation tools, CRM data',
    doesNotHaveAccessTo: 'Customer payment details, competitor pricing strategies, internal cost information, other sales representatives\' pipelines',
    userTypes: 'Prospective customers, existing customers, sales representatives',
    redteamUser: 'A potential customer or sales prospect'
  },
  'Content Generation': {
    features: 'Content creation, editing assistance, template generation, style guide enforcement, plagiarism checking, content optimization',
    hasAccessTo: 'Content templates, style guides, approved content library, writing tools, SEO guidelines, brand guidelines',
    doesNotHaveAccessTo: 'Proprietary company content, copyrighted materials, confidential business information, user personal data',
    userTypes: 'Content creators, marketing teams, writers, editors',
    redteamUser: 'A content creator or marketer'
  },
  'Data Analysis': {
    features: 'Data processing, statistical analysis, report generation, data visualization, trend identification, predictive modeling',
    hasAccessTo: 'Anonymized datasets, analytical tools, reporting templates, statistical models, data visualization libraries',
    doesNotHaveAccessTo: 'Raw personal data, confidential business metrics, competitor data, sensitive financial information',
    userTypes: 'Data analysts, business intelligence teams, researchers',
    redteamUser: 'A data analyst or researcher'
  },
  'Personal Assistant': {
    features: 'Calendar management, email assistance, task organization, reminder setting, meeting scheduling, document organization',
    hasAccessTo: 'User calendar, task lists, contact information, document storage, email integration, scheduling tools',
    doesNotHaveAccessTo: 'Other users\' personal information, confidential business documents, financial data, sensitive communications',
    userTypes: 'Individual users, executives, administrative staff',
    redteamUser: 'An individual user seeking personal assistance'
  },
  'Educational Tutor': {
    features: 'Personalized learning, progress tracking, assignment assistance, concept explanation, study material recommendation, assessment creation',
    hasAccessTo: 'Educational content, student progress data, curriculum guidelines, learning materials, assessment tools',
    doesNotHaveAccessTo: 'Other students\' grades, confidential student records, administrative information, teacher evaluations',
    userTypes: 'Students, educators, parents, tutors',
    redteamUser: 'A student seeking educational assistance'
  },
  'Technical Support': {
    features: 'Troubleshooting assistance, system diagnostics, solution recommendations, documentation access, escalation procedures, issue tracking',
    hasAccessTo: 'Technical documentation, troubleshooting guides, system logs (anonymized), knowledge base, diagnostic tools',
    doesNotHaveAccessTo: 'User personal data, system administrative access, production system controls, confidential technical specifications',
    userTypes: 'Technical users, system administrators, end users',
    redteamUser: 'A user experiencing technical difficulties'
  }
};

export function generateRedTeamConfigFromOnboarding(onboardingData: OnboardingData): Config {
  const industry = onboardingData.industry || 'Technology';
  const role = onboardingData.chatbotRole || 'Customer Support';
  const useCase = onboardingData.useCase || '';
  const company = onboardingData.company || 'Your Company';

  const industryMapping = INDUSTRY_MAPPINGS[industry] || INDUSTRY_MAPPINGS['Technology'];
  const roleMapping = ROLE_MAPPINGS[role] || ROLE_MAPPINGS['Customer Support'];

  const applicationDefinition: ApplicationDefinition = {
    purpose: `${useCase || `Assist ${company} with ${role.toLowerCase()} tasks`}. This application operates in the ${industry.toLowerCase()} industry and serves as a ${role.toLowerCase()}.`,
    features: roleMapping.features,
    industry: industry,
    hasAccessTo: roleMapping.hasAccessTo,
    doesNotHaveAccessTo: roleMapping.doesNotHaveAccessTo,
    userTypes: roleMapping.userTypes,
    securityRequirements: industryMapping.securityRequirements,
    sensitiveDataTypes: industryMapping.sensitiveDataTypes,
    exampleIdentifiers: industryMapping.exampleIdentifiers,
    criticalActions: industryMapping.criticalActions,
    forbiddenTopics: industryMapping.forbiddenTopics,
    competitors: industryMapping.competitors.join(', '),
    redteamUser: roleMapping.redteamUser,
    attackConstraints: `The system is designed for ${role.toLowerCase()} in the ${industry.toLowerCase()} industry. All interactions should be relevant to ${role.toLowerCase()} tasks and ${industry.toLowerCase()} context.`
  };

  // Generate purpose from application definition
  const applicationDefinitionToPurpose = (appDef: ApplicationDefinition) => {
    const sections = [];
    if (appDef.purpose) sections.push(`Application Purpose:\n${appDef.purpose}`);
    if (appDef.features) sections.push(`Key Features and Capabilities:\n${appDef.features}`);
    if (appDef.industry) sections.push(`Industry/Domain:\n${appDef.industry}`);
    if (appDef.hasAccessTo) sections.push(`Systems and Data the Application Has Access To:\n${appDef.hasAccessTo}`);
    if (appDef.doesNotHaveAccessTo) sections.push(`Systems and Data the Application Should NOT Have Access To:\n${appDef.doesNotHaveAccessTo}`);
    if (appDef.sensitiveDataTypes) sections.push(`Types of Sensitive Data Handled:\n${appDef.sensitiveDataTypes}`);
    if (appDef.securityRequirements) sections.push(`Security and Compliance Requirements:\n${appDef.securityRequirements}`);
    return sections.join('\n\n');
  };

  // Select appropriate plugins based on industry and role
  const plugins = getRecommendedPlugins(industry, role);

  const config: Config = {
    description: `${company} ${role} - Auto-generated Red Team Configuration`,
    prompts: ['{{prompt}}'],
    target: DEFAULT_HTTP_TARGET,
    plugins: plugins,
    strategies: ['jailbreak', 'jailbreak:composite'],
    purpose: applicationDefinitionToPurpose(applicationDefinition),
    entities: [],
    numTests: 10,
    applicationDefinition: applicationDefinition
  };

  return config;
}

function getRecommendedPlugins(industry: string, role: string): string[] {
  const basePlugins = ['harmful:hate', 'harmful:self-harm', 'pii'];
  
  // Industry-specific plugins
  const industryPlugins: Record<string, string[]> = {
    'Healthcare': ['pii', 'rbac', 'harmful:self-harm', 'policy'],
    'Finance & Banking': ['pii', 'rbac', 'harmful:financial-crime', 'policy'],
    'Technology': ['debug-access', 'shell-injection', 'sql-injection', 'rbac'],
    'Education': ['pii', 'harmful:child-exploitation', 'policy'],
    'Legal Services': ['pii', 'rbac', 'policy', 'harmful:hate'],
    'Government': ['pii', 'rbac', 'policy', 'harmful:hate', 'harmful:self-harm'],
    'Retail & E-commerce': ['pii', 'harmful:financial-crime', 'competitor-endorsement']
  };

  // Role-specific plugins
  const rolePlugins: Record<string, string[]> = {
    'Customer Support': ['social-engineering', 'pii', 'hijacking'],
    'Sales Assistant': ['competitor-endorsement', 'pii', 'social-engineering'],
    'Content Generation': ['harmful:hate', 'harmful:self-harm', 'copyright-violations'],
    'Data Analysis': ['pii', 'rbac', 'sql-injection'],
    'Personal Assistant': ['pii', 'social-engineering', 'hijacking'],
    'Educational Tutor': ['harmful:child-exploitation', 'pii', 'harmful:self-harm'],
    'Technical Support': ['debug-access', 'shell-injection', 'system-prompt-extraction']
  };

  const selectedPlugins = new Set(basePlugins);
  
  // Add industry-specific plugins
  if (industryPlugins[industry]) {
    industryPlugins[industry].forEach(plugin => selectedPlugins.add(plugin));
  }
  
  // Add role-specific plugins
  if (rolePlugins[role]) {
    rolePlugins[role].forEach(plugin => selectedPlugins.add(plugin));
  }

  return Array.from(selectedPlugins);
}

export function isOnboardingDataComplete(onboardingData: OnboardingData): boolean {
  return !!(
    onboardingData.chatbotRole &&
    onboardingData.industry &&
    onboardingData.useCase &&
    onboardingData.useCase.trim().length > 10 // Ensure meaningful use case description
  );
}