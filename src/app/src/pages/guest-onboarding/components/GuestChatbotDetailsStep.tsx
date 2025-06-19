import React, { useState } from 'react';
import {
  Box,
  TextField,
  Button,
  Typography,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  SelectChangeEvent,
  Chip,
  Stack,
} from '@mui/material';

interface GuestOnboardingData {
  name: string;
  company: string;
  chatbotRole: string;
  industry: string;
  useCase: string;
  complianceNeeds: string[];
  countryOfOperation: string;
}

interface GuestChatbotDetailsStepProps {
  data: GuestOnboardingData;
  onUpdate: (updates: Partial<GuestOnboardingData>) => void;
  onNext: () => void;
  onBack: () => void;
}

const industries = [
  'Healthcare',
  'Finance & Banking',
  'Technology',
  'Education',
  'Retail & E-commerce',
  'Manufacturing',
  'Legal Services',
  'Government',
  'Transportation',
  'Real Estate',
  'Entertainment & Media',
  'Other'
];

const chatbotRoles = [
  'Customer Support',
  'Sales Assistant',
  'Content Generation',
  'Data Analysis',
  'Personal Assistant',
  'Educational Tutor',
  'Technical Support',
  'Research Assistant',
  'Creative Writing',
  'Code Assistant',
  'Internal Tool',
  'Other'
];

const commonUseCases = [
  'Answer customer questions',
  'Generate marketing content',
  'Process customer support tickets',
  'Analyze business data',
  'Create educational content',
  'Write code and documentation',
  'Personal productivity assistant',
  'Research and summarization'
];

export function GuestChatbotDetailsStep({ data, onUpdate, onNext, onBack }: GuestChatbotDetailsStepProps) {
  const [chatbotRole, setChatbotRole] = useState(data.chatbotRole || '');
  const [industry, setIndustry] = useState(data.industry || '');
  const [useCase, setUseCase] = useState(data.useCase || '');

  const handleNext = () => {
    onUpdate({ chatbotRole, industry, useCase });
    onNext();
  };

  const handleUseCaseChipClick = (selectedUseCase: string) => {
    setUseCase(selectedUseCase);
  };

  const isValid = chatbotRole && industry && useCase.trim();

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        AI Assistant Details
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Help us understand your AI assistant so we can create targeted security tests
      </Typography>
      
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <FormControl fullWidth required>
            <InputLabel>Primary Role of AI Assistant</InputLabel>
            <Select
              value={chatbotRole}
              label="Primary Role of AI Assistant"
              onChange={(e: SelectChangeEvent) => setChatbotRole(e.target.value)}
            >
              {chatbotRoles.map((role) => (
                <MenuItem key={role} value={role}>{role}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
        
        <Grid item xs={12}>
          <FormControl fullWidth required>
            <InputLabel>Industry</InputLabel>
            <Select
              value={industry}
              label="Industry"
              onChange={(e: SelectChangeEvent) => setIndustry(e.target.value)}
            >
              {industries.map((ind) => (
                <MenuItem key={ind} value={ind}>{ind}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>

        <Grid item xs={12}>
          <Typography variant="subtitle2" gutterBottom>
            Common Use Cases (click to select):
          </Typography>
          <Stack direction="row" spacing={1} sx={{ mb: 2, flexWrap: 'wrap', gap: 1 }}>
            {commonUseCases.map((commonUseCase) => (
              <Chip
                key={commonUseCase}
                label={commonUseCase}
                onClick={() => handleUseCaseChipClick(commonUseCase)}
                color={useCase === commonUseCase ? 'primary' : 'default'}
                variant={useCase === commonUseCase ? 'filled' : 'outlined'}
                clickable
              />
            ))}
          </Stack>
        </Grid>
        
        <Grid item xs={12}>
          <TextField
            fullWidth
            label="Specific Use Case"
            variant="outlined"
            multiline
            rows={3}
            value={useCase}
            onChange={(e) => setUseCase(e.target.value)}
            placeholder="Describe your specific use case for the AI assistant..."
            required
            helperText="Be specific about what your AI does - this helps us create relevant security tests"
          />
        </Grid>
      </Grid>
      
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3 }}>
        <Button onClick={onBack} size="large">
          Back
        </Button>
        <Button
          variant="contained"
          onClick={handleNext}
          disabled={!isValid}
          size="large"
        >
          Continue
        </Button>
      </Box>
    </Box>
  );
}