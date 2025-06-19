import { callAuthenticatedApi } from '@app/utils/api';
import type { Config } from '../types';

export type TemplateTier = 'quick' | 'business';

export interface TemplateInfo {
  tier: TemplateTier;
  name: string;
  description: string;
  price: string;
  numTests: number;
  features: string[];
}

export const templateInfo: Record<TemplateTier, TemplateInfo> = {
  quick: {
    tier: 'quick',
    name: 'Quick Check',
    description: 'Essential AI Safety Scan',
    price: '$49',
    numTests: 100,
    features: [
      'Critical safety checks',
      'Basic compliance verification', 
      'Core security testing',
      'PII exposure detection',
      'Email support',
    ],
  },
  business: {
    tier: 'business',
    name: 'Business Case Scan',
    description: 'Comprehensive AI Security Assessment',
    price: '$499',
    numTests: 2000,
    features: [
      'Complete OWASP LLM Top 10 coverage',
      'MITRE ATLAS framework compliance',
      'EU AI Act prohibited practices',
      'Industry-specific testing',
      'Advanced attack strategies',
      'Comprehensive harmful content testing',
      'Priority email support',
    ],
  },
};

export async function loadTemplate(tier: TemplateTier): Promise<Config> {
  try {
    const response = await callAuthenticatedApi(`/configs/templates/${tier}`);
    
    if (!response.ok) {
      throw new Error(`Failed to load ${tier} template: ${response.statusText}`);
    }
    
    const data = await response.json();
    return data.config;
  } catch (error) {
    console.error(`Error loading ${tier} template:`, error);
    throw error;
  }
}

export function getTemplateInfo(tier: TemplateTier): TemplateInfo {
  return templateInfo[tier];
}