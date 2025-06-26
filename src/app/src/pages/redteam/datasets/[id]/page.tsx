import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  Chip,
  Paper,
  CircularProgress,
  Alert,
  Container,
  Stack,
  Divider,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  ArrowBack as ArrowBackIcon,
  PlayArrow as PlayArrowIcon,
  Download as DownloadIcon,
} from '@mui/icons-material';
import {
  FormControlLabel,
  Checkbox,
  RadioGroup,
  Radio,
} from '@mui/material';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useUserStore } from '../../../../stores/userStore';
import { callAuthenticatedApi } from '../../../../utils/api';

interface DatasetDetail {
  dataset_id: string;
  tests: any[];
  test_count: number;
  metadata: {
    test_count: number;
    plugins: string[];
    strategies: string[];
    generated_at: number;
    original_config: any;
    purpose?: string;
    entities?: string[];
    injectVar?: string;
  };
  created_at: string;
}

export default function DatasetDetailPage() {
  const navigate = useNavigate();
  const { id: datasetId } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const shouldExecute = searchParams.get('execute') === 'true';
  const { user } = useUserStore();

  const [dataset, setDataset] = useState<DatasetDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [executeDialogOpen, setExecuteDialogOpen] = useState(shouldExecute);
  const [executing, setExecuting] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState('');
  const [useOriginalTarget, setUseOriginalTarget] = useState(true);
  const [targetSource, setTargetSource] = useState<'original' | 'provider'>('original');

  const fetchDataset = async () => {
    if (!user || !datasetId) return;

    try {
      setLoading(true);
      setError(null);

      const response = await callAuthenticatedApi(`/redteam/datasets/${datasetId}`);
      const data = await response.json();
      
      setDataset(data);
    } catch (err) {
      console.error('Error fetching dataset:', err);
      if (err instanceof Error && err.message.includes('404')) {
        setError('Dataset not found or access denied');
      } else {
        setError(err instanceof Error ? err.message : 'Failed to fetch dataset');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleExecute = async () => {
    if (!dataset) return;
    
    // Determine target configuration
    let targetConfig;
    const originalTarget = getTargetConfig();
    if (targetSource === 'original' && originalTarget) {
      targetConfig = {
        target: originalTarget,
        useOriginalTarget: true,
      };
    } else if (targetSource === 'provider' && selectedProvider) {
      targetConfig = {
        providers: [selectedProvider],
        useOriginalTarget: false,
      };
    } else {
      setError('Please select a target configuration');
      return;
    }

    try {
      setExecuting(true);
      const response = await callAuthenticatedApi('/redteam/execute', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          datasetId: dataset.dataset_id,
          ...targetConfig,
        }),
      });

      const data = await response.json();
      setExecuteDialogOpen(false);

      // Navigate to the job status page or results
      navigate(`/redteam/status/${data.jobId}`);
    } catch (err) {
      console.error('Error executing dataset:', err);
      setError(err instanceof Error ? err.message : 'Execution failed');
    } finally {
      setExecuting(false);
    }
  };

  const handleDownload = () => {
    if (!dataset) return;

    const dataStr = JSON.stringify(dataset.tests, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `dataset-${dataset.dataset_id}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  useEffect(() => {
    fetchDataset();
  }, [user, datasetId]);

  // Set default target source based on dataset metadata
  useEffect(() => {
    if (getTargetConfig()) {
      setTargetSource('original');
    } else {
      setTargetSource('provider');
    }
  }, [dataset]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatPluginName = (plugin: string) => {
    return plugin.replace(/^redteam:/, '').replace(/-/g, ' ');
  };

  // Helper to get target configuration (handles both target and targets[0])
  const getTargetConfig = () => {
    return dataset?.metadata?.original_config?.target || dataset?.metadata?.original_config?.targets?.[0];
  };

  if (loading) {
    return (
      <Container maxWidth="lg">
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="50vh">
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  if (error || !dataset) {
    return (
      <Container maxWidth="lg">
        <Box py={4}>
          <Alert severity="error" sx={{ mb: 3 }}>
            {error || 'Dataset not found'}
          </Alert>
          <Button startIcon={<ArrowBackIcon />} onClick={() => navigate('/redteam/datasets')}>
            Back to Datasets
          </Button>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg">
      <Box py={4}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
          <Box display="flex" alignItems="center" gap={2}>
            <IconButton onClick={() => navigate('/redteam/datasets')}>
              <ArrowBackIcon />
            </IconButton>
            <Typography variant="h4" component="h1">
              Test Dataset Details
            </Typography>
          </Box>
          <Stack direction="row" spacing={2}>
            <Tooltip title="Download dataset">
              <Button
                startIcon={<DownloadIcon />}
                onClick={handleDownload}
                variant="outlined"
              >
                Download
              </Button>
            </Tooltip>
            <Button
              variant="contained"
              startIcon={<PlayArrowIcon />}
              onClick={() => setExecuteDialogOpen(true)}
            >
              Execute
            </Button>
          </Stack>
        </Box>

        <Grid container spacing={4}>
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Dataset Overview
                </Typography>
                <Stack spacing={2}>
                  <Box>
                    <Typography variant="subtitle2" color="text.secondary">
                      Test Cases
                    </Typography>
                    <Typography variant="h5" color="primary">
                      {dataset.test_count}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="subtitle2" color="text.secondary">
                      Created
                    </Typography>
                    <Typography variant="body2">
                      {formatDate(dataset.created_at)}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="subtitle2" color="text.secondary">
                      Dataset ID
                    </Typography>
                    <Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>
                      {dataset.dataset_id}
                    </Typography>
                  </Box>
                  {dataset.metadata.purpose && (
                    <Box>
                      <Typography variant="subtitle2" color="text.secondary">
                        System Purpose
                      </Typography>
                      <Typography variant="body2">
                        {dataset.metadata.purpose}
                      </Typography>
                    </Box>
                  )}
                  {dataset.metadata.entities && dataset.metadata.entities.length > 0 && (
                    <Box>
                      <Typography variant="subtitle2" color="text.secondary">
                        Entities
                      </Typography>
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 1 }}>
                        {dataset.metadata.entities.map((entity, index) => (
                          <Chip key={index} label={entity} size="small" />
                        ))}
                      </Box>
                    </Box>
                  )}
                </Stack>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={8}>
            <Stack spacing={3}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Security Plugins
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                    {dataset.metadata.plugins.map((plugin) => (
                      <Chip
                        key={plugin}
                        label={formatPluginName(plugin)}
                        variant="outlined"
                        color="primary"
                      />
                    ))}
                  </Box>
                </CardContent>
              </Card>

              {dataset.metadata.strategies.length > 0 && (
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Attack Strategies
                    </Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                      {dataset.metadata.strategies.map((strategy) => (
                        <Chip
                          key={strategy}
                          label={strategy}
                          variant="outlined"
                          color="secondary"
                        />
                      ))}
                    </Box>
                  </CardContent>
                </Card>
              )}

              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Test Cases Preview
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    Showing first 5 test cases out of {dataset.test_count} total
                  </Typography>
                  
                  {dataset.tests.slice(0, 5).map((test, index) => (
                    <Accordion key={index}>
                      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                        <Typography variant="subtitle2">
                          Test Case {index + 1}: {test.assert?.[0]?.type || 'Security Test'}
                        </Typography>
                      </AccordionSummary>
                      <AccordionDetails>
                        <Paper sx={{ p: 2, backgroundColor: 'grey.50' }}>
                          <Typography variant="body2" component="pre" sx={{ whiteSpace: 'pre-wrap' }}>
                            {typeof test === 'string' ? test : JSON.stringify(test, null, 2)}
                          </Typography>
                        </Paper>
                      </AccordionDetails>
                    </Accordion>
                  ))}
                </CardContent>
              </Card>
            </Stack>
          </Grid>
        </Grid>

        {/* Execute Dialog */}
        <Dialog open={executeDialogOpen} onClose={() => setExecuteDialogOpen(false)} maxWidth="md" fullWidth>
          <DialogTitle>Execute Test Dataset</DialogTitle>
          <DialogContent>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Execute this dataset of {dataset.test_count} test cases against a target configuration.
            </Typography>
            
            <RadioGroup
              value={targetSource}
              onChange={(e) => setTargetSource(e.target.value as 'original' | 'provider')}
              sx={{ mb: 3 }}
            >
              {getTargetConfig() && (
                <FormControlLabel
                  value="original"
                  control={<Radio />}
                  label={
                    <Box>
                      <Typography variant="subtitle2">
                        Use Original Target Configuration
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {getTargetConfig()?.label || getTargetConfig()?.id || 'Custom Target'}
                      </Typography>
                    </Box>
                  }
                />
              )}
              <FormControlLabel
                value="provider"
                control={<Radio />}
                label={
                  <Box>
                    <Typography variant="subtitle2">
                      Choose AI Provider
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Select from available model providers
                    </Typography>
                  </Box>
                }
              />
            </RadioGroup>

            {/* Original Target Details */}
            {targetSource === 'original' && getTargetConfig() && (
              <Paper sx={{ p: 2, mb: 3, backgroundColor: 'grey.50' }}>
                <Typography variant="h6" gutterBottom>
                  Target Configuration
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Target Name
                    </Typography>
                    <Typography variant="body2">
                      {getTargetConfig()?.label || 'Unnamed Target'}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Target Type
                    </Typography>
                    <Typography variant="body2">
                      {getTargetConfig()?.id || 'Unknown'}
                    </Typography>
                  </Grid>
                  {getTargetConfig()?.config?.url && (
                    <Grid item xs={12}>
                      <Typography variant="subtitle2" color="text.secondary">
                        Endpoint URL
                      </Typography>
                      <Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: '0.9rem' }}>
                        {getTargetConfig()?.config?.url}
                      </Typography>
                    </Grid>
                  )}
                  {dataset.metadata.purpose && (
                    <Grid item xs={12}>
                      <Typography variant="subtitle2" color="text.secondary">
                        System Purpose
                      </Typography>
                      <Typography variant="body2">
                        {dataset.metadata.purpose}
                      </Typography>
                    </Grid>
                  )}
                </Grid>
              </Paper>
            )}
            
            {/* Provider Selection */}
            {targetSource === 'provider' && (
              <FormControl fullWidth>
                <InputLabel id="provider-select-label">AI Provider</InputLabel>
                <Select
                  labelId="provider-select-label"
                  value={selectedProvider}
                  label="AI Provider"
                  onChange={(e) => setSelectedProvider(e.target.value)}
                >
                  <MenuItem value="openai:gpt-4">OpenAI GPT-4</MenuItem>
                  <MenuItem value="openai:gpt-3.5-turbo">OpenAI GPT-3.5 Turbo</MenuItem>
                  <MenuItem value="anthropic:claude-3-opus">Anthropic Claude 3 Opus</MenuItem>
                  <MenuItem value="anthropic:claude-3-sonnet">Anthropic Claude 3 Sonnet</MenuItem>
                  <MenuItem value="anthropic:claude-3-haiku">Anthropic Claude 3 Haiku</MenuItem>
                </Select>
              </FormControl>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setExecuteDialogOpen(false)}>Cancel</Button>
            <Button
              onClick={handleExecute}
              variant="contained"
              disabled={(
                (targetSource === 'provider' && !selectedProvider) ||
                (targetSource === 'original' && !getTargetConfig())
              ) || executing}
              startIcon={executing ? <CircularProgress size={20} /> : <PlayArrowIcon />}
            >
              {executing ? 'Starting...' : 'Execute Tests'}
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </Container>
  );
}