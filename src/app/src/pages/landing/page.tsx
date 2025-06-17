import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Chip,
  Paper,
} from '@mui/material';
import {
  Security,
  Speed,
  Business,
  CheckCircle,
  PlayArrow,
  Shield,
  Verified,
  TrendingUp,
} from '@mui/icons-material';

export default function LandingPage() {
  const navigate = useNavigate();

  const features = [
    {
      icon: Shield,
      title: 'OWASP LLM Top 10 Coverage',
      description: 'Complete assessment against the most critical AI security risks',
    },
    {
      icon: Verified,
      title: 'EU AI Act Compliance',
      description: 'Ensure your AI systems meet regulatory requirements',
    },
    {
      icon: TrendingUp,
      title: 'MITRE ATLAS Framework',
      description: 'Advanced adversarial testing based on industry standards',
    },
  ];

  const pricingPlans = [
    {
      name: 'Quick Check',
      price: '$49',
      description: 'Essential security assessment',
      tests: '~100 tests',
      features: [
        'OWASP LLM Top 10 coverage',
        'Prompt injection detection',
        'Basic compliance check',
        'Professional security report',
        'Email delivery',
      ],
      icon: Speed,
      color: 'primary' as const,
      popular: true,
    },
    {
      name: 'Business Scan',
      price: '$499',
      originalPrice: '$999',
      description: 'Comprehensive security analysis',
      tests: '~2000 tests',
      features: [
        'Everything in Quick Check',
        'MITRE ATLAS coverage',
        'EU AI Act compliance',
        'Advanced adversarial testing',
        'Executive summary report',
        'Priority email support',
      ],
      icon: Business,
      color: 'secondary' as const,
    },
    {
      name: 'Monthly Monitoring',
      price: '$750',
      interval: '/month',
      description: 'Continuous security monitoring',
      tests: 'Automated scans',
      features: [
        'Everything in Business Scan',
        'Automated monthly scans',
        'Email report delivery',
        'Continuous monitoring',
        'Priority support',
      ],
      icon: Security,
      color: 'success' as const,
    },
  ];

  return (
    <Box>
      {/* Hero Section */}
      <Container maxWidth="lg" sx={{ py: 8 }}>
        <Box textAlign="center" sx={{ mb: 6 }}>
          <Typography variant="h2" component="h1" gutterBottom sx={{ fontWeight: 'bold' }}>
            Secure Your AI in Minutes
          </Typography>
          <Typography variant="h5" color="text.secondary" sx={{ mb: 4, maxWidth: '800px', mx: 'auto' }}>
            Professional AI security testing with comprehensive vulnerability assessment. 
            Get instant compliance reports for OWASP LLM Top 10, MITRE ATLAS, and EU AI Act.
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Button
              variant="contained"
              size="large"
              onClick={() => navigate('/redteam/setup')}
              startIcon={<PlayArrow />}
              sx={{ px: 4, py: 1.5, fontSize: '1.1rem' }}
            >
              Start Free Security Assessment
            </Button>
            <Button
              variant="outlined"
              size="large"
              onClick={() => navigate('/test-plans')}
              sx={{ px: 4, py: 1.5 }}
            >
              View Test Plans
            </Button>
          </Box>
        </Box>

        {/* Features Grid */}
        <Grid container spacing={4} sx={{ mb: 8 }}>
          {features.map((feature, index) => {
            const IconComponent = feature.icon;
            return (
              <Grid item xs={12} md={4} key={index}>
                <Card sx={{ height: '100%', textAlign: 'center' }}>
                  <CardContent sx={{ p: 3 }}>
                    <IconComponent color="primary" sx={{ fontSize: 48, mb: 2 }} />
                    <Typography variant="h6" gutterBottom>
                      {feature.title}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {feature.description}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            );
          })}
        </Grid>
      </Container>

      {/* Pricing Section */}
      <Box sx={{ bgcolor: 'grey.50', py: 8 }}>
        <Container maxWidth="lg">
          <Typography variant="h3" textAlign="center" gutterBottom sx={{ mb: 6 }}>
            Choose Your Security Assessment
          </Typography>
          
          <Grid container spacing={3} justifyContent="center">
            {pricingPlans.map((plan, index) => {
              const IconComponent = plan.icon;
              return (
                <Grid item xs={12} md={4} key={index}>
                  <Card 
                    sx={{ 
                      height: '100%', 
                      display: 'flex', 
                      flexDirection: 'column',
                      border: plan.popular ? '2px solid' : '1px solid',
                      borderColor: plan.popular ? 'primary.main' : 'divider',
                      position: 'relative',
                    }}
                  >
                    {plan.popular && (
                      <Chip
                        label="Most Popular"
                        color="primary"
                        size="small"
                        sx={{
                          position: 'absolute',
                          top: -10,
                          left: '50%',
                          transform: 'translateX(-50%)',
                        }}
                      />
                    )}
                    
                    <CardContent sx={{ flexGrow: 1, p: 3, pt: plan.popular ? 4 : 3 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                        <IconComponent color={plan.color} sx={{ mr: 1 }} />
                        <Typography variant="h6" component="h3">
                          {plan.name}
                        </Typography>
                      </Box>
                      
                      <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1, mb: 1 }}>
                        <Typography variant="h4" color={plan.color}>
                          {plan.price}
                        </Typography>
                        {plan.interval && (
                          <Typography variant="body2" color="text.secondary">
                            {plan.interval}
                          </Typography>
                        )}
                        {plan.originalPrice && (
                          <>
                            <Typography variant="body2" color="text.secondary" sx={{ textDecoration: 'line-through' }}>
                              {plan.originalPrice}
                            </Typography>
                            <Chip label="50% OFF" color="error" size="small" />
                          </>
                        )}
                      </Box>
                      
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        {plan.description}
                      </Typography>
                      
                      <Chip 
                        label={plan.tests} 
                        size="small" 
                        variant="outlined"
                        color={plan.color}
                        sx={{ mb: 2 }}
                      />
                      
                      <List dense>
                        {plan.features.map((feature, idx) => (
                          <ListItem key={idx} sx={{ px: 0, py: 0.25 }}>
                            <ListItemIcon sx={{ minWidth: 32 }}>
                              <CheckCircle color="success" fontSize="small" />
                            </ListItemIcon>
                            <ListItemText
                              primary={feature}
                              primaryTypographyProps={{ variant: 'body2' }}
                            />
                          </ListItem>
                        ))}
                      </List>
                    </CardContent>
                    
                    <Box sx={{ p: 3, pt: 0 }}>
                      <Button
                        variant={plan.popular ? 'contained' : 'outlined'}
                        color={plan.color}
                        fullWidth
                        size="large"
                        onClick={() => navigate('/redteam/setup')}
                      >
                        Get Started
                      </Button>
                    </Box>
                  </Card>
                </Grid>
              );
            })}
          </Grid>
        </Container>
      </Box>

      {/* CTA Section */}
      <Container maxWidth="lg" sx={{ py: 8 }}>
        <Paper elevation={2} sx={{ p: 6, textAlign: 'center' }}>
          <Typography variant="h4" gutterBottom>
            Start Your AI Security Assessment Today
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 4, maxWidth: '600px', mx: 'auto' }}>
            Join companies securing their AI systems with professional security testing. 
            Create your test plan for free and run comprehensive assessments in minutes.
          </Typography>
          <Button
            variant="contained"
            size="large"
            onClick={() => navigate('/redteam/setup')}
            startIcon={<PlayArrow />}
            sx={{ px: 4, py: 1.5, fontSize: '1.1rem' }}
          >
            Create Free Test Plan
          </Button>
        </Paper>
      </Container>
    </Box>
  );
}