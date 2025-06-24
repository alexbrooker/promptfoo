import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
  CardActions,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Chip,
  Paper,
  CircularProgress,
  Alert,
} from '@mui/material';
import {
  Security,
  Speed,
  Business,
  CheckCircle,
  PlayArrow,
  Shield,
  Verified,
  TrendingUp,
  Add,
} from '@mui/icons-material';
import { useUserStore } from '@app/stores/userStore';
import { callAuthenticatedApi } from '@app/utils/api';
import { useToast } from '@app/hooks/useToast';
import { 
  OWASP_LLM_TOP_10_MAPPING, 
  MITRE_ATLAS_MAPPING, 
  EU_AI_ACT_MAPPING,
  NIST_AI_RMF_MAPPING,
  FRAMEWORK_NAMES 
} from '../../../../redteam/constants/frameworks';

interface TestPlan {
  id: string;
  name: string;
  type: string;
  config: any;
  createdAt: string;
  updatedAt: string;
}

export default function LandingPage() {
  const navigate = useNavigate();
  const { user, onboardingData } = useUserStore();
  const toast = useToast();
  const [testPlans, setTestPlans] = useState<TestPlan[]>([]);
  const [loadingPlans, setLoadingPlans] = useState(false);

  useEffect(() => {
    if (user) {
      loadUserTestPlans();
    }
  }, [user]);

  const loadUserTestPlans = async () => {
    setLoadingPlans(true);
    try {
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
    } catch (error) {
      console.error('Failed to load test plans:', error);
    } finally {
      setLoadingPlans(false);
    }
  };

  const handleRunTestPlan = (planId: string) => {
    navigate(`/redteam/quick-scan?config=${planId}`);
  };

  const getFrameworks = (config: any) => {
    const frameworks = new Set<string>();
    const plugins = config?.plugins || [];
    const strategies = config?.strategies || [];
    
    // Check against all framework mappings
    const allMappings = {
      ...OWASP_LLM_TOP_10_MAPPING,
      ...MITRE_ATLAS_MAPPING,
      ...EU_AI_ACT_MAPPING,
      ...NIST_AI_RMF_MAPPING,
    };

    Object.entries(allMappings).forEach(([frameworkKey, mapping]) => {
      const hasMatchingPlugin = plugins.some((p: any) => {
        const pluginId = typeof p === 'string' ? p : p.id;
        return mapping.plugins.includes(pluginId);
      });
      
      const hasMatchingStrategy = strategies.some((s: string) => 
        mapping.strategies.includes(s)
      );

      if (hasMatchingPlugin || hasMatchingStrategy) {
        // Map framework key to display name
        if (frameworkKey.startsWith('owasp:llm')) {
          frameworks.add(FRAMEWORK_NAMES['owasp:llm']);
        } else if (frameworkKey.startsWith('mitre:atlas')) {
          frameworks.add(FRAMEWORK_NAMES['mitre:atlas']);
        } else if (frameworkKey.startsWith('eu:ai-act')) {
          frameworks.add(FRAMEWORK_NAMES['eu:ai-act']);
        } else if (frameworkKey.startsWith('nist:ai')) {
          frameworks.add(FRAMEWORK_NAMES['nist:ai:measure']);
        } else if (frameworkKey.startsWith('owasp:api')) {
          frameworks.add(FRAMEWORK_NAMES['owasp:api']);
        }
      }
    });
    
    return Array.from(frameworks);
  };

  const getPluginCount = (config: any) => {
    if (!config?.plugins) return 0;
    return Array.isArray(config.plugins) ? config.plugins.length : 0;
  };

  const getStrategyCount = (config: any) => {
    if (!config?.strategies) return 0;
    return Array.isArray(config.strategies) ? config.strategies.length : 0;
  };

  const features = [
    {
      icon: Shield,
      title: 'Comprehensive Red Teaming',
      description: 'Automated testing against OWASP LLM Top 10, MITRE ATLAS, and other security frameworks',
    },
    {
      icon: Verified,
      title: 'Detailed Vulnerability Reports',
      description: 'Professional security reports with findings, risk ratings, and remediation guidance',
    },
    {
      icon: TrendingUp,
      title: 'Compliance Documentation',
      description: 'Generate compliance reports for NIST AI RMF, EU AI Act, and industry standards',
    },
  ];


  return (
    <Box>
      {/* Hero Section */}
      <Container maxWidth="lg" sx={{ py: 8 }}>
        <Box textAlign="center" sx={{ mb: 6 }}>
          <Typography variant="h2" component="h1" gutterBottom sx={{ fontWeight: 'bold' }}>
            AI Red Teaming & Security Testing Platform
          </Typography>
          <Typography variant="h5" color="text.secondary" sx={{ mb: 4, maxWidth: '800px', mx: 'auto' }}>
            Professional red teaming platform for GenAI and LLM systems. Generate comprehensive 
            vulnerability assessments and compliance reports to help your team secure AI applications.
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ maxWidth: '600px', mx: 'auto' }}>
            Run security tests against OWASP LLM Top 10, MITRE ATLAS, NIST AI RMF, and EU AI Act frameworks. 
            Get detailed reports with findings and recommendations for your security team.
          </Typography>
        </Box>

        {/* User's Test Plans Section - Only show if authenticated */}
        {user && (
          <Box sx={{ mb: 8 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
              <Box>
                <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold' }}>
                  Your Security Test Plans
                </Typography>
                <Typography variant="body1" color="text.secondary">
                  Ready-to-run security assessments tailored for your AI systems
                </Typography>
              </Box>
              <Button
                variant="outlined"
                startIcon={<Add />}
                onClick={() => navigate('/redteam/setup')}
                size="large"
              >
                Create New Plan
              </Button>
            </Box>

            {loadingPlans ? (
              <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
                <CircularProgress />
              </Box>
            ) : testPlans.length === 0 ? (
              <Alert severity="info" sx={{ mb: 4 }}>
                <Typography variant="h6" gutterBottom>
                  No test plans found
                </Typography>
                <Typography variant="body2" sx={{ mb: 2 }}>
                  Create your first security test plan to get comprehensive AI security assessments.
                </Typography>
                <Button
                  variant="outlined"
                  startIcon={<Add />}
                  onClick={() => navigate('/redteam/setup')}
                >
                  Create Your First Test Plan
                </Button>
              </Alert>
            ) : (
              <Grid container spacing={3}>
                {testPlans.slice(0, 3).map((plan) => (
                  <Grid item xs={12} sm={6} md={4} key={plan.id}>
                    <Card 
                      sx={{ 
                        height: '100%', 
                        display: 'flex', 
                        flexDirection: 'column',
                        cursor: 'pointer',
                        transition: 'transform 0.2s, box-shadow 0.2s',
                        '&:hover': {
                          transform: 'translateY(-4px)',
                          boxShadow: 6,
                        },
                      }}
                      onClick={() => handleRunTestPlan(plan.id)}
                    >
                      <CardContent sx={{ flexGrow: 1 }}>
                        <Typography variant="h6" component="h3" gutterBottom sx={{ fontWeight: 'bold' }}>
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
                        </Box>

                        <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
                          {getFrameworks(plan.config).map((framework) => (
                            <Chip
                              key={framework}
                              icon={<Shield />}
                              label={framework}
                              size="small"
                              variant="filled"
                              color={
                                framework.includes('OWASP LLM') ? 'warning' : 
                                framework.includes('MITRE') ? 'info' :
                                framework.includes('EU AI') ? 'success' : 'secondary'
                              }
                              sx={{ fontWeight: 'bold', fontSize: '0.75rem' }}
                            />
                          ))}
                        </Box>

                        <Typography variant="caption" color="text.secondary">
                          Updated: {new Date(plan.updatedAt).toLocaleDateString()}
                        </Typography>
                      </CardContent>

                      <CardActions sx={{ px: 2, pb: 2 }}>
                        <Button
                          variant="contained"
                          startIcon={<PlayArrow />}
                          fullWidth
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRunTestPlan(plan.id);
                          }}
                          sx={{
                            background: 'linear-gradient(45deg, #1976d2 30%, #42a5f5 90%)',
                            '&:hover': {
                              background: 'linear-gradient(45deg, #1565c0 30%, #1e88e5 90%)',
                            },
                          }}
                        >
                          Run Security Test
                        </Button>
                      </CardActions>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            )}

            {testPlans.length > 3 && (
              <Box sx={{ textAlign: 'center', mt: 3 }}>
                <Button
                  variant="outlined"
                  onClick={() => navigate('/test-plans')}
                  size="large"
                >
                  View All Test Plans ({testPlans.length})
                </Button>
              </Box>
            )}
          </Box>
        )}

        {/* Features Grid */}
        <Grid container spacing={4} sx={{ mb: 8 }}>
          {features.map((feature, index) => {
            const IconComponent = feature.icon;
            return (
              <Grid item xs={12} md={4} key={index}>
                <Card sx={{ height: '100%', textAlign: 'center' }}>
                  <CardContent sx={{ p: 3 }}>
                    <IconComponent color="primary" sx={{ fontSize: 48, mb: 2 }} />
                    <Typography variant="h6" gutterBottom>
                      {feature.title}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {feature.description}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            );
          })}
        </Grid>
      </Container>
    </Box>
  );
}