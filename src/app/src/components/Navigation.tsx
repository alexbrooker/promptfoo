import React, { useState, forwardRef } from 'react';
import type { LinkProps } from 'react-router-dom';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import InfoIcon from '@mui/icons-material/Info';
import LogoutIcon from '@mui/icons-material/Logout';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import type { ButtonProps } from '@mui/material/Button';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import Toolbar from '@mui/material/Toolbar';
import Tooltip from '@mui/material/Tooltip';
import Chip from '@mui/material/Chip';
import { styled } from '@mui/material/styles';
import { useUIStore } from '../stores/uiStore';
import { useUserStore } from '../stores/userStore';
import DarkMode from './DarkMode';
import InfoModal from './InfoModal';
import Logo from './Logo';
import './Navigation.css';

// Create a properly typed forwarded ref component for MUI compatibility
const RouterLink = forwardRef<HTMLAnchorElement, LinkProps>((props, ref) => (
  <Link ref={ref} {...props} />
));
RouterLink.displayName = 'RouterLink';

const NavButton = styled(Button)<Partial<ButtonProps> & Partial<LinkProps>>(({ theme }) => ({
  color: theme.palette.text.primary,
  '&:hover': {
    backgroundColor: theme.palette.action.hover,
  },
  '&.active': {
    backgroundColor: theme.palette.action.selected,
  },
}));

const StyledAppBar = styled(AppBar)(({ theme }) => ({
  backgroundColor: theme.palette.background.paper,
  color: theme.palette.text.primary,
  boxShadow: theme.shadows[1],
  marginBottom: theme.spacing(2),
}));

const NavToolbar = styled(Toolbar)({
  justifyContent: 'space-between',
});

const NavSection = styled(Box)({
  display: 'flex',
  alignItems: 'center',
  gap: '1rem',
});

function NavLink({ href, label }: { href: string; label: string }) {
  const location = useLocation();
  const isActive = location.pathname.startsWith(href);

  return (
    <NavButton component={RouterLink} to={href} className={isActive ? 'active' : ''}>
      {label}
    </NavButton>
  );
}

// Create dropdown with both options
function CreateButton() {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);
  const location = useLocation();

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const isActive = ['/redteam/setup', '/redteam/quick-scan'].some((route) =>
    location.pathname.startsWith(route),
  );

  return (
    <>
      <NavButton
        onClick={handleClick}
        endIcon={<ArrowDropDownIcon />}
        className={isActive ? 'active' : ''}
      >
        Create Security Test
      </NavButton>
      <Menu anchorEl={anchorEl} open={open} onClose={handleClose}>
        <MenuItem onClick={handleClose} component={RouterLink} to="/redteam/quick-scan">
          Quick Scan
        </MenuItem>
        <MenuItem onClick={handleClose} component={RouterLink} to="/redteam/setup">
          Full Setup
        </MenuItem>
      </Menu>
    </>
  );
}


function ComplianceDropdown() {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);
  const location = useLocation();

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const isActive = ['/test-plans', '/redteam/reports', '/redteam/datasets'].some((route) =>
    location.pathname.startsWith(route),
  );

  return (
    <>
      <NavButton
        onClick={handleClick}
        endIcon={<ArrowDropDownIcon />}
        className={isActive ? 'active' : ''}
      >
        Compliance
      </NavButton>
      <Menu anchorEl={anchorEl} open={open} onClose={handleClose}>
        <MenuItem onClick={handleClose} component={RouterLink} to="/redteam/datasets">
          My Datasets
        </MenuItem>
        <MenuItem onClick={handleClose} component={RouterLink} to="/test-plans">
          Test Plans
        </MenuItem>
        <MenuItem onClick={handleClose} component={RouterLink} to="/redteam/reports">
          Reports
        </MenuItem>
      </Menu>
    </>
  );
}

export default function Navigation({
  darkMode,
  onToggleDarkMode,
}: {
  darkMode: boolean;
  onToggleDarkMode: () => void;
}) {
  const [showInfoModal, setShowInfoModal] = useState<boolean>(false);
  const isNavbarVisible = useUIStore((state) => state.isNavbarVisible);
  const { user, signOut, onboardingData } = useUserStore();
  const navigate = useNavigate();

  const handleModalToggle = () => setShowInfoModal((prevState) => !prevState);

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/login');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  if (!isNavbarVisible) {
    return null;
  }

  return (
    <>
      <StyledAppBar position="static" elevation={0}>
        <NavToolbar>
          <NavSection>
            <Logo />
            <CreateButton />
            <ComplianceDropdown />
            <NavLink href="/subscription" label="Subscription" />
          </NavSection>
          <NavSection>
            {user && (
              <Tooltip title="Scan Credits">
                <Chip
                  icon={<AccountBalanceWalletIcon />}
                  label={onboardingData.scanCredits || 0}
                  color="primary"
                  variant="outlined"
                  size="small"
                />
              </Tooltip>
            )}
            <IconButton onClick={handleModalToggle} color="inherit">
              <InfoIcon />
            </IconButton>
            <DarkMode onToggleDarkMode={onToggleDarkMode} />
            {user && (
              <Tooltip title="Sign Out">
                <IconButton onClick={handleSignOut} color="inherit">
                  <LogoutIcon />
                </IconButton>
              </Tooltip>
            )}
          </NavSection>
        </NavToolbar>
      </StyledAppBar>
      <InfoModal open={showInfoModal} onClose={handleModalToggle} />
    </>
  );
}
