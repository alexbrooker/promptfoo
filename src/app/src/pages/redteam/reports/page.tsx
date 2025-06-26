import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
  Refresh as RefreshIcon,
  Assessment as AssessmentIcon,
} from '@mui/icons-material';
import { callAuthenticatedApi } from '../../../utils/api';

interface RedteamReport {
  createdAt: number;
  datasetId: string;
  description: string | null;
  evalId: string;
  isRedteam: number;
  label: string;
  numTests: number;
  passRate: number;
}

export default function RedteamReportsPage() {
  const navigate = useNavigate();
  const [reports, setReports] = useState<RedteamReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    document.title = 'Red Team Reports | promptfoo';
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await callAuthenticatedApi('/redteam/results', { cache: 'no-store' });
      if (!response.ok) {
        throw new Error('Failed to fetch reports');
      }
      
      const body = await response.json();
      const redteamReports = body.results.filter((report: RedteamReport) => report.isRedteam);
      
      // Sort by most recent first
      const sortedReports = redteamReports.sort(
        (a: RedteamReport, b: RedteamReport) => b.createdAt - a.createdAt
      );
      
      setReports(sortedReports);
    } catch (err) {
      console.error('Error fetching reports:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch reports');
    } finally {
      setLoading(false);
    }
  };

  const handleViewReport = (evalId: string) => {
    navigate(`/report?evalId=${evalId}`);
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getPassRateColor = (passRate: number) => {
    if (passRate >= 80) return 'success';
    if (passRate >= 60) return 'warning';
    return 'error';
  };

  const getTestCountColor = (numTests: number) => {
    if (numTests >= 100) return 'primary';
    if (numTests >= 50) return 'secondary';
    return 'default';
  };

  const truncateId = (id: string) => {
    if (id.length <= 15) return id;
    return `${id.slice(0, 5)}...${id.slice(-5)}`;
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
            Red Team Security Reports
          </Typography>
          <Stack direction="row" spacing={2}>
            <Tooltip title="Refresh reports">
              <IconButton onClick={fetchReports} disabled={loading}>
                <RefreshIcon />
              </IconButton>
            </Tooltip>
          </Stack>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {reports.length === 0 && !error ? (
          <Paper sx={{ p: 6, textAlign: 'center' }}>
            <AssessmentIcon sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" color="text.secondary" gutterBottom>
              No Red Team Reports Found
            </Typography>
            <Typography variant="body1" color="text.secondary" mb={3}>
              Run a red team security evaluation to generate your first report.
            </Typography>
            <Button
              variant="contained"
              size="large"
              onClick={() => navigate('/redteam/setup')}
            >
              Start Security Test
            </Button>
          </Paper>
        ) : (
          <>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              {reports.length} report{reports.length !== 1 ? 's' : ''} found
            </Typography>
            
            <Grid container spacing={3}>
              {reports.map((report) => (
                <Grid item xs={12} md={6} lg={4} key={report.evalId}>
                  <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                    <CardContent sx={{ flexGrow: 1 }}>
                      <Typography variant="h6" component="h2" gutterBottom>
                        {report.description || 'Security Assessment Report'}
                      </Typography>
                      
                      <Box sx={{ mb: 2 }}>
                        <Chip
                          label={report.label || 'Red Team'}
                          color="secondary"
                          size="small"
                          variant="filled"
                        />
                      </Box>
                      
                      <Typography variant="body2" color="text.secondary" gutterBottom sx={{ fontFamily: 'monospace' }}>
                        ID: {truncateId(report.evalId)}
                      </Typography>

                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        Created: {formatDate(report.createdAt)}
                      </Typography>

                      <Box sx={{ display: 'flex', gap: 1, mt: 2, mb: 2, flexWrap: 'wrap' }}>
                        <Chip
                          label={`${report.passRate.toFixed(1)}% Pass Rate`}
                          color={getPassRateColor(report.passRate)}
                          variant="filled"
                          size="small"
                          sx={{ fontWeight: 'bold' }}
                        />
                        <Chip
                          label={`${report.numTests.toLocaleString()} Tests`}
                          color={getTestCountColor(report.numTests)}
                          variant="outlined"
                          size="small"
                        />
                      </Box>

                      {report.datasetId && (
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                          Dataset: {truncateId(report.datasetId)}
                        </Typography>
                      )}
                    </CardContent>

                    <CardActions sx={{ justifyContent: 'space-between', px: 2, pb: 2 }}>
                      <Button
                        variant="contained"
                        startIcon={<VisibilityIcon />}
                        onClick={() => handleViewReport(report.evalId)}
                        fullWidth
                      >
                        View Report
                      </Button>
                    </CardActions>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </>
        )}
      </Box>
    </Container>
  );
}