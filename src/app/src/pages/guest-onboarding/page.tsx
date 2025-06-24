import React, { useState, useEffect } from 'react';
import {
  Box,
  Stepper,
  Step,
  StepLabel,
  Button,
  Typography,
  Paper,
} from '@mui/material';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { GuestChatbotDetailsStep } from './components/GuestChatbotDetailsStep';
import { GuestTestPlanStep } from './components/GuestTestPlanStep';
import { GuestSignupStep } from './components/GuestSignupStep';

const steps = [
  'AI System Details',
  'Testing Plan',
  'Get Started'
];

interface GuestOnboardingData {
  chatbotRole: string;
  industry: string[];
  useCase: string[];
  complianceNeeds: string[];
  countryOfOperation: string;
  generatedConfig?: any; // Store the generated test plan config
}

// Hardcoded compliance needs - all frameworks we support
const ALL_COMPLIANCE_NEEDS = [
  'OWASP LLM Top 10',
  'OWASP API Security', 
  'MITRE ATLAS',
  'NIST AI Framework',
  'EU AI Act'
];

const defaultData: GuestOnboardingData = {
  chatbotRole: '',
  industry: [],
  useCase: [],
  complianceNeeds: ALL_COMPLIANCE_NEEDS, // Always include all frameworks
  countryOfOperation: '',
  generatedConfig: null,
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

  const handleTestPlanGenerated = (config: any) => {
    updateGuestData({ generatedConfig: config });
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
          <GuestChatbotDetailsStep 
            data={guestData}
            onUpdate={updateGuestData}
            onNext={handleNext} 
          />
        );
      case 1:
        return (
          <GuestTestPlanStep 
            data={guestData}
            onNext={handleNext} 
            onBack={handleBack}
            onTestPlanGenerated={handleTestPlanGenerated}
          />
        );
      case 2:
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
    <Paper 
      elevation={6} 
      sx={{ 
        p: { xs: 3, md: 5 }, 
        borderRadius: 3,
        background: 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(255, 255, 255, 0.2)',
      }}
    >
      
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
  );
}