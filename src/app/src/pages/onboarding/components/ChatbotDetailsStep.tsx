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
} from '@mui/material';
import { useUserStore } from '@app/stores/userStore';

interface ChatbotDetailsStepProps {
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
  'Other'
];

export function ChatbotDetailsStep({ onNext, onBack }: ChatbotDetailsStepProps) {
  const { onboardingData, updateOnboardingData, saveOnboardingToProfile } = useUserStore();
  const [chatbotRole, setChatbotRole] = useState(onboardingData.chatbotRole || '');
  const [industry, setIndustry] = useState(onboardingData.industry || '');
  const [useCase, setUseCase] = useState(onboardingData.useCase || '');

  const handleNext = async () => {
    updateOnboardingData({ chatbotRole, industry, useCase });
    try {
      await saveOnboardingToProfile();
      onNext();
    } catch (error) {
      console.error('Error saving onboarding data:', error);
      // Continue to next step even if save fails
      onNext();
    }
  };

  const isValid = chatbotRole && industry && useCase.trim();

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        AI Chatbot Details
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Help us understand how you plan to use AI in your organization
      </Typography>
      
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <FormControl fullWidth required>
            <InputLabel>Primary Role of AI Chatbot</InputLabel>
            <Select
              value={chatbotRole}
              label="Primary Role of AI Chatbot"
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
          <TextField
            fullWidth
            label="Specific Use Case"
            variant="outlined"
            multiline
            rows={3}
            value={useCase}
            onChange={(e) => setUseCase(e.target.value)}
            placeholder="Describe your specific use case for the AI chatbot..."
            required
          />
        </Grid>
      </Grid>
      
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3 }}>
        <Button onClick={onBack}>
          Back
        </Button>
        <Button
          variant="contained"
          onClick={handleNext}
          disabled={!isValid}
        >
          Next
        </Button>
      </Box>
    </Box>
  );
}