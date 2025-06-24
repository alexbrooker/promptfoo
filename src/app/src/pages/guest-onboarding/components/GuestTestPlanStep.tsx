import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Typography,
  Grid,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Chip,
  LinearProgress,
  Alert,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Badge,
  Divider,
  Paper,
} from '@mui/material';
import {
  Security as SecurityIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
  ExpandMore as ExpandMoreIcon,
  BugReport as BugReportIcon,
  Shield as ShieldIcon,
  Assessment as AssessmentIcon,
  Speed as SpeedIcon,
  MonetizationOn as MoneyIcon,
  Schedule as TimeIcon,
  VerifiedUser as ComplianceIcon,
  TrendingUp as GrowthIcon,
} from '@mui/icons-material';
import { generateGuestTestPlan } from '@app/utils/guestTestPlanGenerator';

// Business-focused risk mappings
const BUSINESS_RISK_MAPPING: Record<string, {
  businessName: string;
  businessImpact: string;
  avgCost: string;
  riskLevel: 'high' | 'medium' | 'low';
  whyItMatters: string;
}> = {
  'LLM-01: Prompt Injection': {
    businessName: 'Manipulation Prevention',
    businessImpact: 'Prevents attackers from controlling your AI to provide harmful responses',
    avgCost: '$2.3M avg breach cost',
    riskLevel: 'high',
    whyItMatters: 'Attackers can manipulate your AI to bypass safety measures, potentially causing reputation damage and regulatory violations.'
  },
  'LLM-02: Sensitive Information Disclosure': {
    businessName: 'Customer Data Protection',
    businessImpact: 'Ensures customer data and trade secrets stay confidential',
    avgCost: '$4.45M avg data breach',
    riskLevel: 'high',
    whyItMatters: 'Data breaches can result in massive fines, legal liability, and permanent loss of customer trust.'
  },
  'LLM-06: Excessive Agency': {
    businessName: 'Unauthorized Action Prevention',
    businessImpact: 'Prevents AI from taking actions beyond its intended scope',
    avgCost: '$1.8M avg incident cost',
    riskLevel: 'high',
    whyItMatters: 'AI systems with too much authority can make costly mistakes or be exploited to cause financial damage.'
  },
  'LLM-07: System Prompt Leakage': {
    businessName: 'Intellectual Property Protection',
    businessImpact: 'Protects your proprietary AI instructions and business logic',
    avgCost: '$890K avg IP theft',
    riskLevel: 'medium',
    whyItMatters: 'Exposed system prompts reveal your competitive advantages and can be used by competitors.'
  },
  'LLM-09: Misinformation': {
    businessName: 'Brand Reputation Protection',
    businessImpact: 'Prevents AI from spreading false or harmful information',
    avgCost: '$1.2M avg reputation damage',
    riskLevel: 'medium',
    whyItMatters: 'Misinformation can damage your brand reputation and lead to customer churn and regulatory scrutiny.'
  },
};

interface GeneratedTestPlan {
  summary: {
    totalTests: number;
    frameworks: string[];
    coverage: string;
  };
  owaspMapping: {
    id: string;
    name: string;
    description: string;
    plugins: string[];
    strategies: string[];
    testCount: number;
    priority: 'high' | 'medium' | 'low';
  }[];
  additionalTests: {
    id: string;
    name: string;
    description: string;
    plugins: string[];
    strategies: string[];
    testCount: number;
    priority: 'high' | 'medium' | 'low';
  }[];
  config: any;
}

interface GuestOnboardingData {
  chatbotRole: string;
  industry: string[];
  useCase: string[];
  complianceNeeds: string[];
  countryOfOperation: string;
}

interface GuestTestPlanStepProps {
  data: GuestOnboardingData;
  onNext: () => void;
  onBack: () => void;
  onTestPlanGenerated: (config: any) => void;
}

export function GuestTestPlanStep({ 
  data, 
  onNext, 
  onBack, 
  onTestPlanGenerated 
}: GuestTestPlanStepProps) {
  const [testPlan, setTestPlan] = useState<GeneratedTestPlan | null>(null);
  const [isGenerating, setIsGenerating] = useState(true);

  useEffect(() => {
    // Simulate generation delay for better UX
    const timer = setTimeout(() => {
      const generatedPlan = generateGuestTestPlan(data);
      setTestPlan(generatedPlan);
      onTestPlanGenerated(generatedPlan.config);
      setIsGenerating(false);
    }, 2000);

    return () => clearTimeout(timer);
  }, [data, onTestPlanGenerated]);

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'error';
      case 'medium': return 'warning';
      case 'low': return 'info';
      default: return 'default';
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'high': return <ErrorIcon />;
      case 'medium': return <WarningIcon />;
      case 'low': return <CheckCircleIcon />;
      default: return <BugReportIcon />;
    }
  };

  if (isGenerating) {
    return (
      <Box sx={{ textAlign: 'center', py: 6 }}>
        <SecurityIcon sx={{ fontSize: 64, color: 'primary.main', mb: 2 }} />
        <Typography variant="h5" gutterBottom>
          Generating Your Personalized Security Test Plan
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
          Analyzing your requirements and mapping to security frameworks...
        </Typography>
        <Box sx={{ maxWidth: 400, mx: 'auto', mb: 2 }}>
          <LinearProgress />
        </Box>
        <Typography variant="caption" color="text.secondary">
          This may take a few moments
        </Typography>
      </Box>
    );
  }

  if (!testPlan) {
    return (
      <Alert severity="error">
        Failed to generate test plan. Please try again.
      </Alert>
    );
  }

  return (
    <Box sx={{ maxWidth: '1000px', mx: 'auto' }}>
      <Typography variant="h3" gutterBottom align="center" sx={{ fontWeight: 'bold' }}>
        Your AI Security Testing Plan
      </Typography>
      <Typography variant="h6" gutterBottom align="center" color="text.secondary" sx={{ mb: 1 }}>
        Red team testing for {data.chatbotRole} in {data.industry.join(', ')}
      </Typography>
      <Typography variant="body1" align="center" color="text.secondary" sx={{ mb: 4 }}>
        Comprehensive security testing • Identify vulnerabilities • Generate compliance reports
      </Typography>

      {/* Business Impact Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={4}>
          <Card sx={{ height: '100%', background: 'linear-gradient(135deg, #f3e5f5 0%, #e1bee7 100%)' }}>
            <CardContent sx={{ textAlign: 'center' }}>
              <ComplianceIcon sx={{ fontSize: 40, color: '#7b1fa2', mb: 1 }} />
              <Typography variant="h4" color="#7b1fa2" sx={{ fontWeight: 'bold' }}>
                {testPlan.summary.frameworks.length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Security Frameworks
              </Typography>
              <Typography variant="caption" color="text.secondary">
                OWASP, NIST, MITRE ATLAS
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card sx={{ height: '100%', background: 'linear-gradient(135deg, #fff3e0 0%, #ffcc80 100%)' }}>
            <CardContent sx={{ textAlign: 'center' }}>
              <AssessmentIcon sx={{ fontSize: 40, color: '#f57c00', mb: 1 }} />
              <Typography variant="h4" color="#f57c00" sx={{ fontWeight: 'bold' }}>
                {testPlan.summary.totalTests}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Security Tests
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Comprehensive testing
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card sx={{ height: '100%', background: 'linear-gradient(135deg, #e8f5e8 0%, #c8e6c8 100%)' }}>
            <CardContent sx={{ textAlign: 'center' }}>
              <BugReportIcon sx={{ fontSize: 40, color: '#388e3c', mb: 1 }} />
              <Typography variant="h4" color="#388e3c" sx={{ fontWeight: 'bold' }}>
                Report
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Detailed Results
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Actionable findings
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Framework Coverage */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Testing Framework Coverage
          </Typography>
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            {testPlan.summary.frameworks.map((framework, index) => (
              <Chip
                key={index}
                label={framework}
                color="primary"
                variant="outlined"
                size="small"
              />
            ))}
          </Box>
        </CardContent>
      </Card>

      {/* Security Test Categories */}
      <Typography variant="h5" gutterBottom sx={{ mt: 4, mb: 1, fontWeight: 'bold' }}>
        Security Vulnerabilities We'll Test For
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
        We'll test your AI system against these common security vulnerabilities and provide detailed findings.
      </Typography>

      {testPlan.owaspMapping.map((item, index) => {
        const riskColor = item.priority === 'high' ? '#d32f2f' : item.priority === 'medium' ? '#f57c00' : '#388e3c';
        
        return (
          <Accordion key={item.id} defaultExpanded={index < 2}>
            <AccordionSummary 
              expandIcon={<ExpandMoreIcon />}
              sx={{
                background: `linear-gradient(90deg, ${riskColor}08 0%, ${riskColor}02 100%)`,
                borderLeft: `4px solid ${riskColor}`,
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                <Box sx={{ flexGrow: 1 }}>
                  <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 0.5 }}>
                    {item.name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                    {item.description}
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Chip
                      label={`${item.priority.toUpperCase()} PRIORITY`}
                      sx={{
                        backgroundColor: riskColor,
                        color: 'white',
                        fontWeight: 'bold',
                        fontSize: '0.75rem',
                      }}
                      size="small"
                    />
                    <Badge
                      badgeContent={item.testCount}
                      color="primary"
                      sx={{ ml: 'auto' }}
                    >
                      <AssessmentIcon sx={{ color: riskColor }} />
                    </Badge>
                  </Box>
                </Box>
              </Box>
            </AccordionSummary>
            <AccordionDetails>
              <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 'bold' }}>
                Testing Details:
              </Typography>
              <List dense>
                <ListItem>
                  <ListItemIcon>
                    <CheckCircleIcon color="success" fontSize="small" />
                  </ListItemIcon>
                  <ListItemText 
                    primary={`${item.testCount} security tests`}
                    secondary="Automated vulnerability scanning"
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <CheckCircleIcon color="success" fontSize="small" />
                  </ListItemIcon>
                  <ListItemText 
                    primary={`${item.plugins.length} testing plugins`}
                    secondary="Specialized security testing tools"
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <CheckCircleIcon color="success" fontSize="small" />
                  </ListItemIcon>
                  <ListItemText 
                    primary="Detailed test results"
                    secondary="Comprehensive report with findings and recommendations"
                  />
                </ListItem>
              </List>
            </AccordionDetails>
          </Accordion>
        );
      })}

      {/* Additional Tests */}
      {testPlan.additionalTests.length > 0 && (
        <>
          <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
            Additional Security Tests
          </Typography>
          {testPlan.additionalTests.map((item, index) => (
            <Card key={item.id} sx={{ mb: 2 }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <ShieldIcon sx={{ mr: 1, color: 'success.main' }} />
                  <Typography variant="subtitle1">
                    {item.name}
                  </Typography>
                  <Chip
                    label={`${item.testCount} tests`}
                    color="primary"
                    size="small"
                    sx={{ ml: 'auto' }}
                  />
                </Box>
                <Typography variant="body2" color="text.secondary">
                  {item.description}
                </Typography>
              </CardContent>
            </Card>
          ))}
        </>
      )}

      {/* Testing Summary */}
      <Paper sx={{ p: 4, mt: 4, mb: 3, background: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)', border: '2px solid #e3f2fd' }}>
        <Typography variant="h5" gutterBottom sx={{ fontWeight: 'bold', color: '#1976d2' }}>
          Ready to Test Your AI Security?
        </Typography>
        <Typography variant="body1" sx={{ mb: 2 }}>
          Get comprehensive red team testing results and actionable security insights for your AI system.
        </Typography>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
          <Chip label="Automated testing" color="primary" variant="outlined" />
          <Chip label="Detailed reporting" color="success" variant="outlined" />
          <Chip label="Framework compliance" color="warning" variant="outlined" />
        </Box>
      </Paper>

      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 4 }}>
        <Button 
          onClick={onBack} 
          size="large" 
          disabled={isGenerating}
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
          onClick={onNext}
          size="large"
          startIcon={<SecurityIcon />}
          disabled={isGenerating}
          sx={{
            padding: '12px 32px',
            fontSize: '1.1rem',
            borderRadius: '24px',
            textTransform: 'none',
            background: 'linear-gradient(45deg, #1976d2 30%, #42a5f5 90%)',
            '&:hover': {
              background: 'linear-gradient(45deg, #1565c0 30%, #1e88e5 90%)',
            },
          }}
        >
          Start Security Testing →
        </Button>
      </Box>
    </Box>
  );
}