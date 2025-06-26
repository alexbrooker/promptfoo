import React, { useEffect, useState, useCallback } from 'react';
import {
  Drawer,
  Box,
  IconButton,
  List,
  useTheme,
  useMediaQuery,
  Backdrop,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Security,
  Speed,
  Settings as SettingsIcon,
  Assessment,
  Description,
  Help,
  DarkMode,
  LightMode,
  Dataset,
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import { useSidebarStore } from '../../stores/sidebarStore';
import { useUserStore } from '../../stores/userStore';
import SidebarItem from './SidebarItem';
import SidebarSection from './SidebarSection';
import UserProfile from './UserProfile';
import Logo from '../Logo';

const SIDEBAR_WIDTH_COLLAPSED = 64;
const SIDEBAR_WIDTH_EXPANDED = 280;

const SidebarContainer = styled(Box)(({ theme }) => ({
  height: '100vh',
  display: 'flex',
  flexDirection: 'column',
  backgroundColor: theme.palette.background.paper,
  borderRight: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)'}`,
  position: 'relative',
}));

const SidebarHeader = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  padding: theme.spacing(1),
  minHeight: 64,
  borderBottom: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)'}`,
}));

const MenuButton = styled(IconButton)(({ theme }) => ({
  width: 40,
  height: 40,
  borderRadius: theme.spacing(1),
  transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
  
  '&:hover': {
    backgroundColor: theme.palette.mode === 'dark' 
      ? 'rgba(255, 255, 255, 0.08)' 
      : 'rgba(0, 0, 0, 0.04)',
    transform: 'scale(1.05)',
  },
}));

const LogoContainer = styled(Box)(({ theme }) => ({
  marginLeft: theme.spacing(1),
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  overflow: 'hidden',
}));

const SidebarContent = styled(Box)({
  flex: 1,
  display: 'flex',
  flexDirection: 'column',
  overflow: 'hidden',
});

const NavigationList = styled(List)({
  flex: 1,
  paddingTop: 8,
  paddingBottom: 8,
  overflow: 'auto',
  
  '&::-webkit-scrollbar': {
    width: 4,
  },
  
  '&::-webkit-scrollbar-track': {
    background: 'transparent',
  },
  
  '&::-webkit-scrollbar-thumb': {
    background: 'rgba(0, 0, 0, 0.2)',
    borderRadius: 2,
  },
  
  '&::-webkit-scrollbar-thumb:hover': {
    background: 'rgba(0, 0, 0, 0.3)',
  },
});

export default function Sidebar() {
  const theme = useTheme();
  const isMobileScreen = useMediaQuery(theme.breakpoints.down('md'));
  const prefersDarkMode = useMediaQuery('(prefers-color-scheme: dark)');
  const [darkMode, setDarkMode] = useState<boolean | null>(null);
  const { user } = useUserStore();
  const { 
    isExpanded, 
    isMobile, 
    isOverlayOpen, 
    toggleExpanded, 
    setMobile, 
    closeOverlay 
  } = useSidebarStore();

  // Dark mode management
  useEffect(() => {
    const savedMode = localStorage.getItem('darkMode');
    setDarkMode(savedMode === null ? prefersDarkMode : savedMode === 'true');
  }, [prefersDarkMode]);

  const toggleDarkMode = useCallback(() => {
    setDarkMode((prevMode) => {
      const newMode = !prevMode;
      localStorage.setItem('darkMode', String(newMode));
      // Reload the page to apply theme changes
      window.location.reload();
      return newMode;
    });
  }, []);

  // Handle responsive behavior
  useEffect(() => {
    setMobile(isMobileScreen);
  }, [isMobileScreen, setMobile]);

  const sidebarWidth = isExpanded ? SIDEBAR_WIDTH_EXPANDED : SIDEBAR_WIDTH_COLLAPSED;
  const showExpanded = isExpanded || isMobile;

  const sidebarContent = (
    <SidebarContainer>
      <SidebarHeader>
        <MenuButton 
          onClick={toggleExpanded}
          color="inherit"
        >
          <MenuIcon />
        </MenuButton>
        
        {showExpanded && (
          <LogoContainer>
            <Logo showText={true} />
          </LogoContainer>
        )}
      </SidebarHeader>

      <SidebarContent>
        <NavigationList>
          <SidebarSection title="Security Testing">
            <SidebarItem
              icon={<Speed />}
              label="Quick Scan"
              href="/redteam/quick-scan"
            />
            <SidebarItem
              icon={<Security />}
              label="Full Setup"
              href="/redteam/setup"
            />
          </SidebarSection>

          <SidebarSection title="Compliance" divider>
            <SidebarItem
              icon={<Description />}
              label="Plans"
              href="/test-plans"
            />
            <SidebarItem
              icon={<Dataset />}
              label="Specs"
              href="/redteam/datasets"
            />
            <SidebarItem
              icon={<Assessment />}
              label="Reports"
              href="/redteam/reports"
            />
          </SidebarSection>

          <SidebarSection title="Account" divider>
            <SidebarItem
              icon={<SettingsIcon />}
              label="Settings"
              href="/settings"
            />
            <SidebarItem
              icon={darkMode ? <LightMode /> : <DarkMode />}
              label={darkMode ? "Light Mode" : "Dark Mode"}
              onClick={toggleDarkMode}
            />
            <SidebarItem
              icon={<Help />}
              label="Help & Support"
              href="/help"
            />
          </SidebarSection>
        </NavigationList>

        {user && <UserProfile />}
      </SidebarContent>
    </SidebarContainer>
  );

  if (isMobile) {
    return (
      <>
        <Drawer
          anchor="left"
          open={isOverlayOpen}
          onClose={closeOverlay}
          variant="temporary"
          ModalProps={{
            keepMounted: true, // Better open performance on mobile
          }}
          PaperProps={{
            sx: {
              width: SIDEBAR_WIDTH_EXPANDED,
              border: 'none',
              boxShadow: theme.shadows[8],
            },
          }}
        >
          {sidebarContent}
        </Drawer>
        
        <Backdrop
          open={isOverlayOpen}
          onClick={closeOverlay}
          sx={{ 
            zIndex: theme.zIndex.drawer - 1,
            backgroundColor: 'rgba(0, 0, 0, 0.3)',
          }}
        />
      </>
    );
  }

  return (
    <Drawer
      variant="permanent"
      anchor="left"
      PaperProps={{
        sx: {
          width: sidebarWidth,
          transition: theme.transitions.create('width', {
            easing: theme.transitions.easing.easeInOut,
            duration: theme.transitions.duration.standard,
          }),
          border: 'none',
          position: 'relative',
          height: '100vh',
        },
      }}
    >
      {sidebarContent}
    </Drawer>
  );
}