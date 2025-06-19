import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Avatar,
  Typography,
  Button,
  Menu,
  MenuItem,
  Divider,
  Chip,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  Settings,
  Logout,
  AccountBalanceWallet,
  KeyboardArrowUp,
  CreditCard,
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import { useUserStore } from '../../stores/userStore';
import { useSidebarStore } from '../../stores/sidebarStore';

const UserContainer = styled(Box)(({ theme }) => ({
  padding: theme.spacing(1),
  borderTop: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)'}`,
  backgroundColor: theme.palette.mode === 'dark' 
    ? 'rgba(255, 255, 255, 0.02)' 
    : 'rgba(0, 0, 0, 0.02)',
}));

const UserButton = styled(Button)(({ theme }) => ({
  width: '100%',
  justifyContent: 'flex-start',
  padding: theme.spacing(1.5),
  borderRadius: theme.spacing(1),
  textTransform: 'none',
  color: theme.palette.text.primary,
  
  '&:hover': {
    backgroundColor: theme.palette.mode === 'dark' 
      ? 'rgba(255, 255, 255, 0.08)' 
      : 'rgba(0, 0, 0, 0.04)',
  },
}));

const UserInfo = styled(Box)({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'flex-start',
  marginLeft: 12,
  minWidth: 0,
  flex: 1,
});

const CreditsChip = styled(Chip)(({ theme }) => ({
  height: 20,
  fontSize: '0.75rem',
  fontWeight: 600,
  marginTop: theme.spacing(0.5),
  
  '& .MuiChip-icon': {
    fontSize: 14,
  },
}));

export default function UserProfile() {
  const navigate = useNavigate();
  const { user, signOut, onboardingData } = useUserStore();
  const { isExpanded, isMobile, closeOverlay } = useSidebarStore();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  
  const showFullProfile = isExpanded || isMobile;
  const menuOpen = Boolean(anchorEl);
  
  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };
  
  const handleMenuClose = () => {
    setAnchorEl(null);
  };
  
  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/login');
      if (isMobile) {
        closeOverlay();
      }
    } catch (error) {
      console.error('Error signing out:', error);
    }
    handleMenuClose();
  };
  
  const handleNavigation = (path: string) => {
    navigate(path);
    if (isMobile) {
      closeOverlay();
    }
    handleMenuClose();
  };
  
  if (!user) {
    return null;
  }
  
  const userName = onboardingData.name || user.email?.split('@')[0] || 'User';
  const userEmail = user.email || '';
  const scanCredits = onboardingData.scanCredits || 0;

  return (
    <UserContainer>
      {showFullProfile ? (
        <>
          <UserButton
            onClick={handleMenuOpen}
            endIcon={<KeyboardArrowUp sx={{ transform: menuOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }} />}
          >
            <Avatar
              sx={{ 
                width: 36, 
                height: 36,
                bgcolor: 'primary.main',
                fontSize: '0.875rem',
                fontWeight: 600,
              }}
            >
              {userName.charAt(0).toUpperCase()}
            </Avatar>
            <UserInfo>
              <Typography 
                variant="body2" 
                fontWeight="600"
                sx={{ 
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  maxWidth: 140,
                }}
              >
                {userName}
              </Typography>
              <Typography 
                variant="caption" 
                color="text.secondary"
                sx={{ 
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  maxWidth: 140,
                }}
              >
                {userEmail}
              </Typography>
              <CreditsChip
                icon={<AccountBalanceWallet />}
                label={`${scanCredits} credits`}
                color="primary"
                variant="outlined"
                size="small"
              />
            </UserInfo>
          </UserButton>
        </>
      ) : (
        <Tooltip title={`${userName} (${scanCredits} credits)`} placement="right">
          <IconButton 
            onClick={handleMenuOpen}
            sx={{ 
              width: '100%',
              height: 48,
              borderRadius: 1,
            }}
          >
            <Avatar
              sx={{ 
                width: 32, 
                height: 32,
                bgcolor: 'primary.main',
                fontSize: '0.75rem',
                fontWeight: 600,
              }}
            >
              {userName.charAt(0).toUpperCase()}
            </Avatar>
          </IconButton>
        </Tooltip>
      )}
      
      <Menu
        anchorEl={anchorEl}
        open={menuOpen}
        onClose={handleMenuClose}
        anchorOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'bottom',
          horizontal: 'left',
        }}
        PaperProps={{
          sx: {
            minWidth: 200,
            mt: -1,
          },
        }}
      >
        <Box sx={{ px: 2, py: 1.5 }}>
          <Typography variant="body2" fontWeight="600">
            {userName}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {userEmail}
          </Typography>
          <CreditsChip
            icon={<AccountBalanceWallet />}
            label={`${scanCredits} credits`}
            color="primary"
            variant="outlined"
            size="small"
            sx={{ mt: 1 }}
          />
        </Box>
        
        <Divider />
        
        <MenuItem onClick={() => handleNavigation('/subscription')}>
          <CreditCard sx={{ mr: 2 }} />
          Subscription
        </MenuItem>
        
        <MenuItem onClick={() => handleNavigation('/settings')}>
          <Settings sx={{ mr: 2 }} />
          Settings
        </MenuItem>
        
        <Divider />
        
        <MenuItem onClick={handleSignOut}>
          <Logout sx={{ mr: 2 }} />
          Sign Out
        </MenuItem>
      </Menu>
    </UserContainer>
  );
}