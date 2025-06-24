import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import ErrorBoundary from '@app/components/ErrorBoundary';
import { useTelemetry } from '@app/hooks/useTelemetry';
import { useToast } from '@app/hooks/useToast';
import { callAuthenticatedApi } from '@app/utils/api';
import KeyboardArrowLeftIcon from '@mui/icons-material/KeyboardArrowLeft';
import TargetIcon from '@mui/icons-material/GpsFixed';
import ReviewIcon from '@mui/icons-material/RateReview';
import LibraryBooksIcon from '@mui/icons-material/LibraryBooks';
import { PlayArrow, Security, Shield } from '@mui/icons-material';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Paper from '@mui/material/Paper';
import Step from '@mui/material/Step';
import StepLabel from '@mui/material/StepLabel';
import Stepper from '@mui/material/Stepper';
import Typography from '@mui/material/Typography';
import { styled } from '@mui/material/styles';
import { Card, CardContent, Grid, Chip, CircularProgress, Alert } from '@mui/material';
import { DEFAULT_HTTP_TARGET, useRedTeamConfig } from '../setup/hooks/useRedTeamConfig';
import { loadTemplate } from '../setup/utils/templateLoader';
import { customizeQuickScanConfig, QUICK_SCAN_RUN_SETTINGS } from '@app/utils/quickScanCustomizer';
import { useUserStore } from '@app/stores/userStore';
import Targets from '../setup/components/Targets';
import QuickScanReview from './components/QuickScanReview';
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
  maxWidth: '800px',
  margin: '0 auto',
  marginTop: theme.spacing(4),
  marginBottom: theme.spacing(4),
}));

const NavigationContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  justifyContent: 'space-between',
  marginTop: theme.spacing(4),
  gap: theme.spacing(2),
}));

interface TestPlan {
  id: string;
  name: string;
  type: string;
  config: any;
  createdAt: string;
  updatedAt: string;
}

const steps = [
  { label: 'Select Test Plan', icon: <LibraryBooksIcon /> },
  { label: 'Configure Target', icon: <TargetIcon /> },
  { label: 'Review & Start', icon: <ReviewIcon /> },
];

export default function QuickScanPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { setFullConfig } = useRedTeamConfig();
  const { recordEvent } = useTelemetry();
  const toast = useToast();
  const { onboardingData } = useUserStore();
  const [activeStep, setActiveStep] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [testPlans, setTestPlans] = useState<TestPlan[]>([]);
  const [selectedTestPlanId, setSelectedTestPlanId] = useState<string | null>(null);
  const hasInitialized = useRef(false);

  // Load test plans on component mount
  useEffect(() => {
    // Prevent multiple loads using ref
    if (hasInitialized.current) {
      return;
    }
    hasInitialized.current = true;

    const loadTestPlans = async () => {
      try {
        setIsLoading(true);
        const response = await callAuthenticatedApi('/configs?type=redteam');
        const data = await response.json();

        if (data.error) {
          throw new Error(data.error);
        }

        // Sort by most recent first
        const sortedPlans = data.configs.sort(
          (a: TestPlan, b: TestPlan) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
        );

        setTestPlans(sortedPlans);
        
        // Check if there's a config parameter in the URL
        const configParam = searchParams.get('config');
        if (configParam) {
          const selectedPlan = sortedPlans.find((plan: TestPlan) => plan.id === configParam);
          if (selectedPlan) {
            setSelectedTestPlanId(configParam);
            setFullConfig(selectedPlan.config);
            toast.showToast(`Test plan "${selectedPlan.name}" loaded from URL`, 'success');
            recordEvent('feature_used', { 
              feature: 'quick_scan_test_plan_loaded_from_url',
              testPlanId: configParam,
              testPlanName: selectedPlan.name,
            });
          } else {
            toast.showToast('Test plan not found', 'warning');
          }
        }
      } catch (error) {
        console.error('Failed to load test plans:', error);
        toast.showToast(
          error instanceof Error ? error.message : 'Failed to load test plans',
          'error'
        );
      } finally {
        setIsLoading(false);
      }
    };

    loadTestPlans();
  }, [searchParams]); // Include searchParams in dependency array

  useEffect(() => {
    recordEvent('webui_page_view', { page: 'quick_scan_setup' });
  }, []); // Only run once on mount


  const handleNext = () => {
    if (activeStep === 0 && !selectedTestPlanId) {
      toast.showToast('Please select a test plan to continue', 'warning');
      return;
    }
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

  const handleTestPlanSelect = (planId: string) => {
    setSelectedTestPlanId(planId);
    const selectedPlan = testPlans.find(plan => plan.id === planId);
    if (selectedPlan) {
      setFullConfig(selectedPlan.config);
      
      // Update URL parameter
      const newSearchParams = new URLSearchParams(searchParams);
      newSearchParams.set('config', planId);
      navigate(`${location.pathname}?${newSearchParams.toString()}`, { replace: true });
      
      toast.showToast(`Test plan "${selectedPlan.name}" loaded`, 'success');
      recordEvent('feature_used', { 
        feature: 'quick_scan_test_plan_selected',
        testPlanId: planId,
        testPlanName: selectedPlan.name,
      });
    }
  };

  const getPluginCount = (config: any) => {
    if (!config?.plugins) return 0;
    return Array.isArray(config.plugins) ? config.plugins.length : 0;
  };

  const getStrategyCount = (config: any) => {
    if (!config?.strategies) return 0;
    return Array.isArray(config.strategies) ? config.strategies.length : 0;
  };

  const getFrameworks = (config: any) => {
    const frameworks = [];
    const plugins = config?.plugins || [];
    const strategies = config?.strategies || [];
    
    // OWASP LLM indicators
    const owaspLlmPlugins = ['prompt-extraction', 'harmful', 'pii', 'excessive-agency', 'ascii-smuggling', 'indirect-prompt-injection'];
    const owaspLlmStrategies = ['jailbreak', 'prompt-injection'];
    
    // MITRE ATLAS indicators  
    const mitreAtlasPlugins = ['shell-injection', 'sql-injection', 'ssrf', 'debug-access', 'competitors', 'hijacking'];
    
    const hasOwaspLlm = plugins.some((p: any) => {
      const pluginId = typeof p === 'string' ? p : p.id;
      return owaspLlmPlugins.some(owaspPlugin => pluginId?.includes(owaspPlugin));
    }) || strategies.some((s: string) => owaspLlmStrategies.includes(s));
    
    const hasMitreAtlas = plugins.some((p: any) => {
      const pluginId = typeof p === 'string' ? p : p.id;
      return mitreAtlasPlugins.some(mitrePlugin => pluginId?.includes(mitrePlugin));
    });
    
    if (hasOwaspLlm) frameworks.push('OWASP LLM Top 10');
    if (hasMitreAtlas) frameworks.push('MITRE ATLAS');
    
    return frameworks;
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
          <ErrorBoundary name="Test Plan Selection">
            <Box>
              <Typography variant="h6" gutterBottom>
                Choose a Test Plan
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Select a pre-configured test plan to run. Each plan contains specific security tests and compliance checks.
              </Typography>
              
              {testPlans.length === 0 ? (
                <Alert severity="info" sx={{ mb: 4 }}>
                  <Typography variant="h6" gutterBottom>
                    No test plans found
                  </Typography>
                  <Typography variant="body2" sx={{ mb: 2 }}>
                    You need to create a test plan first before running a quick scan.
                  </Typography>
                  <Button
                    variant="outlined"
                    onClick={() => navigate('/redteam/setup')}
                  >
                    Create Test Plan
                  </Button>
                </Alert>
              ) : (
                <Grid container spacing={2}>
                  {testPlans.map((plan) => (
                    <Grid item xs={12} sm={6} md={4} key={plan.id}>
                      <Card 
                        sx={{ 
                          height: '100%', 
                          display: 'flex', 
                          flexDirection: 'column',
                          cursor: 'pointer',
                          border: selectedTestPlanId === plan.id ? '3px solid' : '1px solid',
                          borderColor: selectedTestPlanId === plan.id ? 'primary.main' : 'divider',
                          '&:hover': {
                            boxShadow: 4,
                          },
                        }}
                        onClick={() => handleTestPlanSelect(plan.id)}
                      >
                        <CardContent sx={{ flexGrow: 1 }}>
                          <Typography variant="h6" component="h3" sx={{ mb: 2 }}>
                            {plan.name}
                          </Typography>

                          <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
                            <Chip
                              icon={<Security />}
                              label={`${getPluginCount(plan.config)} plugins`}
                              size="small"
                              variant="outlined"
                              color={getPluginCount(plan.config) > 0 ? 'primary' : 'default'}
                            />
                            <Chip
                              label={`${getStrategyCount(plan.config)} strategies`}
                              size="small"
                              variant="outlined"
                              color={getStrategyCount(plan.config) > 0 ? 'secondary' : 'default'}
                            />
                            {getFrameworks(plan.config).map((framework) => (
                              <Chip
                                key={framework}
                                icon={<Shield />}
                                label={framework}
                                size="small"
                                variant="filled"
                                color={framework.includes('OWASP') ? 'warning' : 'info'}
                                sx={{ fontWeight: 'bold' }}
                              />
                            ))}
                          </Box>

                          {plan.config?.description && (
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 1, fontStyle: 'italic' }}>
                              {plan.config.description}
                            </Typography>
                          )}

                          <Typography variant="caption" color="text.secondary">
                            Updated: {new Date(plan.updatedAt).toLocaleDateString()}
                          </Typography>
                        </CardContent>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              )}
              
              {selectedTestPlanId && (
                <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
                  <Button variant="contained" onClick={handleNext}>
                    Continue with Selected Plan
                  </Button>
                </Box>
              )}
            </Box>
          </ErrorBoundary>
        );
      case 1:
        return (
          <ErrorBoundary name="Quick Scan Targets">
            <Targets 
              onNext={handleNext} 
              onBack={handleBack}
              setupModalOpen={false}
            />
          </ErrorBoundary>
        );
      case 2:
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
            Select a test plan, configure your target, and run a security assessment.
          </Typography>
        </Box>

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
        {activeStep === 2 && (
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