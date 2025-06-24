import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  Typography,
  Container,
  Card,
  CardContent,
} from '@mui/material';
import {
  Email as EmailIcon,
  Login as LoginIcon,
} from '@mui/icons-material';

export default function EmailVerificationPage() {
  const navigate = useNavigate();

  const handleGoToLogin = () => {
    navigate('/login');
  };

  return (
    <Container maxWidth="sm">
      <Box sx={{ 
        minHeight: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        py: 4 
      }}>
        <Card sx={{ width: '100%', textAlign: 'center' }}>
          <CardContent sx={{ p: 4 }}>
            <EmailIcon sx={{ 
              fontSize: 80, 
              color: 'primary.main', 
              mb: 3 
            }} />
            
            <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold' }}>
              Check Your Email
            </Typography>
            
            <Typography variant="h6" color="text.secondary" sx={{ mb: 4 }}>
              We've sent you a verification link to complete your account setup
            </Typography>
            
            <Typography variant="body1" sx={{ mb: 4, color: 'text.secondary' }}>
              Please check your email and click the verification link to activate your account. 
              Once verified, you can log in and access your personalized security testing plan.
            </Typography>
            
            <Button
              variant="contained"
              onClick={handleGoToLogin}
              size="large"
              startIcon={<LoginIcon />}
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
              Go to Login
            </Button>
            
            <Typography variant="caption" color="text.secondary" sx={{ mt: 3, display: 'block' }}>
              Didn't receive the email? Check your spam folder or contact support.
            </Typography>
          </CardContent>
        </Card>
      </Box>
    </Container>
  );
}