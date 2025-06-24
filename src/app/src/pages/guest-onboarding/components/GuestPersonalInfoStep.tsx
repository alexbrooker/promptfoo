import React, { useState } from 'react';
import {
  Box,
  TextField,
  Button,
  Typography,
  Grid,
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

interface GuestPersonalInfoStepProps {
  data: GuestOnboardingData;
  onUpdate: (updates: Partial<GuestOnboardingData>) => void;
  onNext: () => void;
  onBack?: () => void;
}

export function GuestPersonalInfoStep({ data, onUpdate, onNext, onBack }: GuestPersonalInfoStepProps) {
  const [name, setName] = useState(data.name || '');
  const [company, setCompany] = useState(data.company || '');

  const handleNext = () => {
    onUpdate({ name, company });
    onNext();
  };

  const isValid = name.trim() && company.trim();

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Tell us about yourself
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        We'll use this information to personalize your AI security testing experience
      </Typography>
      
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <TextField
            fullWidth
            label="Full Name"
            variant="outlined"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            helperText="Your name helps us create personalized test scenarios"
          />
        </Grid>
        <Grid item xs={12}>
          <TextField
            fullWidth
            label="Company Name"
            variant="outlined"
            value={company}
            onChange={(e) => setCompany(e.target.value)}
            required
            helperText="We'll tailor security tests to your industry and company size"
          />
        </Grid>
      </Grid>
      
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3 }}>
        {onBack && (
          <Button onClick={onBack} size="large">
            Back
          </Button>
        )}
        <Button
          variant="contained"
          onClick={handleNext}
          disabled={!isValid}
          size="large"
          sx={{ ml: 'auto' }}
        >
          Continue
        </Button>
      </Box>
    </Box>
  );
}