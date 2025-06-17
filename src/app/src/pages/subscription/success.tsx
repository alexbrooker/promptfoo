import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useUserStore } from '@app/stores/userStore';
import { CheckCircle, RocketLaunch, Receipt, ArrowForward } from '@mui/icons-material';
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  Button,
  Grid,
  Alert,
  Chip,
} from '@mui/material';

export default function SubscriptionSuccess() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [countdown, setCountdown] = useState(10);
  const [autoRedirect, setAutoRedirect] = useState(true);
  // const { onboardingData } = useUserStore(); // DISABLED FOR DEVELOPMENT

  const isOneTimePayment = searchParams.get('type') === 'one-time';
  const planName = searchParams.get('plan') || 'Quick Check';
  const needsOnboarding = false; // TEMPORARILY DISABLED FOR DEVELOPMENT

  useEffect(() => {
    if (autoRedirect && isOneTimePayment && countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else if (autoRedirect && isOneTimePayment && countdown === 0) {
      // Auto-redirect with template parameter
      const templateTier = planName.toLowerCase().includes('quick') ? 'quick' : 'business';
      
      if (needsOnboarding) {
        navigate(`/onboarding?next=${encodeURIComponent(`/redteam/setup?template=${templateTier}`)}`);
      } else {
        navigate(`/redteam/setup?template=${templateTier}`);
      }
    }
  }, [countdown, autoRedirect, isOneTimePayment, needsOnboarding, navigate]);

  const handleStartScan = () => {
    // Determine template tier based on plan name
    const templateTier = planName.toLowerCase().includes('quick') ? 'quick' : 'business';
    
    // Redirect to onboarding first if not completed, then to scan setup with template
    if (needsOnboarding) {
      navigate(`/onboarding?next=${encodeURIComponent(`/redteam/setup?template=${templateTier}`)}`);
    } else {
      navigate(`/redteam/setup?template=${templateTier}`);
    }
  };

  const handleViewSubscription = () => {
    navigate('/subscription');
  };

  const handleStopAutoRedirect = () => {
    setAutoRedirect(false);
  };

  if (isOneTimePayment) {
    return (
      <Container maxWidth="md" sx={{ py: 6 }}>
        <Card sx={{ textAlign: 'center', p: 4 }}>
          <CardContent>
            <CheckCircle sx={{ fontSize: 80, color: 'success.main', mb: 3 }} />
            
            <Typography variant="h3" component="h1" gutterBottom color="success.main">
              Payment Successful!
            </Typography>
            
            <Typography variant="h5" component="h2" gutterBottom color="text.secondary">
              Thank you for purchasing {planName}
            </Typography>

            <Chip 
              label="One-time Payment" 
              color="success" 
              sx={{ mb: 3, fontSize: '1rem', px: 2, py: 1 }} 
            />

            <Alert severity="success" sx={{ mb: 4, textAlign: 'left' }}>
              <Typography variant="body1" gutterBottom>
                <strong>What happens next:</strong>
              </Typography>
              <Typography variant="body2" component="div">
                {needsOnboarding ? (
                  <>
                    • Complete your account setup (2 minutes)<br/>
                    • Set up your AI security scan<br/>
                    • Configure your target AI system and testing parameters<br/>
                    • Run comprehensive security tests<br/>
                    • Receive detailed compliance and vulnerability reports
                  </>
                ) : (
                  <>
                    • You'll be redirected to set up your AI security scan<br/>
                    • Configure your target AI system and testing parameters<br/>
                    • Run comprehensive security tests<br/>
                    • Receive detailed compliance and vulnerability reports
                  </>
                )}
              </Typography>
            </Alert>

            <Grid container spacing={3} justifyContent="center">
              <Grid item xs={12} sm={6}>
                <Button
                  variant="contained"
                  size="large"
                  startIcon={<RocketLaunch />}
                  endIcon={<ArrowForward />}
                  onClick={handleStartScan}
                  fullWidth
                  sx={{ py: 2, fontSize: '1.1rem' }}
                >
                  {needsOnboarding ? 'Complete Setup & Start Scan' : 'Start Your Scan Now'}
                </Button>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Button
                  variant="outlined"
                  size="large"
                  startIcon={<Receipt />}
                  onClick={handleViewSubscription}
                  fullWidth
                  sx={{ py: 2 }}
                >
                  View Receipt
                </Button>
              </Grid>
            </Grid>

            {autoRedirect && (
              <Box sx={{ mt: 4, p: 2, bgcolor: 'grey.50', borderRadius: 2 }}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  {needsOnboarding 
                    ? `Automatically redirecting to complete setup in ${countdown} seconds...`
                    : `Automatically redirecting to scan setup in ${countdown} seconds...`
                  }
                </Typography>
                <Button 
                  size="small" 
                  onClick={handleStopAutoRedirect}
                  sx={{ mt: 1 }}
                >
                  Cancel Auto-redirect
                </Button>
              </Box>
            )}
          </CardContent>
        </Card>
      </Container>
    );
  }

  // For subscription payments
  return (
    <Container maxWidth="md" sx={{ py: 6 }}>
      <Card sx={{ textAlign: 'center', p: 4 }}>
        <CardContent>
          <CheckCircle sx={{ fontSize: 80, color: 'success.main', mb: 3 }} />
          
          <Typography variant="h3" component="h1" gutterBottom color="success.main">
            Subscription Active!
          </Typography>
          
          <Typography variant="h5" component="h2" gutterBottom color="text.secondary">
            Welcome to {planName}
          </Typography>

          <Alert severity="success" sx={{ mb: 4, textAlign: 'left' }}>
            <Typography variant="body1" gutterBottom>
              <strong>Your subscription includes:</strong>
            </Typography>
            <Typography variant="body2" component="div">
              • Monthly automated security scans<br/>
              • Continuous monitoring and alerts<br/>
              • Priority support and consultation<br/>
              • Access to all compliance frameworks
            </Typography>
          </Alert>

          <Grid container spacing={3} justifyContent="center">
            <Grid item xs={12} sm={6}>
              <Button
                variant="contained"
                size="large"
                startIcon={<RocketLaunch />}
                onClick={handleStartScan}
                fullWidth
                sx={{ py: 2, fontSize: '1.1rem' }}
              >
                Set Up Your First Scan
              </Button>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Button
                variant="outlined"
                size="large"
                startIcon={<Receipt />}
                onClick={handleViewSubscription}
                fullWidth
                sx={{ py: 2 }}
              >
                Manage Subscription
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>
    </Container>
  );
}