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
  Stack,
} from '@mui/material';
import {
  Person,
  Business,
  Security,
  Save,
  Refresh,
} from '@mui/icons-material';
import { useUserStore } from '@app/stores/userStore';

const AI_ROLES = [
  'Customer Support',
  'Sales Assistant', 
  'Content Generation',
  'Data Analysis',
  'Research Assistant',
  'Code Assistant',
  'Healthcare Assistant',
  'Financial Advisor',
  'Legal Assistant',
  'Government AI',
  'Educational Tutor',
  'HR Assistant',
  'Other',
];

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
  'Real Estate',
  'Legal Services',
  'Other',
];

const USE_CASES = [
  'Answer customer questions',
  'Process customer support tickets',
  'Generate marketing content',
  'Analyze business data',
  'Research and summarization',
  'Write code and documentation',
  'Process sensitive information',
  'Provide specialized advice',
  'Ensure regulatory compliance',
  'Custom security assessment',
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
    chatbotRole: [] as string[],
    industry: [] as string[],
    useCase: [] as string[],
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
      chatbotRole: Array.isArray(onboardingData.chatbotRole) ? onboardingData.chatbotRole : (onboardingData.chatbotRole ? [onboardingData.chatbotRole] : []),
      industry: Array.isArray(onboardingData.industry) ? onboardingData.industry : (onboardingData.industry ? [onboardingData.industry] : []),
      useCase: Array.isArray(onboardingData.useCase) ? onboardingData.useCase : (onboardingData.useCase ? [onboardingData.useCase] : []),
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

  const handleChipToggle = (field: 'chatbotRole' | 'industry' | 'useCase', value: string) => {
    const currentValues = formData[field] as string[];
    const newValues = currentValues.includes(value)
      ? currentValues.filter(item => item !== value)
      : [...currentValues, value];
    handleInputChange(field, newValues);
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
      chatbotRole: Array.isArray(onboardingData.chatbotRole) ? onboardingData.chatbotRole : (onboardingData.chatbotRole ? [onboardingData.chatbotRole] : []),
      industry: Array.isArray(onboardingData.industry) ? onboardingData.industry : (onboardingData.industry ? [onboardingData.industry] : []),
      useCase: Array.isArray(onboardingData.useCase) ? onboardingData.useCase : (onboardingData.useCase ? [onboardingData.useCase] : []),
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
              <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 'bold' }}>
                AI System Role
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Select all roles that describe your AI system
              </Typography>
              <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', gap: 1 }}>
                {AI_ROLES.map((role) => (
                  <Chip
                    key={role}
                    label={role}
                    onClick={() => handleChipToggle('chatbotRole', role)}
                    sx={{
                      backgroundColor: formData.chatbotRole.includes(role) ? 'primary.main' : 'transparent',
                      border: `2px solid ${formData.chatbotRole.includes(role) ? 'primary.main' : '#e0e0e0'}`,
                      color: formData.chatbotRole.includes(role) ? 'white' : 'inherit',
                      fontWeight: formData.chatbotRole.includes(role) ? 'bold' : 'normal',
                      '&:hover': {
                        backgroundColor: 'primary.main',
                        color: 'white',
                        opacity: 0.8,
                      },
                    }}
                    clickable
                  />
                ))}
              </Stack>
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 'bold' }}>
                Industry
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Select all applicable industries
              </Typography>
              <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', gap: 1 }}>
                {INDUSTRIES.map((industry) => (
                  <Chip
                    key={industry}
                    label={industry}
                    onClick={() => handleChipToggle('industry', industry)}
                    sx={{
                      backgroundColor: formData.industry.includes(industry) ? 'secondary.main' : 'transparent',
                      border: `2px solid ${formData.industry.includes(industry) ? 'secondary.main' : '#e0e0e0'}`,
                      color: formData.industry.includes(industry) ? 'white' : 'inherit',
                      fontWeight: formData.industry.includes(industry) ? 'bold' : 'normal',
                      '&:hover': {
                        backgroundColor: 'secondary.main',
                        color: 'white',
                        opacity: 0.8,
                      },
                    }}
                    clickable
                  />
                ))}
              </Stack>
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 'bold' }}>
                Primary Use Cases
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Select all applicable use cases
              </Typography>
              <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', gap: 1 }}>
                {USE_CASES.map((useCase) => (
                  <Chip
                    key={useCase}
                    label={useCase}
                    onClick={() => handleChipToggle('useCase', useCase)}
                    sx={{
                      backgroundColor: formData.useCase.includes(useCase) ? 'info.main' : 'transparent',
                      border: `2px solid ${formData.useCase.includes(useCase) ? 'info.main' : '#e0e0e0'}`,
                      color: formData.useCase.includes(useCase) ? 'white' : 'inherit',
                      fontWeight: formData.useCase.includes(useCase) ? 'bold' : 'normal',
                      '&:hover': {
                        backgroundColor: 'info.main',
                        color: 'white',
                        opacity: 0.8,
                      },
                    }}
                    clickable
                  />
                ))}
              </Stack>
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