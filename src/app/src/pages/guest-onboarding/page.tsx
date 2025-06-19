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
import { useNavigate, useSearchParams } from 'react-router-dom';
import { GuestPersonalInfoStep } from './components/GuestPersonalInfoStep';
import { GuestChatbotDetailsStep } from './components/GuestChatbotDetailsStep';
import { GuestComplianceStep } from './components/GuestComplianceStep';
import { GuestSignupStep } from './components/GuestSignupStep';

const steps = [
  'Personal Information',
  'AI Assistant Details', 
  'Testing Goals',
  'Create Free Account'
];

interface GuestOnboardingData {
  name: string;
  company: string;
  chatbotRole: string;
  industry: string;
  useCase: string;
  complianceNeeds: string[];
  countryOfOperation: string;
}

const defaultData: GuestOnboardingData = {
  name: '',
  company: '',
  chatbotRole: '',
  industry: '',
  useCase: '',
  complianceNeeds: [],
  countryOfOperation: '',
};

export default function GuestOnboardingPage() {
  const [activeStep, setActiveStep] = useState(0);
  const [guestData, setGuestData] = useState<GuestOnboardingData>(defaultData);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Load data from localStorage on mount
  useEffect(() => {
    const savedData = localStorage.getItem('guestOnboardingData');
    if (savedData) {
      try {
        const parsedData = JSON.parse(savedData);
        setGuestData({ ...defaultData, ...parsedData });
      } catch (error) {
        console.error('Error parsing saved guest data:', error);
      }
    }
  }, []);

  // Save data to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('guestOnboardingData', JSON.stringify(guestData));
  }, [guestData]);

  const updateGuestData = (updates: Partial<GuestOnboardingData>) => {
    setGuestData(prev => ({ ...prev, ...updates }));
  };

  const handleNext = () => {
    setActiveStep((prevActiveStep) => prevActiveStep + 1);
  };

  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
  };

  const handleSignupComplete = () => {
    // Clear localStorage after successful signup
    localStorage.removeItem('guestOnboardingData');
    // Redirect to the next URL or default to dashboard
    const nextUrl = searchParams.get('next') || '/dashboard';
    navigate(nextUrl);
  };

  const getStepContent = (step: number) => {
    switch (step) {
      case 0:
        return (
          <GuestPersonalInfoStep 
            data={guestData}
            onUpdate={updateGuestData}
            onNext={handleNext} 
          />
        );
      case 1:
        return (
          <GuestChatbotDetailsStep 
            data={guestData}
            onUpdate={updateGuestData}
            onNext={handleNext} 
            onBack={handleBack} 
          />
        );
      case 2:
        return (
          <GuestComplianceStep 
            data={guestData}
            onUpdate={updateGuestData}
            onNext={handleNext} 
            onBack={handleBack} 
          />
        );
      case 3:
        return (
          <GuestSignupStep 
            guestData={guestData}
            onComplete={handleSignupComplete} 
            onBack={handleBack} 
          />
        );
      default:
        return 'Unknown step';
    }
  };

  return (
    <Container maxWidth="md">
      <Box sx={{ width: '100%', mt: 4 }}>
        <Paper elevation={3} sx={{ p: 4 }}>
          <Typography variant="h4" component="h1" gutterBottom align="center">
            Get Started with AI Security Testing
          </Typography>
          <Typography variant="subtitle1" gutterBottom align="center" color="text.secondary" sx={{ mb: 4 }}>
            Create a personalized security testing plan for your AI assistant in minutes
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