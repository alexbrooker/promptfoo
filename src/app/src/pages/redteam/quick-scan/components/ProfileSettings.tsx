import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  FormHelperText,
  Alert,
  CircularProgress,
  Divider,
  Collapse,
  IconButton,
} from '@mui/material';
import {
  Business,
  Security,
  Save,
  Refresh,
  ExpandMore,
  ExpandLess,
  Settings,
} from '@mui/icons-material';
import { useUserStore } from '@app/stores/userStore';

// Reusing the same constants from settings page for consistency
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

interface ProfileSettingsProps {
  onProfileUpdate?: (updatedData: any) => void;
}

export default function ProfileSettings({ onProfileUpdate }: ProfileSettingsProps) {
  const { 
    onboardingData, 
    updateOnboardingData, 
    saveOnboardingToProfile,
  } = useUserStore();
  
  const [expanded, setExpanded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasChanges, setHasChanges] = useState(false);

  // Only track the fields that affect quick-scan customization
  const [formData, setFormData] = useState({
    chatbotRole: '',
    industry: '',
    useCase: '',
    complianceNeeds: [] as string[],
  });

  // Load user data on component mount
  useEffect(() => {
    setFormData({
      chatbotRole: onboardingData.chatbotRole || '',
      industry: onboardingData.industry || '',
      useCase: onboardingData.useCase || '',
      complianceNeeds: onboardingData.complianceNeeds || [],
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
      const updatedData = { ...onboardingData, ...formData };
      updateOnboardingData(formData);
      
      // Save to database
      await saveOnboardingToProfile();
      
      // Notify parent component of the update
      if (onProfileUpdate) {
        onProfileUpdate(updatedData);
      }
      
      setSuccess(true);
      setHasChanges(false);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save profile settings');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setFormData({
      chatbotRole: onboardingData.chatbotRole || '',
      industry: onboardingData.industry || '',
      useCase: onboardingData.useCase || '',
      complianceNeeds: onboardingData.complianceNeeds || [],
    });
    setHasChanges(false);
    setError(null);
    setSuccess(false);
  };

  return (
    <Card sx={{ mb: 3 }}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Settings color="primary" />
            <Typography variant="h6" component="h2">
              AI Assistant Profile
            </Typography>
          </Box>
          <IconButton
            onClick={() => setExpanded(!expanded)}
            aria-label={expanded ? 'collapse' : 'expand'}
            size="small"
          >
            {expanded ? <ExpandLess /> : <ExpandMore />}
          </IconButton>
        </Box>

        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          <strong>{formData.industry}</strong> {formData.chatbotRole} 
          {formData.complianceNeeds.length > 0 && formData.complianceNeeds[0] !== 'None' && (
            <span> • Compliance: {formData.complianceNeeds.filter(c => c !== 'None').join(', ')}</span>
          )}
          {!expanded && <span> • Click to customize</span>}
        </Typography>

        <Collapse in={expanded}>
          <Divider sx={{ mb: 3 }} />
          
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          {success && (
            <Alert severity="success" sx={{ mb: 2 }}>
              Profile settings saved! The quick scan will be updated with your new preferences.
            </Alert>
          )}

          {/* AI System Information */}
          <Box sx={{ mb: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <Business sx={{ mr: 1, color: 'primary.main', fontSize: '1.2rem' }} />
              <Typography variant="subtitle1" fontWeight="medium">AI System Information</Typography>
            </Box>
            
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="AI System Role"
                  value={formData.chatbotRole}
                  onChange={(e) => handleInputChange('chatbotRole', e.target.value)}
                  placeholder="e.g., Customer Support Assistant, Code Helper"
                  helperText="Describe the primary role of your AI system"
                  size="small"
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth size="small">
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
                <FormControl fullWidth size="small">
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
          </Box>

          {/* Compliance & Security */}
          <Box sx={{ mb: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <Security sx={{ mr: 1, color: 'primary.main', fontSize: '1.2rem' }} />
              <Typography variant="subtitle1" fontWeight="medium">Compliance Requirements</Typography>
            </Box>
            
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <FormControl fullWidth size="small">
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
                    Select compliance standards that apply to your AI system
                  </FormHelperText>
                </FormControl>
              </Grid>
            </Grid>
          </Box>

          {/* Action Buttons */}
          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end', mt: 3 }}>
            <Button
              variant="outlined"
              startIcon={<Refresh />}
              onClick={handleReset}
              disabled={!hasChanges || loading}
              size="small"
            >
              Reset
            </Button>
            
            <Button
              variant="contained"
              startIcon={loading ? <CircularProgress size={16} /> : <Save />}
              onClick={handleSave}
              disabled={!hasChanges || loading}
              size="small"
            >
              {loading ? 'Saving...' : 'Save Changes'}
            </Button>
          </Box>
        </Collapse>
      </CardContent>
    </Card>
  );
}