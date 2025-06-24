import React, { useState } from 'react';
import {
  Box,
  Button,
  Typography,
  Grid,
  Chip,
  Stack,
  Card,
  CardContent,
  CardActionArea,
  Collapse,
  Divider,
} from '@mui/material';
import {
  SupportAgent as SupportIcon,
  Business as BusinessIcon,
  LocalHospital as SpecializedIcon,
  HelpOutline as HelpIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
} from '@mui/icons-material';

interface GuestOnboardingData {
  name: string;
  company: string;
  chatbotRole: string;
  industry: string[];
  useCase: string[];
  complianceNeeds: string[];
  countryOfOperation: string;
}

interface GuestChatbotDetailsStepProps {
  data: GuestOnboardingData;
  onUpdate: (updates: Partial<GuestOnboardingData>) => void;
  onNext: () => void;
}

// Main AI categories with premium business-focused positioning
const aiCategories = [
  {
    id: 'customer-facing',
    title: 'Customer-Facing AI',
    subtitle: 'Direct customer interaction systems',
    description: 'AI that speaks directly to your customers and represents your brand',
    icon: SupportIcon,
    color: '#e3f2fd',
    borderColor: '#1976d2',
    roles: [
      { name: 'Customer Support', description: 'Handles customer inquiries and support tickets' },
      { name: 'Sales Assistant', description: 'Qualifies leads and supports sales conversations' },
      { name: 'Content Generation', description: 'Creates marketing content and communications' }
    ],
    useCases: ['Answer customer questions', 'Process customer support tickets', 'Generate marketing content'],
    industries: ['Retail & E-commerce', 'Finance & Banking', 'Technology', 'Travel']
  },
  {
    id: 'internal-operations',
    title: 'Internal Operations',
    subtitle: 'Employee productivity and workflow systems',
    description: 'AI that enhances internal team productivity and decision-making',
    icon: BusinessIcon,
    color: '#e8f5e8',
    borderColor: '#388e3c',
    roles: [
      { name: 'Data Analysis', description: 'Analyzes business data and generates insights' },
      { name: 'Research Assistant', description: 'Conducts research and summarizes findings' },
      { name: 'Code Assistant', description: 'Helps developers write and review code' }
    ],
    useCases: ['Analyze business data', 'Research and summarization', 'Write code and documentation'],
    industries: ['Technology', 'Manufacturing', 'Transportation', 'Real Estate']
  },
  {
    id: 'specialized-industry',
    title: 'Specialized Industry',
    subtitle: 'Highly regulated and sensitive sectors',
    description: 'AI for industries with strict compliance and safety requirements',
    icon: SpecializedIcon,
    color: '#f3e5f5',
    borderColor: '#7b1fa2',
    roles: [
      { name: 'Healthcare Assistant', description: 'Supports medical workflows and patient care' },
      { name: 'Financial Advisor', description: 'Provides financial guidance and analysis' },
      { name: 'Legal Assistant', description: 'Assists with legal research and documentation' },
      { name: 'Government AI', description: 'Serves public sector and citizen services' }
    ],
    useCases: ['Process sensitive information', 'Provide specialized advice', 'Ensure regulatory compliance'],
    industries: ['Healthcare', 'Finance & Banking', 'Legal Services', 'Government']
  },
  {
    id: 'not-sure',
    title: 'Not Sure?',
    subtitle: 'We\'ll recommend based on your needs',
    description: 'Let us analyze your industry and suggest the best security approach',
    icon: HelpIcon,
    color: '#fff3e0',
    borderColor: '#f57c00',
    roles: [
      { name: 'Custom Recommendation', description: 'We\'ll assess your specific requirements' }
    ],
    useCases: ['Custom security assessment', 'Industry-specific recommendations'],
    industries: ['Education', 'Entertainment & Media', 'Manufacturing', 'Other']
  }
];

// Simplified industry options for the "Not Sure" category
const additionalIndustries = [
  'Education', 'Entertainment & Media', 'Manufacturing', 'Transportation',
  'Real Estate', 'Other'
];

export function GuestChatbotDetailsStep({ data, onUpdate, onNext }: GuestChatbotDetailsStepProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [expandedCategory, setExpandedCategory] = useState<string>('');
  const [chatbotRole, setChatbotRole] = useState(data.chatbotRole || '');
  const [industry, setIndustry] = useState<string[]>(data.industry || []);
  const [useCase, setUseCase] = useState<string[]>(data.useCase || []);

  const handleNext = () => {
    onUpdate({ chatbotRole, industry, useCase });
    onNext();
  };

  const handleCategorySelect = (categoryId: string) => {
    const category = aiCategories.find(cat => cat.id === categoryId);
    if (!category) return;

    setSelectedCategory(categoryId);
    setExpandedCategory(expandedCategory === categoryId ? '' : categoryId);
    
    // Auto-populate based on category selection
    if (categoryId !== 'not-sure') {
      setChatbotRole(category.roles[0].name);
      setIndustry(category.industries.slice(0, 2)); // Select first 2 industries as default
      setUseCase(category.useCases);
    }
  };

  const handleRoleSelect = (roleName: string) => {
    setChatbotRole(roleName);
  };

  const handleIndustryToggle = (industryName: string) => {
    setIndustry(prev => 
      prev.includes(industryName)
        ? prev.filter(ind => ind !== industryName)
        : [...prev, industryName]
    );
  };

  const isValid = selectedCategory && chatbotRole && industry.length > 0;

  return (
    <Box sx={{ maxWidth: '900px', mx: 'auto', textAlign: 'center' }}>
      <Typography variant="h3" gutterBottom align="center" sx={{ mb: 1, fontWeight: 'bold' }}>
        What type of AI system do you need secured?
      </Typography>
      <Typography variant="h6" color="text.secondary" sx={{ mb: 5, textAlign: 'center', fontWeight: 'normal' }}>
        Choose your AI category to customize your security testing plan
      </Typography>
      
      {/* Main Category Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {aiCategories.map((category) => {
          const IconComponent = category.icon;
          const isSelected = selectedCategory === category.id;
          const isExpanded = expandedCategory === category.id;
          
          return (
            <Grid item xs={12} md={6} key={category.id}>
              <Card 
                sx={{ 
                  height: '100%',
                  border: `3px solid ${isSelected ? category.borderColor : 'transparent'}`,
                  backgroundColor: isSelected ? category.color : '#ffffff',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: '0 8px 25px rgba(0,0,0,0.15)',
                  },
                }}
              >
                <CardActionArea onClick={() => handleCategorySelect(category.id)} sx={{ p: 0 }}>
                  <CardContent sx={{ p: 3, textAlign: 'left' }}>
                    <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 2 }}>
                      <IconComponent 
                        sx={{ 
                          fontSize: 48, 
                          color: category.borderColor, 
                          mr: 2,
                          mt: 0.5
                        }} 
                      />
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 0.5 }}>
                          {category.title}
                        </Typography>
                        <Typography variant="subtitle1" color="text.secondary" sx={{ mb: 1 }}>
                          {category.subtitle}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {category.description}
                        </Typography>
                      </Box>
                      {isSelected && (
                        <Box sx={{ ml: 1 }}>
                          {isExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                        </Box>
                      )}
                    </Box>
                  </CardContent>
                </CardActionArea>

                {/* Progressive Disclosure - Role & Industry Selection */}
                <Collapse in={isExpanded} timeout="auto" unmountOnExit>
                  <Divider />
                  <CardContent sx={{ pt: 2 }}>
                    {/* Role Selection */}
                    <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 'bold' }}>
                      Specific AI Role:
                    </Typography>
                    <Stack direction="row" spacing={1} sx={{ mb: 3, flexWrap: 'wrap', gap: 1 }}>
                      {category.roles.map((role) => (
                        <Chip
                          key={role.name}
                          label={role.name}
                          onClick={() => handleRoleSelect(role.name)}
                          sx={{
                            backgroundColor: chatbotRole === role.name ? category.borderColor : 'transparent',
                            border: `2px solid ${chatbotRole === role.name ? category.borderColor : '#e0e0e0'}`,
                            color: chatbotRole === role.name ? 'white' : 'inherit',
                            fontWeight: chatbotRole === role.name ? 'bold' : 'normal',
                            '&:hover': {
                              backgroundColor: category.borderColor,
                              color: 'white',
                              opacity: 0.8,
                            },
                          }}
                          clickable
                        />
                      ))}
                    </Stack>

                    {/* Industry Selection */}
                    <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 'bold' }}>
                      Your Industry:
                    </Typography>
                    <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', gap: 1 }}>
                      {category.industries.map((ind) => (
                        <Chip
                          key={ind}
                          label={ind}
                          onClick={() => handleIndustryToggle(ind)}
                          sx={{
                            backgroundColor: industry.includes(ind) ? category.color : 'transparent',
                            border: `2px solid ${industry.includes(ind) ? category.borderColor : '#e0e0e0'}`,
                            color: industry.includes(ind) ? category.borderColor : 'inherit',
                            fontWeight: industry.includes(ind) ? 'bold' : 'normal',
                            '&:hover': {
                              backgroundColor: category.color,
                              opacity: 0.8,
                            },
                          }}
                          clickable
                        />
                      ))}
                    </Stack>
                  </CardContent>
                </Collapse>
              </Card>
            </Grid>
          );
        })}
      </Grid>

      {/* Next Button */}
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <Button
          variant="contained"
          onClick={handleNext}
          disabled={!isValid}
          size="large"
          sx={{
            padding: '12px 32px',
            fontSize: '1.1rem',
            borderRadius: '24px',
            textTransform: 'none',
            background: 'linear-gradient(45deg, #1976d2 30%, #42a5f5 90%)',
            '&:hover': {
              background: 'linear-gradient(45deg, #1565c0 30%, #1e88e5 90%)',
            },
            '&:disabled': {
              background: '#e0e0e0',
              color: '#999',
            },
          }}
        >
          Continue →
        </Button>
      </Box>

      {/* Progress Indicator */}
      {selectedCategory && (
        <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
          Selected: {aiCategories.find(cat => cat.id === selectedCategory)?.title}
          {chatbotRole && ` • ${chatbotRole}`}
          {industry.length > 0 && ` • ${industry.join(', ')}`}
        </Typography>
      )}
    </Box>
  );
}