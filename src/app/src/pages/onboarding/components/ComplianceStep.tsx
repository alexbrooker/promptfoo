import React, { useState } from 'react';
import {
  Box,
  Button,
  Typography,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormControlLabel,
  Checkbox,
  FormGroup,
  SelectChangeEvent,
} from '@mui/material';
import { useUserStore } from '@app/stores/userStore';

interface ComplianceStepProps {
  onNext: () => void;
  onBack: () => void;
}

const countries = [
  'United States',
  'Canada',
  'United Kingdom',
  'Germany',
  'France',
  'Australia',
  'Japan',
  'Singapore',
  'Netherlands',
  'Sweden',
  'Other'
];

const complianceFrameworks = [
  'GDPR (General Data Protection Regulation)',
  'CCPA (California Consumer Privacy Act)',
  'HIPAA (Health Insurance Portability and Accountability Act)',
  'SOC 2 (Service Organization Control 2)',
  'ISO 27001',
  'PCI DSS (Payment Card Industry Data Security Standard)',
  'NIST Cybersecurity Framework',
  'FedRAMP (Federal Risk and Authorization Management Program)',
  'FDA (Food and Drug Administration) Guidelines',
  'Financial Industry Regulations (SEC, FINRA)',
  'None Required',
  'Other'
];

export function ComplianceStep({ onNext, onBack }: ComplianceStepProps) {
  const { onboardingData, updateOnboardingData, saveOnboardingToProfile } = useUserStore();
  const [countryOfOperation, setCountryOfOperation] = useState(onboardingData.countryOfOperation || '');
  const [complianceNeeds, setComplianceNeeds] = useState<string[]>(onboardingData.complianceNeeds || []);

  const handleComplianceChange = (framework: string, checked: boolean) => {
    if (checked) {
      setComplianceNeeds([...complianceNeeds, framework]);
    } else {
      setComplianceNeeds(complianceNeeds.filter(item => item !== framework));
    }
  };

  const handleNext = async () => {
    updateOnboardingData({ countryOfOperation, complianceNeeds });
    try {
      await saveOnboardingToProfile();
      onNext();
    } catch (error) {
      console.error('Error saving onboarding data:', error);
      // Continue to next step even if save fails
      onNext();
    }
  };

  const isValid = countryOfOperation;

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Compliance & Operations
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Understanding your compliance requirements helps us ensure your AI implementation meets necessary standards
      </Typography>
      
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <FormControl fullWidth required>
            <InputLabel>Primary Country of Operation</InputLabel>
            <Select
              value={countryOfOperation}
              label="Primary Country of Operation"
              onChange={(e: SelectChangeEvent) => setCountryOfOperation(e.target.value)}
            >
              {countries.map((country) => (
                <MenuItem key={country} value={country}>{country}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12}>
          <Typography variant="subtitle1" gutterBottom>
            Compliance Requirements (select all that apply)
          </Typography>
          <FormGroup>
            {complianceFrameworks.map((framework) => (
              <FormControlLabel
                key={framework}
                control={
                  <Checkbox
                    checked={complianceNeeds.includes(framework)}
                    onChange={(e) => handleComplianceChange(framework, e.target.checked)}
                  />
                }
                label={framework}
                sx={{ mb: 0.5 }}
              />
            ))}
          </FormGroup>
        </Grid>
      </Grid>
      
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3 }}>
        <Button onClick={onBack}>
          Back
        </Button>
        <Button
          variant="contained"
          onClick={handleNext}
          disabled={!isValid}
        >
          Next
        </Button>
      </Box>
    </Box>
  );
}