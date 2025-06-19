import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import ErrorBoundary from '@app/components/ErrorBoundary';
import { useTelemetry } from '@app/hooks/useTelemetry';
import { useToast } from '@app/hooks/useToast';
import KeyboardArrowLeftIcon from '@mui/icons-material/KeyboardArrowLeft';
import TargetIcon from '@mui/icons-material/GpsFixed';
import ReviewIcon from '@mui/icons-material/RateReview';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Paper from '@mui/material/Paper';
import Step from '@mui/material/Step';
import StepLabel from '@mui/material/StepLabel';
import Stepper from '@mui/material/Stepper';
import Typography from '@mui/material/Typography';
import { styled } from '@mui/material/styles';
import { DEFAULT_HTTP_TARGET, useRedTeamConfig } from '../setup/hooks/useRedTeamConfig';
import { loadTemplate } from '../setup/utils/templateLoader';
import { customizeQuickScanConfig, QUICK_SCAN_RUN_SETTINGS } from '@app/utils/quickScanCustomizer';
import { useUserStore } from '@app/stores/userStore';
import Targets from '../setup/components/Targets';
import QuickScanReview from './components/QuickScanReview';
import ProfileSettings from './components/ProfileSettings';
import type { Config } from '../setup/types';

const Root = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  minHeight: '100vh',
  backgroundColor: theme.palette.background.default,
  padding: theme.spacing(3),
}));

const ContentContainer = styled(Paper)(({ theme }) => ({
  maxWidth: '1200px',
  margin: '0 auto',
  padding: theme.spacing(4),
  borderRadius: theme.spacing(2),
  boxShadow: theme.shadows[2],
}));

const StepContent = styled(Box)(({ theme }) => ({
  marginTop: theme.spacing(4),
  marginBottom: theme.spacing(4),
}));

const NavigationContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  justifyContent: 'space-between',
  marginTop: theme.spacing(4),
  gap: theme.spacing(2),
}));

const steps = [
  { label: 'Configure Target', icon: <TargetIcon /> },
  { label: 'Review & Start', icon: <ReviewIcon /> },
];

export default function QuickScanPage() {
  const navigate = useNavigate();
  const { setFullConfig } = useRedTeamConfig();
  const { recordEvent } = useTelemetry();
  const toast = useToast();
  const { onboardingData } = useUserStore();
  const [activeStep, setActiveStep] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [currentProfile, setCurrentProfile] = useState(onboardingData);
  const hasInitialized = useRef(false);

  // Auto-load the quick template on component mount
  useEffect(() => {
    // Prevent multiple loads using ref
    if (hasInitialized.current) {
      return;
    }
    hasInitialized.current = true;

    const initializeQuickTemplate = async () => {
      try {
        setIsLoading(true);
        let baseConfig: Config;
        
        try {
          // Try to load the server template first
          baseConfig = await loadTemplate('quick');
        } catch (templateError) {
          console.warn('Server template not available, using fallback:', templateError);
          // Use fallback config if server template fails
          baseConfig = {
            description: 'Quick Security Scan',
            prompts: ['{{prompt}}'],
            target: DEFAULT_HTTP_TARGET,
            plugins: ['prompt-extraction', 'pii:direct', 'harmful:hate', 'excessive-agency', 'hallucination'],
            strategies: ['jailbreak', 'prompt-injection', 'jailbreak:composite'],
            purpose: 'Quick AI security assessment',
            entities: [],
            numTests: 10,
            applicationDefinition: {
              purpose: 'Quick AI security assessment',
              redteamUser: '',
              accessToData: '',
              forbiddenData: '',
              accessToActions: '',
              forbiddenActions: '',
              connectedSystems: '',
            },
          };
        }
        
        // Customize the config based on user's onboarding data
        const customizedConfig = customizeQuickScanConfig(baseConfig, onboardingData);
        
        setFullConfig(customizedConfig);
        toast.showToast(
          `Quick scan template loaded and customized for ${onboardingData.industry || 'your use case'}`, 
          'success'
        );
        recordEvent('feature_used', { 
          feature: 'quick_scan_template_loaded',
          industry: onboardingData.industry,
          useCase: onboardingData.useCase,
          complianceNeeds: onboardingData.complianceNeeds,
        });
      } catch (error) {
        console.error('Failed to initialize quick scan:', error);
        toast.showToast('Failed to load quick scan configuration.', 'error');
      } finally {
        setIsLoading(false);
      }
    };

    initializeQuickTemplate();
  }, []); // Empty dependency array - only run once on mount

  useEffect(() => {
    recordEvent('webui_page_view', { page: 'quick_scan_setup' });
  }, []); // Only run once on mount

  // Update currentProfile when onboardingData changes
  useEffect(() => {
    setCurrentProfile(onboardingData);
  }, [onboardingData]);

  const handleNext = () => {
    if (activeStep < steps.length - 1) {
      setActiveStep((prevStep) => prevStep + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleBack = () => {
    if (activeStep > 0) {
      setActiveStep((prevStep) => prevStep - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleCancel = () => {
    navigate('/home');
  };

  const handleProfileUpdate = async (updatedProfile: any) => {
    setCurrentProfile(updatedProfile);
    
    try {
      // Re-customize the config with updated profile data
      let baseConfig: Config;
      
      try {
        baseConfig = await loadTemplate('quick');
      } catch (templateError) {
        console.warn('Server template not available, using fallback:', templateError);
        baseConfig = {
          description: 'Quick Security Scan',
          prompts: ['{{prompt}}'],
          target: DEFAULT_HTTP_TARGET,
          plugins: ['prompt-extraction', 'pii:direct', 'harmful:hate', 'excessive-agency', 'hallucination'],
          strategies: ['jailbreak', 'prompt-injection', 'jailbreak:composite'],
          purpose: 'Quick AI security assessment',
          entities: [],
          numTests: 10,
          applicationDefinition: {
            purpose: 'Quick AI security assessment',
            redteamUser: '',
            accessToData: '',
            forbiddenData: '',
            accessToActions: '',
            forbiddenActions: '',
            connectedSystems: '',
          },
        };
      }
      
      const customizedConfig = customizeQuickScanConfig(baseConfig, updatedProfile);
      setFullConfig(customizedConfig);
      
      toast.showToast(
        `Quick scan updated for ${updatedProfile.industry || 'your use case'}`, 
        'success'
      );
    } catch (error) {
      console.error('Failed to update quick scan config:', error);
      toast.showToast('Failed to update quick scan configuration.', 'error');
    }
  };

  if (isLoading) {
    return (
      <Root>
        <ContentContainer>
          <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
            <Typography variant="h6">Loading Quick Scan Template...</Typography>
          </Box>
        </ContentContainer>
      </Root>
    );
  }

  const renderStepContent = (step: number) => {
    switch (step) {
      case 0:
        return (
          <ErrorBoundary name="Quick Scan Targets">
            <Targets 
              onNext={handleNext} 
              onBack={handleCancel}
              setupModalOpen={false}
            />
          </ErrorBoundary>
        );
      case 1:
        return (
          <ErrorBoundary name="Quick Scan Review">
            <QuickScanReview />
          </ErrorBoundary>
        );
      default:
        return <Typography>Unknown step</Typography>;
    }
  };

  return (
    <Root>
      <ContentContainer>
        {/* Header */}
        <Box mb={4}>
          <Typography variant="h3" gutterBottom fontWeight="bold" color="primary">
            Quick Security Scan
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Perform a rapid AI security assessment with pre-configured settings optimized for{' '}
            {currentProfile.industry || 'your use case'}. Just configure your target and start testing.
          </Typography>
          {currentProfile.complianceNeeds?.length > 0 && currentProfile.complianceNeeds[0] !== 'None' && (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1, fontStyle: 'italic' }}>
              Includes compliance checks for: {currentProfile.complianceNeeds.filter(c => c !== 'None').join(', ')}
            </Typography>
          )}
        </Box>

        {/* Profile Settings */}
        <ProfileSettings onProfileUpdate={handleProfileUpdate} />

        {/* Stepper */}
        <Stepper activeStep={activeStep} alternativeLabel sx={{ mb: 4 }}>
          {steps.map((step, index) => (
            <Step key={step.label}>
              <StepLabel
                StepIconComponent={() => (
                  <Box
                    sx={{
                      width: 40,
                      height: 40,
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: index <= activeStep ? 'primary.main' : 'grey.300',
                      color: index <= activeStep ? 'white' : 'grey.600',
                    }}
                  >
                    {step.icon}
                  </Box>
                )}
              >
                {step.label}
              </StepLabel>
            </Step>
          ))}
        </Stepper>

        {/* Step Content */}
        <StepContent>
          {renderStepContent(activeStep)}
        </StepContent>

        {/* Navigation Buttons - Only show on review step */}
        {activeStep === 1 && (
          <NavigationContainer>
            <Button
              variant="outlined"
              startIcon={<KeyboardArrowLeftIcon />}
              onClick={handleBack}
              sx={{ px: 4, py: 1 }}
            >
              Back to Target Config
            </Button>
            <Button
              variant="outlined"
              onClick={handleCancel}
              sx={{ px: 4, py: 1 }}
            >
              Cancel
            </Button>
          </NavigationContainer>
        )}
      </ContentContainer>
    </Root>
  );
}