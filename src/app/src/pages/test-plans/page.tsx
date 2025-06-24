import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@app/hooks/useToast';
import { callAuthenticatedApi } from '@app/utils/api';
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  CardActions,
  Button,
  Grid,
  Chip,
  IconButton,
  Menu,
  MenuItem,
  Alert,
  CircularProgress,
  Collapse,
  Tooltip,
  Badge,
} from '@mui/material';
import {
  PlayArrow,
  Edit,
  Delete,
  MoreVert,
  Security,
  Add,
  Download,
  ExpandMore,
  ExpandLess,
  Policy,
  Shield,
} from '@mui/icons-material';
import { generateOrderedYaml } from '../redteam/setup/utils/yamlHelpers';

interface TestPlan {
  id: string;
  name: string;
  type: string;
  config: any;
  createdAt: string;
  updatedAt: string;
}

export default function TestPlansPage() {
  const [testPlans, setTestPlans] = useState<TestPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [menuAnchor, setMenuAnchor] = useState<{ element: HTMLElement; planId: string } | null>(null);
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set());
  const navigate = useNavigate();
  const toast = useToast();

  useEffect(() => {
    loadTestPlans();
  }, []);

  const loadTestPlans = async () => {
    setLoading(true);
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
      toast.showToast(
        error instanceof Error ? error.message : 'Failed to load test plans',
        'error'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleRunTestPlan = (planId: string) => {
    // Navigate to quick-scan page and load this config
    navigate(`/redteam/quick-scan?config=${planId}`);
  };

  const handleEditTestPlan = (planId: string) => {
    // Navigate to setup page and load this config for editing
    navigate(`/redteam/setup?config=${planId}`);
  };

  const handleDeleteTestPlan = async (planId: string) => {
    try {
      const response = await callAuthenticatedApi(`/configs/redteam/${planId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete test plan');
      }

      toast.showToast('Test plan deleted successfully', 'success');
      setTestPlans(testPlans.filter(plan => plan.id !== planId));
    } catch (error) {
      console.error('Failed to delete test plan:', error);
      toast.showToast(
        error instanceof Error ? error.message : 'Failed to delete test plan',
        'error'
      );
    }
    setMenuAnchor(null);
  };

  const handleDownloadYaml = (plan: TestPlan) => {
    try {
      const yamlContent = generateOrderedYaml(plan.config);
      const blob = new Blob([yamlContent], { type: 'text/yaml' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${plan.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.yaml`;
      link.click();
      URL.revokeObjectURL(url);
      toast.showToast('Test plan exported successfully', 'success');
    } catch (error) {
      console.error('Failed to export test plan:', error);
      toast.showToast('Failed to export test plan', 'error');
    }
    setMenuAnchor(null);
  };

  const handleMenuClick = (event: React.MouseEvent<HTMLElement>, planId: string) => {
    event.stopPropagation();
    setMenuAnchor({ element: event.currentTarget, planId });
  };

  const handleMenuClose = () => {
    setMenuAnchor(null);
  };

  const getPluginCount = (config: any) => {
    if (!config?.plugins) return 0;
    return Array.isArray(config.plugins) ? config.plugins.length : 0;
  };

  const getStrategyCount = (config: any) => {
    if (!config?.strategies) return 0;
    return Array.isArray(config.strategies) ? config.strategies.length : 0;
  };

  const getTargetType = (config: any) => {
    return config?.target?.id || 'Unknown';
  };

  const getTargetUrl = (config: any) => {
    return config?.target?.config?.url || null;
  };

  const getDescription = (config: any) => {
    return config?.description || '';
  };

  const toggleCardExpansion = (planId: string) => {
    setExpandedCards(prev => {
      const newSet = new Set(prev);
      if (newSet.has(planId)) {
        newSet.delete(planId);
      } else {
        newSet.add(planId);
      }
      return newSet;
    });
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

  const getPluginNames = (config: any) => {
    const plugins = config?.plugins || [];
    return plugins.map((p: any) => {
      if (typeof p === 'string') return p;
      if (typeof p === 'object' && p?.id) return p.id;
      return 'Unknown';
    }).filter(Boolean);
  };

  const getStrategyNames = (config: any) => {
    const strategies = config?.strategies || [];
    return strategies.filter((s: any) => typeof s === 'string' && s.length > 0);
  };

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="h4" component="h1" gutterBottom>
            Test Plans
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Manage your saved security test configurations
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => navigate('/redteam/setup')}
          size="large"
        >
          Create Security Test Plan
        </Button>
      </Box>

      {testPlans.length === 0 ? (
        <Alert severity="info" sx={{ mb: 4 }}>
          <Typography variant="h6" gutterBottom>
            No security test plans found
          </Typography>
          <Typography variant="body2" sx={{ mb: 2 }}>
            Security test plans are professional templates configured for comprehensive AI security assessments. 
            Create your first plan using our pre-built templates covering OWASP LLM Top 10, MITRE ATLAS, and EU AI Act compliance.
          </Typography>
          <Button
            variant="outlined"
            startIcon={<Add />}
            onClick={() => navigate('/redteam/setup')}
          >
            Create Your First Security Test Plan
          </Button>
        </Alert>
      ) : (
        <Grid container spacing={3}>
          {testPlans.map((plan) => (
            <Grid item xs={12} sm={6} md={4} key={plan.id}>
              <Card 
                sx={{ 
                  height: '100%', 
                  display: 'flex', 
                  flexDirection: 'column',
                  cursor: 'pointer',
                  '&:hover': {
                    boxShadow: 4,
                  },
                }}
                onClick={() => handleRunTestPlan(plan.id)}
              >
                <CardContent sx={{ flexGrow: 1 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                    <Typography variant="h6" component="h3" sx={{ flexGrow: 1, mr: 1 }}>
                      {plan.name}
                    </Typography>
                    <IconButton
                      size="small"
                      onClick={(e) => handleMenuClick(e, plan.id)}
                      sx={{ ml: 1 }}
                    >
                      <MoreVert />
                    </IconButton>
                  </Box>

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

                  {getDescription(plan.config) && (
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1, fontStyle: 'italic' }}>
                      {getDescription(plan.config)}
                    </Typography>
                  )}

                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                    Target: {getTargetType(plan.config)}
                  </Typography>

                  {getTargetUrl(plan.config) && (
                    <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
                      URL: {getTargetUrl(plan.config)}
                    </Typography>
                  )}

                  {(getPluginCount(plan.config) > 0 || getStrategyCount(plan.config) > 0) && (
                    <Box sx={{ mt: 1, mb: 1 }}>
                      <Button
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleCardExpansion(plan.id);
                        }}
                        endIcon={expandedCards.has(plan.id) ? <ExpandLess /> : <ExpandMore />}
                        sx={{ p: 0, minWidth: 'auto', fontSize: '0.75rem' }}
                      >
                        {expandedCards.has(plan.id) ? 'Hide' : 'Show'} Details
                      </Button>
                      
                      <Collapse in={expandedCards.has(plan.id)}>
                        <Box sx={{ mt: 1, p: 1, bgcolor: 'grey.50', borderRadius: 1 }}>
                          {getPluginCount(plan.config) > 0 && (
                            <Box sx={{ mb: 1 }}>
                              <Typography variant="caption" sx={{ fontWeight: 'bold', display: 'block' }}>
                                Plugins ({getPluginCount(plan.config)}):
                              </Typography>
                              <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', mt: 0.5 }}>
                                {getPluginNames(plan.config).slice(0, 10).map((plugin, idx) => {
                                  const displayName = String(plugin);
                                  return (
                                    <Tooltip key={`${plan.id}-plugin-${idx}`} title={displayName}>
                                      <Chip
                                        label={displayName.length > 15 ? displayName.slice(0, 15) + '...' : displayName}
                                        size="small"
                                        variant="outlined"
                                        sx={{ fontSize: '0.7rem', height: '20px' }}
                                      />
                                    </Tooltip>
                                  );
                                })}
                                {getPluginNames(plan.config).length > 10 && (
                                  <Chip
                                    label={`+${getPluginNames(plan.config).length - 10} more`}
                                    size="small"
                                    variant="outlined"
                                    sx={{ fontSize: '0.7rem', height: '20px' }}
                                  />
                                )}
                              </Box>
                            </Box>
                          )}
                          
                          {getStrategyCount(plan.config) > 0 && (
                            <Box>
                              <Typography variant="caption" sx={{ fontWeight: 'bold', display: 'block' }}>
                                Strategies ({getStrategyCount(plan.config)}):
                              </Typography>
                              <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', mt: 0.5 }}>
                                {getStrategyNames(plan.config).map((strategy, idx) => {
                                  const displayName = String(strategy);
                                  return (
                                    <Chip
                                      key={`${plan.id}-strategy-${idx}`}
                                      label={displayName}
                                      size="small"
                                      variant="filled"
                                      color="secondary"
                                      sx={{ fontSize: '0.7rem', height: '20px' }}
                                    />
                                  );
                                })}
                              </Box>
                            </Box>
                          )}
                        </Box>
                      </Collapse>
                    </Box>
                  )}

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
                  >
                    Run Test Plan
                  </Button>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      <Menu
        anchorEl={menuAnchor?.element}
        open={Boolean(menuAnchor)}
        onClose={handleMenuClose}
        onClick={(e) => e.stopPropagation()}
      >
        <MenuItem onClick={() => {
          if (menuAnchor) {
            handleEditTestPlan(menuAnchor.planId);
          }
          handleMenuClose();
        }}>
          <Edit sx={{ mr: 1 }} fontSize="small" />
          Edit
        </MenuItem>
        <MenuItem onClick={() => {
          if (menuAnchor) {
            const plan = testPlans.find(p => p.id === menuAnchor.planId);
            if (plan) {
              handleDownloadYaml(plan);
            }
          }
        }}>
          <Download sx={{ mr: 1 }} fontSize="small" />
          Export YAML
        </MenuItem>
        <MenuItem 
          onClick={() => {
            if (menuAnchor) {
              handleDeleteTestPlan(menuAnchor.planId);
            }
          }}
          sx={{ color: 'error.main' }}
        >
          <Delete sx={{ mr: 1 }} fontSize="small" />
          Delete
        </MenuItem>
      </Menu>
    </Container>
  );
}