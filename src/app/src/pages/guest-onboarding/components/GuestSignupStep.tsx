import React, { useState } from 'react';
import {
  Box,
  Button,
  Typography,
  Grid,
  TextField,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Alert,
  CircularProgress,
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import SecurityIcon from '@mui/icons-material/Security';
import SpeedIcon from '@mui/icons-material/Speed';
import PersonalVideoIcon from '@mui/icons-material/PersonalVideo';
import { useUserStore } from '@app/stores/userStore';

interface GuestOnboardingData {
  name: string;
  company: string;
  chatbotRole: string;
  industry: string;
  useCase: string;
  complianceNeeds: string[];
  countryOfOperation: string;
}

interface GuestSignupStepProps {
  guestData: GuestOnboardingData;
  onComplete: () => void;
  onBack: () => void;
}

export function GuestSignupStep({ guestData, onComplete, onBack }: GuestSignupStepProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  const { signUp, updateOnboardingData, saveOnboardingToProfile } = useUserStore();

  const handleSignup = async () => {
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      // Create the account
      await signUp(email, password);
      
      // Update the onboarding data in the store
      updateOnboardingData({
        name: guestData.name,
        company: guestData.company,
        chatbotRole: guestData.chatbotRole,
        industry: guestData.industry,
        useCase: guestData.useCase,
        complianceNeeds: guestData.complianceNeeds,
        countryOfOperation: guestData.countryOfOperation,
        onboardingCompleted: true,
        termsAccepted: true,
      });

      // Save to Supabase
      await saveOnboardingToProfile();
      
      // TODO: Create free test plan config based on guestData
      // This would involve calling an API to generate a basic config
      
      onComplete();
    } catch (error: any) {
      console.error('Signup error:', error);
      setError(error.message || 'Failed to create account');
    } finally {
      setIsLoading(false);
    }
  };

  const isValidEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const isValid = email && isValidEmail(email) && password && confirmPassword && password === confirmPassword;

  const freeFeatures = [
    'Personalized AI security test plan',
    'Quick security scan (up to 50 tests)',
    'Basic vulnerability detection',
    'PDF security report',
    'Email support'
  ];

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Create Your Free Account
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Get instant access to a personalized AI security testing plan based on your requirements
      </Typography>

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <PersonalVideoIcon color="primary" />
                Your Personalized Plan
              </Typography>
              
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Based on your inputs, we'll create a custom security testing plan for:
              </Typography>
              
              <List dense>
                <ListItem>
                  <ListItemIcon>
                    <CheckCircleIcon color="success" fontSize="small" />
                  </ListItemIcon>
                  <ListItemText 
                    primary={`${guestData.industry} industry`}
                    secondary="Industry-specific security tests"
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <CheckCircleIcon color="success" fontSize="small" />
                  </ListItemIcon>
                  <ListItemText 
                    primary={guestData.chatbotRole}
                    secondary="Role-based vulnerability testing"
                  />
                </ListItem>
                {guestData.complianceNeeds.length > 0 && (
                  <ListItem>
                    <ListItemIcon>
                      <CheckCircleIcon color="success" fontSize="small" />
                    </ListItemIcon>
                    <ListItemText 
                      primary={`${guestData.complianceNeeds.join(', ')} compliance`}
                      secondary="Regulatory compliance checks"
                    />
                  </ListItem>
                )}
              </List>

              <Divider sx={{ my: 2 }} />
              
              <Typography variant="subtitle2" gutterBottom>
                Free Plan Includes:
              </Typography>
              <List dense>
                {freeFeatures.map((feature, index) => (
                  <ListItem key={index} sx={{ py: 0.5 }}>
                    <ListItemIcon>
                      <CheckCircleIcon color="primary" fontSize="small" />
                    </ListItemIcon>
                    <ListItemText 
                      primary={feature}
                      primaryTypographyProps={{ variant: 'body2' }}
                    />
                  </ListItem>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Account Details
              </Typography>
              
              {error && (
                <Alert severity="error" sx={{ mb: 2 }}>
                  {error}
                </Alert>
              )}
              
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Email Address"
                    type="email"
                    variant="outlined"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    disabled={isLoading}
                    error={email && !isValidEmail(email)}
                    helperText={email && !isValidEmail(email) ? 'Please enter a valid email address' : ''}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Password"
                    type="password"
                    variant="outlined"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    disabled={isLoading}
                    helperText="Minimum 6 characters"
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Confirm Password"
                    type="password"
                    variant="outlined"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    disabled={isLoading}
                    error={confirmPassword && password !== confirmPassword}
                    helperText={confirmPassword && password !== confirmPassword ? 'Passwords do not match' : ''}
                  />
                </Grid>
              </Grid>

              <Typography variant="caption" color="text.secondary" sx={{ mt: 2, display: 'block' }}>
                By creating an account, you agree to our Terms of Service and Privacy Policy.
                Your data will be used to create personalized security testing configurations.
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
      
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3 }}>
        <Button onClick={onBack} size="large" disabled={isLoading}>
          Back
        </Button>
        <Button
          variant="contained"
          onClick={handleSignup}
          disabled={!isValid || isLoading}
          size="large"
          startIcon={isLoading ? <CircularProgress size={20} /> : <SecurityIcon />}
        >
          {isLoading ? 'Creating Account...' : 'Create Free Account & Generate Plan'}
        </Button>
      </Box>
    </Box>
  );
}