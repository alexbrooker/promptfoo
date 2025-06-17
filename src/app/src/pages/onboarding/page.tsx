import React, { useState, useEffect } from 'react';
import {
  Box,
  Stepper,
  Step,
  StepLabel,
  Button,
  Typography,
  Paper,
  Container,
} from '@mui/material';
import { useUserStore } from '@app/stores/userStore';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { PersonalInfoStep } from './components/PersonalInfoStep';
import { ChatbotDetailsStep } from './components/ChatbotDetailsStep';
import { ComplianceStep } from './components/ComplianceStep';
import { TermsStep } from './components/TermsStep';

const steps = [
  'Personal Information',
  'Chatbot Details',
  'Compliance & Operations',
  'Terms & Conditions'
];

export default function OnboardingPage() {
  const [activeStep, setActiveStep] = useState(0);
  const { user, onboardingData, updateOnboardingData, saveOnboardingToProfile, fetchOnboardingData } = useUserStore();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    if (user) {
      fetchOnboardingData();
    }
  }, [user, fetchOnboardingData]);

  useEffect(() => {
    if (onboardingData.onboardingCompleted) {
      // Check if there's a 'next' parameter to redirect to after onboarding
      const nextUrl = searchParams.get('next') || '/subscription';
      navigate(nextUrl);
    }
  }, [onboardingData.onboardingCompleted, navigate, searchParams]);

  const handleNext = () => {
    setActiveStep((prevActiveStep) => prevActiveStep + 1);
  };

  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
  };

  const handleComplete = () => {
    // Data is already saved in the TermsStep component
    navigate('/subscription');
  };

  const getStepContent = (step: number) => {
    switch (step) {
      case 0:
        return <PersonalInfoStep onNext={handleNext} />;
      case 1:
        return <ChatbotDetailsStep onNext={handleNext} onBack={handleBack} />;
      case 2:
        return <ComplianceStep onNext={handleNext} onBack={handleBack} />;
      case 3:
        return <TermsStep onComplete={handleComplete} onBack={handleBack} />;
      default:
        return 'Unknown step';
    }
  };

  if (!user) {
    return <div>Loading...</div>;
  }

  return (
    <Container maxWidth="md">
      <Box sx={{ width: '100%', mt: 4 }}>
        <Paper elevation={3} sx={{ p: 4 }}>
          <Typography variant="h4" component="h1" gutterBottom align="center">
            Welcome to Promptfoo
          </Typography>
          <Typography variant="subtitle1" gutterBottom align="center" color="text.secondary" sx={{ mb: 4 }}>
            Let's get you set up with a few quick questions
          </Typography>
          
          <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
            {steps.map((label) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>
          
          <Box sx={{ mt: 2 }}>
            {getStepContent(activeStep)}
          </Box>
        </Paper>
      </Box>
    </Container>
  );
}