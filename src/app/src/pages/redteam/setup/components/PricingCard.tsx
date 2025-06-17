import React, { useState } from 'react';
import { useStripe } from '@app/hooks/useStripe';
import { useToast } from '@app/hooks/useToast';
import {
  Box,
  Button,
  Card,
  CardContent,
  CardActions,
  Typography,
  Chip,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  CircularProgress,
  Alert,
} from '@mui/material';
import {
  CheckCircle,
  Security,
  Speed,
  Business,
  PlayArrow,
  Payment,
} from '@mui/icons-material';

interface PricingCardProps {
  tier: 'quick' | 'business';
  configName: string;
  onFreeRun?: () => void;
  isRunning?: boolean;
}

const tierInfo = {
  quick: {
    name: 'Quick Check',
    price: 29,
    originalPrice: 49,
    numTests: '~100',
    features: [
      'Essential security tests',
      'OWASP LLM Top 10 coverage',
      'Prompt injection detection',
      'Basic compliance check',
      'Professional security report',
      'Email delivery',
    ],
    icon: Speed,
    color: 'primary' as const,
  },
  business: {
    name: 'Business Scan',
    price: 499,
    originalPrice: 999,
    numTests: '~2000',
    features: [
      'Comprehensive security tests',
      'OWASP LLM Top 10 + MITRE ATLAS',
      'EU AI Act compliance',
      'Advanced adversarial testing',
      'Detailed vulnerability analysis',
      'Executive summary report',
      'Priority email support',
    ],
    icon: Business,
    color: 'secondary' as const,
  },
};

export default function PricingCard({ tier, configName, onFreeRun, isRunning }: PricingCardProps) {
  const [loading, setLoading] = useState(false);
  const { createCheckoutSession } = useStripe();
  const toast = useToast();
  const info = tierInfo[tier];
  const IconComponent = info.icon;

  const handlePurchaseAndRun = async () => {
    setLoading(true);
    try {
      const planId = tier === 'quick' ? 'quick_check' : 'business_scan';
      await createCheckoutSession(planId, {
        interval: 'one-off',
        name: info.name,
      });
    } catch (error) {
      console.error('Failed to create checkout session:', error);
      toast.showToast('Failed to initiate payment. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card 
      sx={{ 
        height: '100%', 
        display: 'flex', 
        flexDirection: 'column',
        border: tier === 'quick' ? '2px solid' : '1px solid',
        borderColor: tier === 'quick' ? 'primary.main' : 'divider',
        position: 'relative',
      }}
    >
      {tier === 'quick' && (
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
      
      <CardContent sx={{ flexGrow: 1, pt: tier === 'quick' ? 3 : 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <IconComponent color={info.color} sx={{ mr: 1 }} />
          <Typography variant="h6" component="h3">
            {info.name}
          </Typography>
        </Box>
        
        <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1, mb: 1 }}>
          <Typography variant="h4" color={info.color}>
            ${info.price}
          </Typography>
          {info.originalPrice && (
            <>
              <Typography variant="body2" color="text.secondary" sx={{ textDecoration: 'line-through' }}>
                ${info.originalPrice}
              </Typography>
              <Chip label="50% OFF" color="error" size="small" />
            </>
          )}
        </Box>
        
        <Chip 
          label={`${info.numTests} tests`} 
          size="small" 
          variant="outlined"
          color={info.color}
          sx={{ mb: 2 }}
        />
        
        <List dense>
          {info.features.map((feature, index) => (
            <ListItem key={index} sx={{ px: 0, py: 0.5 }}>
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

        {configName && (
          <Alert severity="info" sx={{ mt: 2, mb: 2 }}>
            <Typography variant="body2">
              <strong>Test Plan:</strong> {configName}
            </Typography>
          </Alert>
        )}
      </CardContent>
      
      <CardActions sx={{ p: 2, flexDirection: 'column', gap: 1 }}>
        {onFreeRun && (
          <Button
            variant="outlined"
            fullWidth
            startIcon={<PlayArrow />}
            onClick={onFreeRun}
            disabled={isRunning || loading}
          >
            {isRunning ? 'Running...' : 'Preview (Free)'}
          </Button>
        )}
        <Button
          variant="contained"
          color={info.color}
          fullWidth
          size="large"
          onClick={handlePurchaseAndRun}
          disabled={loading || isRunning}
          startIcon={loading ? <CircularProgress size={16} /> : <Payment />}
        >
          {loading ? 'Processing...' : `Pay & Run ${info.name}`}
        </Button>
      </CardActions>
    </Card>
  );
}