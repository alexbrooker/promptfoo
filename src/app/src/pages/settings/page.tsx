import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  TextField,
  Button,
  Grid,
  Alert,
  CircularProgress,
  Divider,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  FormHelperText,
  Avatar,
} from '@mui/material';
import {
  Person,
  Business,
  Security,
  Save,
  Refresh,
} from '@mui/icons-material';
import { useUserStore } from '@app/stores/userStore';

const INDUSTRIES = [
  'Technology',
  'Healthcare',
  'Financial Services', 
  'Education',
  'Government',
  'Manufacturing',
  'Retail',
  'Media & Entertainment',
  'Transportation',
  'Energy',
  'Other',
];

const USE_CASES = [
  'Customer Support Chatbot',
  'Internal Knowledge Assistant', 
  'Content Generation',
  'Code Assistant',
  'Data Analysis',
  'Educational Tutor',
  'Healthcare Assistant',
  'Legal Document Review',
  'HR Assistant',
  'Sales Assistant',
  'Other',
];

const COMPLIANCE_OPTIONS = [
  'GDPR',
  'HIPAA',
  'SOX',
  'PCI DSS',
  'SOC 2',
  'ISO 27001',
  'CCPA',
  'FERPA',
  'GLBA',
  'None',
];

const COUNTRIES = [
  'United States',
  'United Kingdom', 
  'Canada',
  'Germany',
  'France',
  'Australia',
  'Netherlands',
  'Singapore',
  'Japan',
  'Other',
];

export default function SettingsPage() {
  const { 
    user, 
    onboardingData, 
    updateOnboardingData, 
    saveOnboardingToProfile, 
    fetchOnboardingData 
  } = useUserStore();
  
  const [formData, setFormData] = useState({
    name: '',
    company: '',
    chatbotRole: '',
    industry: '',
    useCase: '',
    complianceNeeds: [] as string[],
    countryOfOperation: '',
  });
  
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasChanges, setHasChanges] = useState(false);

  // Load user data on component mount
  useEffect(() => {
    fetchOnboardingData();
  }, [fetchOnboardingData]);

  // Update form data when onboarding data changes
  useEffect(() => {
    setFormData({
      name: onboardingData.name || '',
      company: onboardingData.company || '',
      chatbotRole: onboardingData.chatbotRole || '',
      industry: onboardingData.industry || '',
      useCase: onboardingData.useCase || '',
      complianceNeeds: onboardingData.complianceNeeds || [],
      countryOfOperation: onboardingData.countryOfOperation || '',
    });
  }, [onboardingData]);

  // Track changes
  useEffect(() => {
    const hasChanges = Object.keys(formData).some(key => {
      const formValue = formData[key as keyof typeof formData];
      const originalValue = onboardingData[key as keyof typeof onboardingData];
      
      if (Array.isArray(formValue) && Array.isArray(originalValue)) {
        return JSON.stringify(formValue) !== JSON.stringify(originalValue);
      }
      
      return formValue !== originalValue;
    });
    
    setHasChanges(hasChanges);
  }, [formData, onboardingData]);

  const handleInputChange = (field: string, value: string | string[]) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
    
    if (success) setSuccess(false);
    if (error) setError(null);
  };

  const handleComplianceChange = (value: string[]) => {
    handleInputChange('complianceNeeds', value);
  };

  const handleSave = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Update the store with form data
      updateOnboardingData(formData);
      
      // Save to database
      await saveOnboardingToProfile();
      
      setSuccess(true);
      setHasChanges(false);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save settings');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setFormData({
      name: onboardingData.name || '',
      company: onboardingData.company || '',
      chatbotRole: onboardingData.chatbotRole || '',
      industry: onboardingData.industry || '',
      useCase: onboardingData.useCase || '',
      complianceNeeds: onboardingData.complianceNeeds || [],
      countryOfOperation: onboardingData.countryOfOperation || '',
    });
    setHasChanges(false);
    setError(null);
    setSuccess(false);
  };

  const userName = formData.name || user?.email?.split('@')[0] || 'User';

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom fontWeight="bold">
        Account Settings
      </Typography>
      
      <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
        Manage your profile information and preferences.
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 3 }}>
          Settings saved successfully!
        </Alert>
      )}

      {/* Profile Section */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
            <Person sx={{ mr: 2, color: 'primary.main' }} />
            <Typography variant="h6">Profile Information</Typography>
          </Box>
          
          <Grid container spacing={3}>
            <Grid item xs={12} sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <Avatar
                sx={{ 
                  width: 64, 
                  height: 64, 
                  bgcolor: 'primary.main',
                  fontSize: '1.5rem',
                  fontWeight: 600,
                  mr: 3,
                }}
              >
                {userName.charAt(0).toUpperCase()}
              </Avatar>
              <Box>
                <Typography variant="h6">{userName}</Typography>
                <Typography variant="body2" color="text.secondary">
                  {user?.email}
                </Typography>
                <Chip
                  label={`${onboardingData.scanCredits || 0} scan credits`}
                  color="primary"
                  variant="outlined"
                  size="small"
                  sx={{ mt: 1 }}
                />
              </Box>
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Full Name"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder="Enter your full name"
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Company"
                value={formData.company}
                onChange={(e) => handleInputChange('company', e.target.value)}
                placeholder="Enter your company name"
              />
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* AI System Information */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
            <Business sx={{ mr: 2, color: 'primary.main' }} />
            <Typography variant="h6">AI System Information</Typography>
          </Box>
          
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="AI System Role"
                value={formData.chatbotRole}
                onChange={(e) => handleInputChange('chatbotRole', e.target.value)}
                placeholder="e.g., Customer Support Assistant, Code Helper"
                helperText="Describe the primary role of your AI system"
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Industry</InputLabel>
                <Select
                  value={formData.industry}
                  label="Industry"
                  onChange={(e) => handleInputChange('industry', e.target.value)}
                >
                  {INDUSTRIES.map((industry) => (
                    <MenuItem key={industry} value={industry}>
                      {industry}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Primary Use Case</InputLabel>
                <Select
                  value={formData.useCase}
                  label="Primary Use Case"
                  onChange={(e) => handleInputChange('useCase', e.target.value)}
                >
                  {USE_CASES.map((useCase) => (
                    <MenuItem key={useCase} value={useCase}>
                      {useCase}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Compliance & Operations */}
      <Card sx={{ mb: 4 }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
            <Security sx={{ mr: 2, color: 'primary.main' }} />
            <Typography variant="h6">Compliance & Operations</Typography>
          </Box>
          
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Country of Operation</InputLabel>
                <Select
                  value={formData.countryOfOperation}
                  label="Country of Operation"
                  onChange={(e) => handleInputChange('countryOfOperation', e.target.value)}
                >
                  {COUNTRIES.map((country) => (
                    <MenuItem key={country} value={country}>
                      {country}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Compliance Requirements</InputLabel>
                <Select
                  multiple
                  value={formData.complianceNeeds}
                  label="Compliance Requirements"
                  onChange={(e) => handleComplianceChange(e.target.value as string[])}
                  renderValue={(selected) => (
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {selected.map((value) => (
                        <Chip key={value} label={value} size="small" />
                      ))}
                    </Box>
                  )}
                >
                  {COMPLIANCE_OPTIONS.map((option) => (
                    <MenuItem key={option} value={option}>
                      {option}
                    </MenuItem>
                  ))}
                </Select>
                <FormHelperText>
                  Select all applicable compliance standards
                </FormHelperText>
              </FormControl>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
        <Button
          variant="outlined"
          startIcon={<Refresh />}
          onClick={handleReset}
          disabled={!hasChanges || loading}
        >
          Reset
        </Button>
        
        <Button
          variant="contained"
          startIcon={loading ? <CircularProgress size={16} /> : <Save />}
          onClick={handleSave}
          disabled={!hasChanges || loading}
        >
          {loading ? 'Saving...' : 'Save Changes'}
        </Button>
      </Box>
    </Container>
  );
}