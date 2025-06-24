import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
  Chip,
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import SecurityIcon from '@mui/icons-material/Security';
import SpeedIcon from '@mui/icons-material/Speed';
import PersonalVideoIcon from '@mui/icons-material/PersonalVideo';
import { useUserStore } from '@app/stores/userStore';
import { callApi } from '@app/utils/api';
import { supabase } from '@app/lib/supabase';

interface GuestOnboardingData {
  chatbotRole: string;
  industry: string[];
  useCase: string[];
  complianceNeeds: string[];
  countryOfOperation: string;
  generatedConfig?: any;
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
  
  const navigate = useNavigate();
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
      const { data } = await signUp(email, password);
      
      // Store the profile data and config in Supabase for the user
      const profileData = {
        id: data.user!.id,
        email: data.user!.email,
        chatbot_role: guestData.chatbotRole,
        industry: guestData.industry.join(', '),
        use_case: guestData.useCase.join(', '),
        compliance_needs: guestData.complianceNeeds,
        country_of_operation: guestData.countryOfOperation,
        onboarding_completed: true,
        terms_accepted: true,
        pending_test_plan_config: guestData.generatedConfig ? {
          name: `${guestData.chatbotRole} Security Test Plan`,
          type: 'redteam',
          config: guestData.generatedConfig,
        } : null,
        updated_at: new Date().toISOString(),
      };

      // Save profile data to Supabase immediately (this works even before email verification)
      const { error: profileError } = await supabase.from('profiles').upsert(profileData);
      if (profileError) {
        console.error('Failed to save profile data:', profileError);
        // Store locally as fallback
        localStorage.setItem('pendingProfileData', JSON.stringify({
          chatbotRole: guestData.chatbotRole,
          industry: guestData.industry.join(', '),
          useCase: guestData.useCase.join(', '),
          complianceNeeds: guestData.complianceNeeds,
          countryOfOperation: guestData.countryOfOperation,
          onboardingCompleted: true,
          termsAccepted: true,
          pendingTestPlanConfig: guestData.generatedConfig ? {
            name: `${guestData.chatbotRole} Security Test Plan`,
            type: 'redteam',
            config: guestData.generatedConfig,
          } : null,
        }));
      } else {
        console.log('Profile data saved to Supabase successfully');
      }
      
      // Redirect to email verification page
      navigate('/email-verification');
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

  const testingStats = [
    { icon: '🛡️', stat: '5', description: 'Security frameworks tested' },
    { icon: '⚡', stat: '200+', description: 'Automated security tests' },
    { icon: '📋', stat: 'Detailed', description: 'Compliance report generated' },
    { icon: '🎯', stat: 'Expert', description: 'Security recommendations' }
  ];

  const features = [
    'Comprehensive AI security testing',
    'Multi-framework compliance reporting',
    'Detailed vulnerability analysis'
  ];

  const valueProps = [
    {
      icon: '🔍',
      title: 'Comprehensive Testing',
      description: 'Test your AI against 200+ security scenarios across multiple frameworks.',
      benefit: 'Complete coverage'
    },
    {
      icon: '📊',
      title: 'Detailed Reports',
      description: 'Get actionable security findings with remediation recommendations.',
      benefit: 'Clear guidance'
    },
    {
      icon: '✅',
      title: 'Compliance Ready',
      description: 'Generate reports for OWASP, NIST, and MITRE ATLAS frameworks.',
      benefit: 'Framework aligned'
    }
  ];

  return (
    <Box sx={{ maxWidth: '1000px', mx: 'auto' }}>
      {/* Premium Header with Urgency */}
      <Box sx={{ textAlign: 'center', mb: 4 }}>
        <Typography variant="h2" gutterBottom sx={{ fontWeight: 'bold', color: '#1976d2' }}>
          Get Your AI Security Report
        </Typography>
        <Typography variant="h5" color="text.secondary" sx={{ mb: 2 }}>
          Start comprehensive AI security testing
        </Typography>
        <Chip 
          label="Comprehensive security testing and compliance reporting" 
          color="primary" 
          sx={{ 
            fontSize: '0.9rem', 
            fontWeight: 'bold'
          }} 
        />
      </Box>

      {/* Risk Mitigation Stats */}
      <Grid container spacing={2} sx={{ mb: 4 }}>
        {testingStats.map((stat, index) => (
          <Grid item xs={6} md={3} key={index}>
            <Card sx={{ textAlign: 'center', p: 2, height: '100%' }}>
              <Typography variant="h3" sx={{ mb: 1 }}>
                {stat.icon}
              </Typography>
              <Typography variant="h5" sx={{ fontWeight: 'bold', color: '#1976d2' }}>
                {stat.stat}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {stat.description}
              </Typography>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Grid container spacing={4}>
        {/* Left Side - Value Proposition */}
        <Grid item xs={12} md={7}>
          {/* Social Proof */}
          <Card sx={{ mb: 3, background: 'linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%)' }}>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
                🔧 What You Get
              </Typography>
              {features.map((feature, index) => (
                <Typography key={index} variant="body2" sx={{ mb: 1 }}>
                  ✓ {feature}
                </Typography>
              ))}
            </CardContent>
          </Card>

          {/* Value Props */}
          {valueProps.map((prop, index) => (
            <Card key={index} sx={{ mb: 2 }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                  <Typography variant="h4">{prop.icon}</Typography>
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 0.5 }}>
                      {prop.title}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                      {prop.description}
                    </Typography>
                    <Chip 
                      label={prop.benefit} 
                      color="success" 
                      size="small" 
                      sx={{ fontWeight: 'bold' }}
                    />
                  </Box>
                </Box>
              </CardContent>
            </Card>
          ))}

          {/* Testing Information */}
          <Card sx={{ background: 'linear-gradient(135deg, #e8f5e8 0%, #c8e6c8 100%)', border: '2px solid #4caf50' }}>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#2e7d32', mb: 1 }}>
                🎯 Professional Security Testing
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Get comprehensive red team testing results with detailed vulnerability analysis and remediation guidance.
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Right Side - Checkout Form */}
        <Grid item xs={12} md={5}>
          <Card sx={{ position: 'sticky', top: 20 }}>
            <CardContent sx={{ p: 3 }}>
              {/* Pricing Header */}
              <Box sx={{ textAlign: 'center', mb: 3, p: 2, backgroundColor: '#f8f9fa', borderRadius: 2 }}>
                <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#1976d2' }}>
                  Get Started
                </Typography>
                <Typography variant="body1" color="text.secondary">
                  AI Security Testing & Reports
                </Typography>
              </Box>


              {/* Account Creation Form */}
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
                Create Your Account
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
                    label="Business Email"
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
                    label="Secure Password"
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

              {/* Personalization Summary */}
              <Card sx={{ mt: 3, p: 2, backgroundColor: '#f8f9fa' }}>
                <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 'bold' }}>
                  Your Personalized Assessment:
                </Typography>
                <List dense>
                  <ListItem sx={{ px: 0 }}>
                    <ListItemIcon sx={{ minWidth: 30 }}>
                      <CheckCircleIcon color="success" fontSize="small" />
                    </ListItemIcon>
                    <ListItemText 
                      primary={guestData.chatbotRole}
                      secondary="AI system type"
                      primaryTypographyProps={{ variant: 'body2' }}
                      secondaryTypographyProps={{ variant: 'caption' }}
                    />
                  </ListItem>
                  <ListItem sx={{ px: 0 }}>
                    <ListItemIcon sx={{ minWidth: 30 }}>
                      <CheckCircleIcon color="success" fontSize="small" />
                    </ListItemIcon>
                    <ListItemText 
                      primary={guestData.industry.join(', ')}
                      secondary="Industry focus"
                      primaryTypographyProps={{ variant: 'body2' }}
                      secondaryTypographyProps={{ variant: 'caption' }}
                    />
                  </ListItem>
                  <ListItem sx={{ px: 0 }}>
                    <ListItemIcon sx={{ minWidth: 30 }}>
                      <CheckCircleIcon color="success" fontSize="small" />
                    </ListItemIcon>
                    <ListItemText 
                      primary="Security framework testing"
                      secondary="OWASP, NIST, MITRE ATLAS coverage"
                      primaryTypographyProps={{ variant: 'body2' }}
                      secondaryTypographyProps={{ variant: 'caption' }}
                    />
                  </ListItem>
                </List>
              </Card>

              <Typography variant="caption" color="text.secondary" sx={{ mt: 2, display: 'block', textAlign: 'center' }}>
                🔒 Secure testing environment • Professional reporting
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
      
      {/* Action Buttons */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 6, maxWidth: '600px', mx: 'auto' }}>
        <Button 
          onClick={onBack} 
          size="large"
          disabled={isLoading}
          sx={{
            padding: '12px 24px',
            fontSize: '1rem',
            borderRadius: '24px',
            textTransform: 'none',
          }}
        >
          ← Back
        </Button>
        <Button
          variant="contained"
          onClick={handleSignup}
          disabled={!isValid || isLoading}
          size="large"
          startIcon={isLoading ? <CircularProgress size={20} color="inherit" /> : <SecurityIcon />}
          sx={{
            padding: '16px 40px',
            fontSize: '1.2rem',
            borderRadius: '30px',
            textTransform: 'none',
            background: 'linear-gradient(45deg, #1976d2 30%, #42a5f5 90%)',
            boxShadow: '0 8px 25px rgba(25, 118, 210, 0.3)',
            '&:hover': {
              background: 'linear-gradient(45deg, #1565c0 30%, #1e88e5 90%)',
              transform: 'translateY(-2px)',
              boxShadow: '0 12px 35px rgba(25, 118, 210, 0.4)',
            },
            '&:disabled': {
              background: '#e0e0e0',
              color: '#999',
              boxShadow: 'none',
            },
          }}
        >
          {isLoading ? 'Creating Your Account...' : '🚀 Start Security Testing'}
        </Button>
      </Box>

      {/* Trust Signals Footer */}
      <Box sx={{ textAlign: 'center', mt: 4, p: 3, backgroundColor: '#f8f9fa', borderRadius: 2 }}>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
          Professional AI security testing • Comprehensive reporting
        </Typography>
        <Typography variant="caption" color="text.secondary">
          By continuing, you agree to our Terms of Service and Privacy Policy.
          Your data is encrypted and secure.
        </Typography>
      </Box>
    </Box>
  );
}