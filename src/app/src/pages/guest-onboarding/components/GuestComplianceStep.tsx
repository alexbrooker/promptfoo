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
  SelectChangeEvent,
  FormGroup,
  FormControlLabel,
  Checkbox,
  Card,
  CardContent,
  Chip,
  Stack,
} from '@mui/material';

interface GuestOnboardingData {
  name: string;
  company: string;
  chatbotRole: string;
  industry: string;
  useCase: string;
  complianceNeeds: string[];
  countryOfOperation: string;
}

interface GuestComplianceStepProps {
  data: GuestOnboardingData;
  onUpdate: (updates: Partial<GuestOnboardingData>) => void;
  onNext: () => void;
  onBack: () => void;
}

const countries = [
  'United States',
  'United Kingdom',
  'Canada',
  'Germany',
  'France',
  'Australia',
  'Japan',
  'Singapore',
  'Netherlands',
  'Sweden',
  'Switzerland',
  'Other'
];

const complianceOptions = [
  { value: 'GDPR', label: 'GDPR (EU Data Protection)', description: 'European data privacy regulation' },
  { value: 'HIPAA', label: 'HIPAA (Healthcare)', description: 'US healthcare privacy standards' },
  { value: 'SOX', label: 'SOX (Financial)', description: 'US financial reporting compliance' },
  { value: 'PCI-DSS', label: 'PCI-DSS (Payment)', description: 'Payment card industry standards' },
  { value: 'SOC2', label: 'SOC 2 (Security)', description: 'Security and availability standards' },
  { value: 'ISO27001', label: 'ISO 27001 (Security)', description: 'International security management' },
  { value: 'COPPA', label: 'COPPA (Children)', description: 'Children\'s privacy protection' },
  { value: 'FERPA', label: 'FERPA (Education)', description: 'Educational privacy rights' },
];

const testingGoals = [
  'Prevent data leaks and privacy violations',
  'Ensure safe responses to harmful content',
  'Test resistance to jailbreaking attempts',
  'Verify compliance with industry regulations',
  'Check for bias and fairness issues',
  'Validate prompt injection defenses',
  'Test output quality and accuracy',
  'Ensure appropriate content filtering'
];

export function GuestComplianceStep({ data, onUpdate, onNext, onBack }: GuestComplianceStepProps) {
  const [complianceNeeds, setComplianceNeeds] = useState<string[]>(data.complianceNeeds || []);
  const [countryOfOperation, setCountryOfOperation] = useState(data.countryOfOperation || '');
  const [selectedGoals, setSelectedGoals] = useState<string[]>([]);

  const handleComplianceChange = (compliance: string) => {
    setComplianceNeeds(prev => 
      prev.includes(compliance) 
        ? prev.filter(c => c !== compliance)
        : [...prev, compliance]
    );
  };

  const handleGoalToggle = (goal: string) => {
    setSelectedGoals(prev =>
      prev.includes(goal)
        ? prev.filter(g => g !== goal)
        : [...prev, goal]
    );
  };

  const handleNext = () => {
    onUpdate({ complianceNeeds, countryOfOperation });
    onNext();
  };

  const isValid = countryOfOperation.trim();

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Testing Goals & Compliance
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Help us customize your security testing plan based on your specific needs and requirements
      </Typography>
      
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Typography variant="subtitle1" gutterBottom sx={{ mt: 2 }}>
            What are your main AI security testing goals?
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Select the security concerns that matter most to your organization:
          </Typography>
          <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', gap: 1 }}>
            {testingGoals.map((goal) => (
              <Chip
                key={goal}
                label={goal}
                onClick={() => handleGoalToggle(goal)}
                color={selectedGoals.includes(goal) ? 'primary' : 'default'}
                variant={selectedGoals.includes(goal) ? 'filled' : 'outlined'}
                clickable
                size="small"
              />
            ))}
          </Stack>
        </Grid>

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
            Compliance Requirements (Optional)
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Select any compliance standards your organization needs to meet:
          </Typography>
          <Grid container spacing={2}>
            {complianceOptions.map((option) => (
              <Grid item xs={12} sm={6} key={option.value}>
                <Card 
                  sx={{ 
                    cursor: 'pointer',
                    border: complianceNeeds.includes(option.value) ? '2px solid' : '1px solid',
                    borderColor: complianceNeeds.includes(option.value) ? 'primary.main' : 'divider',
                    '&:hover': { borderColor: 'primary.main' }
                  }}
                  onClick={() => handleComplianceChange(option.value)}
                >
                  <CardContent sx={{ p: 2 }}>
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={complianceNeeds.includes(option.value)}
                          onChange={() => handleComplianceChange(option.value)}
                        />
                      }
                      label={
                        <Box>
                          <Typography variant="subtitle2">{option.label}</Typography>
                          <Typography variant="caption" color="text.secondary">
                            {option.description}
                          </Typography>
                        </Box>
                      }
                    />
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Grid>
      </Grid>
      
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3 }}>
        <Button onClick={onBack} size="large">
          Back
        </Button>
        <Button
          variant="contained"
          onClick={handleNext}
          disabled={!isValid}
          size="large"
        >
          Continue
        </Button>
      </Box>
    </Box>
  );
}