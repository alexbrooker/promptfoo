import React, { forwardRef } from 'react';
import type { LinkProps } from 'react-router-dom';
import { Link, useLocation } from 'react-router-dom';
import {
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Tooltip,
  Box,
  Badge,
} from '@mui/material';
import { styled } from '@mui/material/styles';
import { useSidebarStore } from '../../stores/sidebarStore';

interface SidebarItemProps {
  icon: React.ReactNode;
  label: string;
  href?: string;
  onClick?: () => void;
  badge?: number | string;
  isSubItem?: boolean;
  disabled?: boolean;
}

const RouterLink = forwardRef<HTMLAnchorElement, LinkProps>((props, ref) => (
  <Link ref={ref} {...props} />
));
RouterLink.displayName = 'RouterLink';

const StyledListItemButton = styled(ListItemButton)<{ 
  active?: boolean; 
  isSubItem?: boolean;
  isExpanded?: boolean;
}>(({ theme, active, isSubItem, isExpanded }) => ({
  minHeight: isSubItem ? 40 : 48,
  paddingLeft: isSubItem ? (isExpanded ? theme.spacing(4) : theme.spacing(2)) : theme.spacing(2),
  paddingRight: theme.spacing(2),
  margin: theme.spacing(0.5, 1),
  borderRadius: theme.spacing(1),
  transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
  position: 'relative',
  overflow: 'hidden',
  
  '&:hover': {
    backgroundColor: theme.palette.mode === 'dark' 
      ? 'rgba(255, 255, 255, 0.08)' 
      : 'rgba(0, 0, 0, 0.04)',
    transform: 'translateX(2px)',
  },
  
  '&:active': {
    transform: 'translateX(1px)',
  },
  
  ...(active && {
    backgroundColor: theme.palette.primary.main + '15',
    color: theme.palette.primary.main,
    fontWeight: 600,
    
    '&::before': {
      content: '""',
      position: 'absolute',
      left: 0,
      top: '50%',
      transform: 'translateY(-50%)',
      width: 3,
      height: '60%',
      backgroundColor: theme.palette.primary.main,
      borderRadius: '0 2px 2px 0',
    },
    
    '&:hover': {
      backgroundColor: theme.palette.primary.main + '20',
    },
  }),
}));

const StyledListItemIcon = styled(ListItemIcon)<{ isExpanded?: boolean }>(({ theme, isExpanded }) => ({
  minWidth: isExpanded ? 40 : 24,
  transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
  color: 'inherit',
  
  '& .MuiSvgIcon-root': {
    fontSize: 20,
  },
}));

const StyledListItemText = styled(ListItemText)(({ theme }) => ({
  '& .MuiListItemText-primary': {
    fontSize: '0.875rem',
    fontWeight: 500,
    lineHeight: 1.2,
  },
}));

export default function SidebarItem({
  icon,
  label,
  href,
  onClick,
  badge,
  isSubItem = false,
  disabled = false,
}: SidebarItemProps) {
  const location = useLocation();
  const { isExpanded, isMobile, closeOverlay } = useSidebarStore();
  
  const isActive = href ? location.pathname.startsWith(href) : false;
  const showTooltip = !isExpanded && !isMobile;
  const showText = isExpanded || isMobile;
  
  const handleClick = () => {
    if (onClick) {
      onClick();
    }
    if (isMobile) {
      closeOverlay();
    }
  };

  const content = (
    <StyledListItemButton
      active={isActive}
      isSubItem={isSubItem}
      isExpanded={showText}
      onClick={handleClick}
      disabled={disabled}
      component={href ? RouterLink : 'div'}
      to={href}
      sx={{
        justifyContent: showText ? 'flex-start' : 'center',
      }}
    >
      <StyledListItemIcon isExpanded={showText}>
        {badge ? (
          <Badge 
            badgeContent={badge} 
            color="primary" 
            variant={typeof badge === 'string' ? 'dot' : 'standard'}
            sx={{
              '& .MuiBadge-badge': {
                fontSize: '0.625rem',
                height: 16,
                minWidth: 16,
              },
            }}
          >
            {icon}
          </Badge>
        ) : (
          icon
        )}
      </StyledListItemIcon>
      
      {showText && (
        <StyledListItemText 
          primary={label}
          sx={{
            opacity: showText ? 1 : 0,
            transition: 'opacity 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
          }}
        />
      )}
    </StyledListItemButton>
  );

  return (
    <ListItem disablePadding>
      {showTooltip ? (
        <Tooltip 
          title={label} 
          placement="right"
          enterDelay={500}
          leaveDelay={0}
        >
          <Box sx={{ width: '100%' }}>
            {content}
          </Box>
        </Tooltip>
      ) : (
        content
      )}
    </ListItem>
  );
}