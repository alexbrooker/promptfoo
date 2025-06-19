import React, { useCallback, useMemo, useState, useEffect } from 'react';
import { useEmailVerification } from '@app/hooks/useEmailVerification';
import { useTelemetry } from '@app/hooks/useTelemetry';
import { useToast } from '@app/hooks/useToast';
import { callAuthenticatedApi } from '@app/utils/api';
import { QUICK_SCAN_RUN_SETTINGS } from '@app/utils/quickScanCustomizer';
import AssessmentIcon from '@mui/icons-material/Assessment';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import SearchIcon from '@mui/icons-material/Search';
import StopIcon from '@mui/icons-material/Stop';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import Dialog from '@mui/material/Dialog';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import Divider from '@mui/material/Divider';
import Grid from '@mui/material/Grid';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import { useTheme } from '@mui/material/styles';
import { strategyDisplayNames } from '@promptfoo/redteam/constants';
import { getUnifiedConfig } from '@promptfoo/redteam/sharedFrontend';
import type { RedteamPlugin } from '@promptfoo/redteam/types';
import type { Job } from '@promptfoo/types';
import { useRedTeamConfig } from '../../setup/hooks/useRedTeamConfig';
import { EmailVerificationDialog } from '../../setup/components/EmailVerificationDialog';
import { LogViewer } from '../../setup/components/LogViewer';

interface JobStatusResponse {
  hasRunningJob: boolean;
  jobId?: string;
}

export default function QuickScanReview() {
  const { config } = useRedTeamConfig();
  const theme = useTheme();
  const { recordEvent } = useTelemetry();

  const [isRunning, setIsRunning] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);
  const [evalId, setEvalId] = useState<string | null>(null);
  const [currentJobId, setCurrentJobId] = useState<string | null>(null);
  const { showToast } = useToast();
  const [isJobStatusDialogOpen, setIsJobStatusDialogOpen] = useState(false);
  const [pollInterval, setPollInterval] = useState<NodeJS.Timeout | null>(null);
  const [isEmailDialogOpen, setIsEmailDialogOpen] = useState(false);
  const [emailVerificationMessage, setEmailVerificationMessage] = useState('');
  const [emailVerificationError, setEmailVerificationError] = useState<string | null>(null);
  const { checkEmailStatus } = useEmailVerification();

  useEffect(() => {
    recordEvent('webui_page_view', { page: 'quick_scan_review' });
    
    // Check for existing running jobs on page load
    const checkForExistingJobs = async () => {
      try {
        const response = await callAuthenticatedApi('/redteam/jobs');
        const { jobs } = await response.json();
        
        // Find any in-progress or queued job
        const activeJob = jobs.find((job: any) => 
          job.status === 'in-progress' || job.status === 'queued'
        );
        
        if (activeJob) {
          setCurrentJobId(activeJob.id);
          setIsRunning(true);
          setLogs(activeJob.logs || []);
          
          // Start polling for this job
          const interval = setInterval(async () => {
            try {
              const statusResponse = await callAuthenticatedApi(`/redteam/status/${activeJob.id}`);
              const status = await statusResponse.json();

              if (status.logs) {
                setLogs(status.logs);
              }

              if (status.status === 'complete' || status.status === 'error') {
                clearInterval(interval);
                setPollInterval(null);
                setIsRunning(false);
                setCurrentJobId(null);

                if (status.status === 'complete' && status.result && status.evalId) {
                  setEvalId(status.evalId);
                  showToast('Quick scan completed successfully!', 'success');
                } else if (status.status === 'complete') {
                  console.warn('No evaluation result was generated');
                  showToast(
                    'The evaluation completed but no results were generated. Please check the logs for details.',
                    'warning',
                  );
                } else {
                  showToast('Quick scan failed. Please check the logs for details.', 'error');
                }
              }
            } catch (error) {
              console.error('Error polling job status:', error);
              clearInterval(interval);
              setPollInterval(null);
              setIsRunning(false);
              setCurrentJobId(null);
            }
          }, 2000);
          
          setPollInterval(interval);
          showToast(`Resumed monitoring job: ${activeJob.status}`, 'info');
        }
      } catch (error) {
        console.error('Error checking for existing jobs:', error);
      }
    };
    
    checkForExistingJobs();
  }, [recordEvent]);

  const getPluginSummary = useCallback((plugin: string | RedteamPlugin) => {
    if (typeof plugin === 'string') {
      return { label: plugin, count: 1 };
    }
    return { label: plugin.id, count: 1 };
  }, []);

  const pluginSummary = useMemo(() => {
    const summary = new Map<string, number>();
    config.plugins.forEach((plugin) => {
      const { label, count } = getPluginSummary(plugin);
      summary.set(label, (summary.get(label) || 0) + count);
    });
    return Array.from(summary.entries()).sort((a, b) => b[1] - a[1]);
  }, [config.plugins, getPluginSummary]);

  const getStrategyId = (strategy: string | { id: string }): string => {
    return typeof strategy === 'string' ? strategy : strategy.id;
  };

  const strategySummary = useMemo(() => {
    const summary = new Map<string, number>();
    config.strategies.forEach((strategy) => {
      const id = getStrategyId(strategy);
      const label = strategyDisplayNames[id as keyof typeof strategyDisplayNames] || id;
      summary.set(label, (summary.get(label) || 0) + 1);
    });
    return Array.from(summary.entries()).sort((a, b) => b[1] - a[1]);
  }, [config.strategies]);

  const checkForRunningJob = async (): Promise<JobStatusResponse> => {
    try {
      const response = await callAuthenticatedApi('/redteam/queue/status');
      const data = await response.json();
      return {
        hasRunningJob: data.isProcessing || data.queueLength > 0,
        jobId: data.currentJobId
      };
    } catch (error) {
      console.error('Error checking job status:', error);
      return { hasRunningJob: false };
    }
  };

  const handleRunQuickScan = async () => {
    // Check email verification first
    const emailResult = await checkEmailStatus();

    if (!emailResult.canProceed) {
      if (emailResult.needsEmail) {
        setEmailVerificationMessage(
          emailResult.status?.message ||
            'Quick scan requires email verification. Please enter your work email:',
        );
        setIsEmailDialogOpen(true);
        return;
      } else if (emailResult.error) {
        setEmailVerificationError(emailResult.error);
        showToast(emailResult.error, 'error');
        return;
      }
    }

    // Show usage warning if present
    if (emailResult.status?.status === 'show_usage_warning' && emailResult.status.message) {
      showToast(emailResult.status.message, 'warning');
    }

    const { hasRunningJob } = await checkForRunningJob();

    if (hasRunningJob) {
      setIsJobStatusDialogOpen(true);
      return;
    }

    if (pollInterval) {
      clearInterval(pollInterval);
      setPollInterval(null);
    }

    recordEvent('feature_used', {
      feature: 'quick_scan_run',
      numPlugins: config.plugins.length,
      numStrategies: config.strategies.length,
      targetType: config.target.id,
    });

    setIsRunning(true);
    setLogs([]);
    setEvalId(null);

    try {
      const response = await callAuthenticatedApi('/redteam/run', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          config: getUnifiedConfig(config),
          force: QUICK_SCAN_RUN_SETTINGS.force,
          verbose: QUICK_SCAN_RUN_SETTINGS.debugMode,
          maxConcurrency: QUICK_SCAN_RUN_SETTINGS.maxConcurrency,
          delayMs: QUICK_SCAN_RUN_SETTINGS.delayMs,
        }),
      });

      const { id } = await response.json();
      setCurrentJobId(id);

      const interval = setInterval(async () => {
        const statusResponse = await callAuthenticatedApi(`/redteam/status/${id}`);
        const status = (await statusResponse.json()) as Job;

        if (status.logs) {
          setLogs(status.logs);
        }

        if (status.status === 'complete' || status.status === 'error') {
          clearInterval(interval);
          setPollInterval(null);
          setIsRunning(false);
          setCurrentJobId(null);

          if (status.status === 'complete' && status.result && status.evalId) {
            setEvalId(status.evalId);
            showToast('Quick scan completed successfully!', 'success');
          } else if (status.status === 'complete') {
            console.warn('No evaluation result was generated');
            showToast(
              'The quick scan completed but no results were generated. Please check the logs for details.',
              'warning',
            );
          } else {
            showToast(
              'An error occurred during the quick scan. Please check the logs for details.',
              'error',
            );
          }
        }
      }, 1000);

      setPollInterval(interval);
    } catch (error) {
      console.error('Error running quick scan:', error);
      setIsRunning(false);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      showToast(
        `An error occurred while starting the quick scan: ${errorMessage}. Please try again.`,
        'error',
      );
    }
  };

  const handleCancel = async () => {
    if (!currentJobId) {
      showToast('No job to cancel', 'warning');
      return;
    }

    try {
      await callAuthenticatedApi(`/redteam/cancel/${currentJobId}`, {
        method: 'POST',
      });

      if (pollInterval) {
        clearInterval(pollInterval);
        setPollInterval(null);
      }

      setIsRunning(false);
      setCurrentJobId(null);
      showToast('Cancel request submitted', 'success');
    } catch (error) {
      console.error('Error cancelling job:', error);
      showToast('Failed to cancel job', 'error');
    }
  };

  const handleCancelExistingAndRun = async () => {
    try {
      await handleCancel();
      setIsJobStatusDialogOpen(false);
      setTimeout(() => {
        handleRunQuickScan();
      }, 500);
    } catch (error) {
      console.error('Error canceling existing job:', error);
      showToast('Failed to cancel existing job', 'error');
    }
  };

  useEffect(() => {
    return () => {
      if (pollInterval) {
        clearInterval(pollInterval);
      }
    };
  }, [pollInterval]);

  return (
    <Box maxWidth="lg" mx="auto">
      <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold', mb: 4 }}>
        Quick Scan Configuration
      </Typography>

      <Typography variant="h5" gutterBottom sx={{ mb: 3 }}>
        Security Tests to Run
      </Typography>

      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={6}>
          <Paper elevation={2} sx={{ p: 3, height: '100%' }}>
            <Typography variant="h6" gutterBottom>
              Security Plugins ({pluginSummary.length})
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {pluginSummary.map(([label, count]) => (
                <Chip
                  key={label}
                  label={count > 1 ? `${label} (${count})` : label}
                  size="small"
                  color="primary"
                  variant="outlined"
                />
              ))}
            </Box>
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper elevation={2} sx={{ p: 3, height: '100%' }}>
            <Typography variant="h6" gutterBottom>
              Attack Strategies ({strategySummary.length})
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {strategySummary.map(([label, count]) => (
                <Chip
                  key={label}
                  label={count > 1 ? `${label} (${count})` : label}
                  size="small"
                  color="secondary"
                  variant="outlined"
                />
              ))}
            </Box>
          </Paper>
        </Grid>
      </Grid>

      <Paper elevation={2} sx={{ p: 3, mb: 4 }}>
        <Typography variant="h6" gutterBottom>
          Quick Scan Settings
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={6} sm={3}>
            <Typography variant="body2" color="text.secondary">Tests per plugin</Typography>
            <Typography variant="h6">{QUICK_SCAN_RUN_SETTINGS.numTests}</Typography>
          </Grid>
          <Grid item xs={6} sm={3}>
            <Typography variant="body2" color="text.secondary">Delay (ms)</Typography>
            <Typography variant="h6">{QUICK_SCAN_RUN_SETTINGS.delayMs}</Typography>
          </Grid>
          <Grid item xs={6} sm={3}>
            <Typography variant="body2" color="text.secondary">Concurrency</Typography>
            <Typography variant="h6">{QUICK_SCAN_RUN_SETTINGS.maxConcurrency}</Typography>
          </Grid>
          <Grid item xs={6} sm={3}>
            <Typography variant="body2" color="text.secondary">Total Tests</Typography>
            <Typography variant="h6" color="primary">
              ~{pluginSummary.length * QUICK_SCAN_RUN_SETTINGS.numTests}
            </Typography>
          </Grid>
        </Grid>
      </Paper>

      <Divider sx={{ my: 4 }} />

      <Paper elevation={1} sx={{ p: 3 }}>
        <Typography variant="h5" gutterBottom>
          Run Quick Security Scan
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Optimized for speed with pre-configured security tests based on your profile
        </Typography>
        
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          <Button
            variant="contained"
            size="large"
            onClick={handleRunQuickScan}
            disabled={isRunning}
            startIcon={
              isRunning ? <CircularProgress size={20} color="inherit" /> : <PlayArrowIcon />
            }
            sx={{ px: 4, py: 1.5 }}
          >
            {isRunning ? 'Running Quick Scan...' : 'Start Quick Scan'}
          </Button>
          {isRunning && (
            <Button
              variant="outlined"
              color="error"
              onClick={handleCancel}
              startIcon={<StopIcon />}
            >
              Cancel
            </Button>
          )}
          {evalId && (
            <>
              <Button
                variant="contained"
                color="success"
                href={`/report?evalId=${evalId}`}
                startIcon={<AssessmentIcon />}
              >
                View Report
              </Button>
              <Button
                variant="outlined"
                color="success"
                href={`/eval?evalId=${evalId}`}
                startIcon={<SearchIcon />}
              >
                View Details
              </Button>
            </>
          )}
        </Box>
        
        {logs.length > 0 && <LogViewer logs={logs} />}
      </Paper>

      <Dialog open={isJobStatusDialogOpen} onClose={() => setIsJobStatusDialogOpen(false)}>
        <DialogTitle>Job Already Running</DialogTitle>
        <DialogContent>
          <Typography variant="body1" paragraph>
            There is already a red team evaluation running. Would you like to cancel it and start a
            new quick scan?
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end', mt: 2 }}>
            <Button variant="outlined" onClick={() => setIsJobStatusDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="contained" color="primary" onClick={handleCancelExistingAndRun}>
              Cancel Existing & Run Quick Scan
            </Button>
          </Box>
        </DialogContent>
      </Dialog>

      {emailVerificationError && (
        <Alert severity="error" sx={{ mt: 2 }}>
          {emailVerificationError}
        </Alert>
      )}

      <EmailVerificationDialog
        open={isEmailDialogOpen}
        onClose={() => setIsEmailDialogOpen(false)}
        onSuccess={() => {
          setIsEmailDialogOpen(false);
          handleRunQuickScan();
        }}
        message={emailVerificationMessage}
      />
    </Box>
  );
}