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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
} from '@mui/material';
import {
  CheckCircle,
  Security,
  Speed,
  Business,
} from '@mui/icons-material';
import { useToast } from '@app/hooks/useToast';
import { loadTemplate, templateInfo, type TemplateTier } from '../utils/templateLoader';
import type { Config } from '../types';

interface TemplateSelectorProps {
  onTemplateSelected: (config: Config, templateName: string) => void;
  onClose: () => void;
  open: boolean;
}

export default function TemplateSelector({ onTemplateSelected, onClose, open }: TemplateSelectorProps) {
  const [loading, setLoading] = useState<TemplateTier | null>(null);
  const toast = useToast();

  const handleLoadTemplate = async (tier: TemplateTier) => {
    setLoading(tier);
    try {
      const config = await loadTemplate(tier);
      const info = templateInfo[tier];
      onTemplateSelected(config, `${info.name} Template`);
      toast.showToast(`${info.name} template loaded successfully`, 'success');
      onClose();
    } catch (error) {
      console.error('Failed to load template:', error);
      toast.showToast(
        `Failed to load ${templateInfo[tier].name} template`,
        'error'
      );
    } finally {
      setLoading(null);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
      <DialogTitle>
        <Typography variant="h5" component="div">
          Choose Your Security Scan Template
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          Pre-configured templates designed for different security assessment needs
        </Typography>
      </DialogTitle>
      
      <DialogContent>
        <Grid container spacing={3} sx={{ mt: 1 }}>
          {/* Quick Check Template */}
          <Grid item xs={12} md={6}>
            <Card 
              sx={{ 
                height: '100%', 
                display: 'flex', 
                flexDirection: 'column',
                border: '2px solid',
                borderColor: 'primary.main',
                position: 'relative',
              }}
            >
              <Chip
                label="Popular Choice"
                color="primary"
                size="small"
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
                  {templateInfo.quick.price}
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
                  variant="contained"
                  fullWidth
                  size="large"
                  onClick={() => handleLoadTemplate('quick')}
                  disabled={loading !== null}
                  startIcon={loading === 'quick' ? <CircularProgress size={16} /> : <Speed />}
                >
                  {loading === 'quick' ? 'Loading...' : 'Load Quick Check Template'}
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
                border: '1px solid',
                borderColor: 'divider',
              }}
            >
              <CardContent sx={{ flexGrow: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Business color="secondary" sx={{ mr: 1 }} />
                  <Typography variant="h6" component="h3">
                    {templateInfo.business.name}
                  </Typography>
                </Box>
                
                <Typography variant="h4" color="secondary" gutterBottom>
                  {templateInfo.business.price}
                </Typography>
                
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
                  variant="outlined"
                  fullWidth
                  size="large"
                  onClick={() => handleLoadTemplate('business')}
                  disabled={loading !== null}
                  startIcon={loading === 'business' ? <CircularProgress size={16} /> : <Security />}
                >
                  {loading === 'business' ? 'Loading...' : 'Load Business Template'}
                </Button>
              </CardActions>
            </Card>
          </Grid>
        </Grid>
      </DialogContent>
      
      <DialogActions>
        <Button onClick={onClose}>
          Cancel
        </Button>
      </DialogActions>
    </Dialog>
  );
}