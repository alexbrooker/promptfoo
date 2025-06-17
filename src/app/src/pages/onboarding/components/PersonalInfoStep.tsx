import React, { useState } from 'react';
import {
  Box,
  TextField,
  Button,
  Typography,
  Grid,
} from '@mui/material';
import { useUserStore } from '@app/stores/userStore';

interface PersonalInfoStepProps {
  onNext: () => void;
}

export function PersonalInfoStep({ onNext }: PersonalInfoStepProps) {
  const { onboardingData, updateOnboardingData, saveOnboardingToProfile } = useUserStore();
  const [name, setName] = useState(onboardingData.name || '');
  const [company, setCompany] = useState(onboardingData.company || '');

  const handleNext = async () => {
    updateOnboardingData({ name, company });
    try {
      await saveOnboardingToProfile();
      onNext();
    } catch (error) {
      console.error('Error saving onboarding data:', error);
      // Continue to next step even if save fails
      onNext();
    }
  };

  const isValid = name.trim() && company.trim();

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Tell us about yourself
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        We'll use this information to personalize your experience
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
          />
        </Grid>
      </Grid>
      
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 3 }}>
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