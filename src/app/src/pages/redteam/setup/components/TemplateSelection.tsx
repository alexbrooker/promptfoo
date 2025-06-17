import React, { useState } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  CardActions,
  Typography,
  Grid,
  Chip,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Alert,
} from '@mui/material';
import {
  CheckCircle,
  Security,
  Speed,
  Business,
  Star,
} from '@mui/icons-material';
import { useToast } from '@app/hooks/useToast';
import { loadTemplate, templateInfo, type TemplateTier } from '../utils/templateLoader';
import type { Config } from '../types';

interface TemplateSelectionProps {
  onTemplateSelected: (config: Config, templateName: string) => void;
  onNext: () => void;
}

export default function TemplateSelection({ onTemplateSelected, onNext }: TemplateSelectionProps) {
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateTier | null>(null);
  const [loading, setLoading] = useState<TemplateTier | null>(null);
  const toast = useToast();

  const handleSelectTemplate = async (tier: TemplateTier) => {
    setLoading(tier);
    try {
      const config = await loadTemplate(tier);
      const info = templateInfo[tier];
      onTemplateSelected(config, `${info.name} Template`);
      setSelectedTemplate(tier);
      toast.showToast(`${info.name} template selected`, 'success');
    } catch (error) {
      console.error('Failed to load template:', error);
      toast.showToast(`Failed to load ${templateInfo[tier].name} template`, 'error');
    } finally {
      setLoading(null);
    }
  };

  const handleNext = () => {
    if (selectedTemplate) {
      onNext();
    }
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Choose Your Security Assessment
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
        Select a professional template designed for comprehensive AI security testing. 
        All templates cover OWASP LLM Top 10, MITRE ATLAS, and EU AI Act compliance requirements.
      </Typography>

      <Alert severity="info" sx={{ mb: 4 }}>
        <Typography variant="body2">
          <strong>Free:</strong> Create and save test plans • <strong>$49:</strong> Quick security scan • <strong>$499:</strong> Comprehensive assessment
        </Typography>
      </Alert>

      <Grid container spacing={3} sx={{ mb: 4 }}>
        {/* Quick Check Template */}
        <Grid item xs={12} md={6}>
          <Card 
            sx={{ 
              height: '100%', 
              display: 'flex', 
              flexDirection: 'column',
              border: selectedTemplate === 'quick' ? '2px solid' : '2px solid transparent',
              borderColor: selectedTemplate === 'quick' ? 'primary.main' : 'transparent',
              position: 'relative',
              cursor: 'pointer',
              '&:hover': {
                boxShadow: 4,
              },
            }}
            onClick={() => handleSelectTemplate('quick')}
          >
            <Chip
              label="Most Popular"
              color="primary"
              size="small"
              icon={<Star />}
              sx={{
                position: 'absolute',
                top: -10,
                left: '50%',
                transform: 'translateX(-50%)',
              }}
            />
            
            <CardContent sx={{ flexGrow: 1, pt: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Speed color="primary" sx={{ mr: 1 }} />
                <Typography variant="h6" component="h3">
                  {templateInfo.quick.name}
                </Typography>
              </Box>
              
              <Typography variant="h4" color="primary" gutterBottom>
                $49
              </Typography>
              
              <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
                {templateInfo.quick.description}
              </Typography>
              
              <Chip 
                label={`~${templateInfo.quick.numTests} tests`} 
                size="small" 
                variant="outlined"
                sx={{ mb: 2 }}
              />
              
              <List dense>
                {templateInfo.quick.features.map((feature, index) => (
                  <ListItem key={index} sx={{ px: 0 }}>
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
            
            <CardActions sx={{ p: 2 }}>
              <Button
                variant={selectedTemplate === 'quick' ? 'contained' : 'outlined'}
                fullWidth
                size="large"
                disabled={loading !== null}
                startIcon={selectedTemplate === 'quick' ? <CheckCircle /> : <Speed />}
              >
                {selectedTemplate === 'quick' ? 'Selected' : 'Select Quick Check'}
              </Button>
            </CardActions>
          </Card>
        </Grid>

        {/* Business Scan Template */}
        <Grid item xs={12} md={6}>
          <Card 
            sx={{ 
              height: '100%', 
              display: 'flex', 
              flexDirection: 'column',
              border: selectedTemplate === 'business' ? '2px solid' : '1px solid',
              borderColor: selectedTemplate === 'business' ? 'secondary.main' : 'divider',
              cursor: 'pointer',
              '&:hover': {
                boxShadow: 4,
              },
            }}
            onClick={() => handleSelectTemplate('business')}
          >
            <CardContent sx={{ flexGrow: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Business color="secondary" sx={{ mr: 1 }} />
                <Typography variant="h6" component="h3">
                  {templateInfo.business.name}
                </Typography>
              </Box>
              
              <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1, mb: 1 }}>
                <Typography variant="h4" color="secondary">
                  $499
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ textDecoration: 'line-through' }}>
                  $999
                </Typography>
                <Chip label="50% OFF" color="error" size="small" />
              </Box>
              
              <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
                {templateInfo.business.description}
              </Typography>
              
              <Chip 
                label={`${templateInfo.business.numTests}+ tests`} 
                size="small" 
                variant="outlined"
                color="secondary"
                sx={{ mb: 2 }}
              />
              
              <List dense>
                {templateInfo.business.features.map((feature, index) => (
                  <ListItem key={index} sx={{ px: 0 }}>
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
            
            <CardActions sx={{ p: 2 }}>
              <Button
                variant={selectedTemplate === 'business' ? 'contained' : 'outlined'}
                color="secondary"
                fullWidth
                size="large"
                disabled={loading !== null}
                startIcon={selectedTemplate === 'business' ? <CheckCircle /> : <Security />}
              >
                {selectedTemplate === 'business' ? 'Selected' : 'Select Business Scan'}
              </Button>
            </CardActions>
          </Card>
        </Grid>
      </Grid>

      <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
        <Box /> {/* Spacer */}
        <Button
          variant="contained"
          onClick={handleNext}
          disabled={!selectedTemplate}
          size="large"
        >
          Continue with {selectedTemplate ? templateInfo[selectedTemplate].name : 'Selected Template'}
        </Button>
      </Box>
    </Box>
  );
}