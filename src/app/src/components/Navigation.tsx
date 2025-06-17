import React, { useState, forwardRef } from 'react';
import type { LinkProps } from 'react-router-dom';
import { Link, useLocation } from 'react-router-dom';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import InfoIcon from '@mui/icons-material/Info';
import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import type { ButtonProps } from '@mui/material/Button';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import Toolbar from '@mui/material/Toolbar';
import Tooltip from '@mui/material/Tooltip';
import { styled } from '@mui/material/styles';
import { useUIStore } from '../stores/uiStore';
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

// Simplified - Red team only
function CreateButton() {
  const location = useLocation();
  const isActive = location.pathname.startsWith('/redteam/setup');

  return (
    <NavButton 
      component={RouterLink} 
      to="/redteam/setup" 
      className={isActive ? 'active' : ''}
    >
      Create Security Test
    </NavButton>
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

  const isActive = ['/test-plans', '/redteam/reports'].some((route) =>
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

  const handleModalToggle = () => setShowInfoModal((prevState) => !prevState);

  if (!isNavbarVisible) {
    return null;
  }

  return (
    <>
      <StyledAppBar position="static" elevation={0}>
        <NavToolbar>
          <NavSection>
            <Logo />
            <NavLink href="/home" label="Home" />
            <CreateButton />
            <ComplianceDropdown />
            <NavLink href="/subscription" label="Subscription" />
            <NavLink href="/model-audit" label="Model Audit" />
          </NavSection>
          <NavSection>
            <IconButton onClick={handleModalToggle} color="inherit">
              <InfoIcon />
            </IconButton>
            <DarkMode onToggleDarkMode={onToggleDarkMode} />
          </NavSection>
        </NavToolbar>
      </StyledAppBar>
      <InfoModal open={showInfoModal} onClose={handleModalToggle} />
    </>
  );
}
