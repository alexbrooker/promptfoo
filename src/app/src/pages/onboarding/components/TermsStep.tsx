import React, { useState } from 'react';
import {
  Box,
  Button,
  Typography,
  FormControlLabel,
  Checkbox,
  Paper,
  Link,
} from '@mui/material';
import { useUserStore } from '@app/stores/userStore';

interface TermsStepProps {
  onComplete: () => void;
  onBack: () => void;
}

export function TermsStep({ onComplete, onBack }: TermsStepProps) {
  const { onboardingData, updateOnboardingData, saveOnboardingToProfile } = useUserStore();
  const [termsAccepted, setTermsAccepted] = useState(onboardingData.termsAccepted || false);

  const handleComplete = async () => {
    updateOnboardingData({ termsAccepted, onboardingCompleted: true });
    try {
      await saveOnboardingToProfile();
      onComplete();
    } catch (error) {
      console.error('Error saving onboarding data:', error);
      // Continue to complete even if save fails
      onComplete();
    }
  };

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Terms & Conditions
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Please review and accept our terms to complete your setup
      </Typography>
      
      <Paper variant="outlined" sx={{ p: 3, mb: 3, maxHeight: 300, overflow: 'auto' }}>
        <Typography variant="h6" gutterBottom>
          Promptfoo Terms of Service
        </Typography>
        <Typography variant="body2" paragraph>
          By using Promptfoo, you agree to the following terms and conditions:
        </Typography>
        <Typography variant="body2" paragraph>
          <strong>1. Data Privacy:</strong> We are committed to protecting your privacy and handling your data responsibly. 
          Your evaluation data and AI model interactions are processed securely and are not shared with third parties 
          without your explicit consent.
        </Typography>
        <Typography variant="body2" paragraph>
          <strong>2. Compliance:</strong> You are responsible for ensuring that your use of Promptfoo complies with 
          applicable laws and regulations in your jurisdiction, including data protection and AI governance requirements.
        </Typography>
        <Typography variant="body2" paragraph>
          <strong>3. Service Usage:</strong> Our service is provided "as is" and we strive to maintain high availability. 
          You agree to use the service responsibly and not to engage in any activities that could harm the platform 
          or other users.
        </Typography>
        <Typography variant="body2" paragraph>
          <strong>4. Security:</strong> We implement industry-standard security measures to protect your data. 
          You are responsible for maintaining the security of your account credentials.
        </Typography>
        <Typography variant="body2" paragraph>
          <strong>5. AI Ethics:</strong> You agree to use AI models and evaluations in an ethical manner, 
          avoiding harmful, biased, or discriminatory applications.
        </Typography>
        <Typography variant="body2">
          For the complete terms of service, please visit our{' '}
          <Link href="#" target="_blank" rel="noopener noreferrer">
            Terms of Service page
          </Link>.
        </Typography>
      </Paper>
      
      <FormControlLabel
        control={
          <Checkbox
            checked={termsAccepted}
            onChange={(e) => setTermsAccepted(e.target.checked)}
            color="primary"
          />
        }
        label={
          <Typography variant="body2">
            I have read and agree to the{' '}
            <Link href="#" target="_blank" rel="noopener noreferrer">
              Terms of Service
            </Link>{' '}
            and{' '}
            <Link href="#" target="_blank" rel="noopener noreferrer">
              Privacy Policy
            </Link>
          </Typography>
        }
      />
      
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3 }}>
        <Button onClick={onBack}>
          Back
        </Button>
        <Button
          variant="contained"
          onClick={handleComplete}
          disabled={!termsAccepted}
        >
          Complete Setup
        </Button>
      </Box>
    </Box>
  );
}