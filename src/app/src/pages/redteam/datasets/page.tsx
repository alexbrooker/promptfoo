import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  CardActions,
  Button,
  Chip,
  Grid,
  Paper,
  CircularProgress,
  Alert,
  Container,
  Stack,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  Visibility as VisibilityIcon,
  PlayArrow as PlayArrowIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useUserStore } from '../../../stores/userStore';
import { callAuthenticatedApi } from '../../../utils/api';

interface Dataset {
  dataset_id: string;
  test_count: number;
  created_at: string;
  plugins: string[];
  strategies: string[];
  purpose?: string;
}

export default function DatasetsPage() {
  const navigate = useNavigate();
  const { user } = useUserStore();
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDatasets = async () => {
    if (!user) return;

    try {
      setLoading(true);
      setError(null);
      
      const response = await callAuthenticatedApi('/redteam/datasets');
      const data = await response.json();
      
      setDatasets(data.datasets || []);
    } catch (err) {
      console.error('Error fetching datasets:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch datasets');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDatasets();
  }, [user]);

  const handleViewDataset = (datasetId: string) => {
    navigate(`/redteam/datasets/${datasetId}`);
  };

  const handleExecuteDataset = (datasetId: string) => {
    navigate(`/redteam/datasets/${datasetId}?execute=true`);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatPluginName = (plugin: string) => {
    return plugin.replace(/^redteam:/, '').replace(/-/g, ' ');
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

  return (
    <Container maxWidth="lg">
      <Box py={4}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
          <Typography variant="h4" component="h1">
            My Test Datasets
          </Typography>
          <Stack direction="row" spacing={2}>
            <Tooltip title="Refresh datasets">
              <IconButton onClick={fetchDatasets} disabled={loading}>
                <RefreshIcon />
              </IconButton>
            </Tooltip>
            <Button
              variant="contained"
              onClick={() => navigate('/redteam/setup')}
            >
              Generate New Dataset
            </Button>
          </Stack>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {datasets.length === 0 && !error ? (
          <Paper sx={{ p: 6, textAlign: 'center' }}>
            <Typography variant="h6" color="text.secondary" gutterBottom>
              No test datasets found
            </Typography>
            <Typography variant="body1" color="text.secondary" mb={3}>
              Generate your first test dataset to get started with AI security testing.
            </Typography>
            <Button
              variant="contained"
              size="large"
              onClick={() => navigate('/redteam/setup')}
            >
              Generate Test Dataset
            </Button>
          </Paper>
        ) : (
          <Grid container spacing={3}>
            {datasets.map((dataset) => (
              <Grid item xs={12} md={6} lg={4} key={dataset.dataset_id}>
                <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                  <CardContent sx={{ flexGrow: 1 }}>
                    <Typography variant="h6" component="h2" gutterBottom>
                      Test Dataset
                    </Typography>
                    
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Created: {formatDate(dataset.created_at)}
                    </Typography>

                    <Typography variant="body1" sx={{ mb: 2 }}>
                      <strong>{dataset.test_count}</strong> test cases
                    </Typography>

                    {dataset.purpose && (
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        Purpose: {dataset.purpose}
                      </Typography>
                    )}

                    <Box sx={{ mb: 2 }}>
                      <Typography variant="subtitle2" gutterBottom>
                        Plugins:
                      </Typography>
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                        {dataset.plugins.slice(0, 3).map((plugin) => (
                          <Chip
                            key={plugin}
                            label={formatPluginName(plugin)}
                            size="small"
                            variant="outlined"
                          />
                        ))}
                        {dataset.plugins.length > 3 && (
                          <Chip
                            label={`+${dataset.plugins.length - 3} more`}
                            size="small"
                            variant="outlined"
                            color="primary"
                          />
                        )}
                      </Box>
                    </Box>

                    {dataset.strategies.length > 0 && (
                      <Box>
                        <Typography variant="subtitle2" gutterBottom>
                          Strategies:
                        </Typography>
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                          {dataset.strategies.slice(0, 2).map((strategy) => (
                            <Chip
                              key={strategy}
                              label={strategy}
                              size="small"
                              color="secondary"
                              variant="outlined"
                            />
                          ))}
                          {dataset.strategies.length > 2 && (
                            <Chip
                              label={`+${dataset.strategies.length - 2} more`}
                              size="small"
                              color="secondary"
                              variant="outlined"
                            />
                          )}
                        </Box>
                      </Box>
                    )}
                  </CardContent>

                  <CardActions sx={{ justifyContent: 'space-between', px: 2, pb: 2 }}>
                    <Button
                      startIcon={<VisibilityIcon />}
                      onClick={() => handleViewDataset(dataset.dataset_id)}
                    >
                      View
                    </Button>
                    <Button
                      variant="contained"
                      startIcon={<PlayArrowIcon />}
                      onClick={() => handleExecuteDataset(dataset.dataset_id)}
                    >
                      Execute
                    </Button>
                  </CardActions>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}
      </Box>
    </Container>
  );
}