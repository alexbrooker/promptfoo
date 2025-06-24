import React, { useState } from 'react';
import {
  Box,
  Button,
  Typography,
  Grid,
  Chip,
  Stack,
} from '@mui/material';

interface GuestOnboardingData {
  chatbotRole: string;
  industry: string[];
  useCase: string[];
  complianceNeeds: string[];
  countryOfOperation: string;
}

interface GuestComplianceStepProps {
  data: GuestOnboardingData;
  onUpdate: (updates: Partial<GuestOnboardingData>) => void;
  onNext: () => void;
  onBack: () => void;
}

const securityFrameworks = [
  { name: 'OWASP LLM Top 10', color: '#e3f2fd', description: 'Core AI security vulnerabilities' },
  { name: 'OWASP API Security', color: '#f3e5f5', description: 'API security best practices' },
  { name: 'MITRE ATLAS', color: '#e8f5e8', description: 'AI threat taxonomy' },
  { name: 'NIST AI Framework', color: '#fff3e0', description: 'AI risk management' },
  { name: 'EU AI Act', color: '#fce4ec', description: 'European AI regulation' }
];

const testingGoals = [
  'Prevent data leaks and privacy violations',
  'Ensure safe responses to harmful content',
  'Test resistance to jailbreaking attempts',
  'Check for bias and fairness issues',
  'Validate prompt injection defenses',
  'Test output quality and accuracy',
  'Ensure appropriate content filtering',
  'Verify system security boundaries'
];

export function GuestComplianceStep({ data, onUpdate, onNext, onBack }: GuestComplianceStepProps) {
  const [selectedGoals, setSelectedGoals] = useState<string[]>([]);
  const [selectedFrameworks, setSelectedFrameworks] = useState<string[]>(data.complianceNeeds || []);

  const handleGoalToggle = (goal: string) => {
    setSelectedGoals(prev =>
      prev.includes(goal)
        ? prev.filter(g => g !== goal)
        : [...prev, goal]
    );
  };

  const handleFrameworkToggle = (framework: string) => {
    setSelectedFrameworks(prev =>
      prev.includes(framework)
        ? prev.filter(f => f !== framework)
        : [...prev, framework]
    );
  };

  const handleNext = () => {
    onUpdate({ complianceNeeds: selectedFrameworks });
    onNext();
  };

  const isValid = selectedGoals.length > 0;

  return (
    <Box sx={{ maxWidth: '800px', mx: 'auto', textAlign: 'center' }}>
      <Typography variant="h3" gutterBottom align="center" sx={{ mb: 1, fontWeight: 'bold' }}>
        I want to test my AI for...
      </Typography>
      <Typography variant="h6" color="text.secondary" sx={{ mb: 5, textAlign: 'center', fontWeight: 'normal' }}>
        Choose your security priorities to customize your testing plan
      </Typography>
      
      <Grid container spacing={4} justifyContent="center">
        <Grid item xs={12}>
          <Stack direction="row" spacing={1} sx={{ mb: 4, flexWrap: 'wrap', gap: 1, justifyContent: 'center' }}>
            {testingGoals.map((goal) => (
              <Chip
                key={goal}
                label={goal}
                onClick={() => handleGoalToggle(goal)}
                sx={{
                  backgroundColor: selectedGoals.includes(goal) ? '#1976d2' : 'transparent',
                  border: `2px solid ${selectedGoals.includes(goal) ? '#1976d2' : '#e0e0e0'}`,
                  color: selectedGoals.includes(goal) ? 'white' : 'inherit',
                  fontWeight: selectedGoals.includes(goal) ? 'bold' : 'normal',
                  fontSize: '1rem',
                  padding: '8px 16px',
                  '&:hover': {
                    backgroundColor: selectedGoals.includes(goal) ? '#1565c0' : '#f5f5f5',
                  },
                }}
                clickable
              />
            ))}
          </Stack>
        </Grid>

        <Grid item xs={12}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 4, flexWrap: 'wrap', gap: 2, justifyContent: 'center' }}>
            <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#666', mr: 2 }}>
              using
            </Typography>
            <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', gap: 1, justifyContent: 'center' }}>
              {securityFrameworks.map((framework) => (
                <Chip
                  key={framework.name}
                  label={framework.name}
                  onClick={() => handleFrameworkToggle(framework.name)}
                  sx={{
                    backgroundColor: selectedFrameworks.includes(framework.name) ? framework.color : 'transparent',
                    border: `2px solid ${selectedFrameworks.includes(framework.name) ? framework.color : '#e0e0e0'}`,
                    color: selectedFrameworks.includes(framework.name) ? '#1976d2' : 'inherit',
                    fontWeight: selectedFrameworks.includes(framework.name) ? 'bold' : 'normal',
                    fontSize: '1rem',
                    padding: '8px 16px',
                    '&:hover': {
                      backgroundColor: framework.color,
                      opacity: 0.8,
                    },
                  }}
                  clickable
                />
              ))}
            </Stack>
          </Box>
        </Grid>
      </Grid>
      
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4, maxWidth: '400px', mx: 'auto' }}>
        <Button 
          onClick={onBack} 
          size="large"
          sx={{
            padding: '12px 24px',
            fontSize: '1rem',
            borderRadius: '24px',
            textTransform: 'none',
          }}
        >
          ← Back
        </Button>
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
          }}
        >
          Create my security plan →
        </Button>
      </Box>
    </Box>
  );
}