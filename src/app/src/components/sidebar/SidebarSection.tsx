import React from 'react';
import {
  Box,
  Typography,
  Divider,
  Collapse,
} from '@mui/material';
import { styled } from '@mui/material/styles';
import { useSidebarStore } from '../../stores/sidebarStore';

interface SidebarSectionProps {
  title?: string;
  children: React.ReactNode;
  divider?: boolean;
  collapsible?: boolean;
  defaultExpanded?: boolean;
}

const SectionTitle = styled(Typography)(({ theme }) => ({
  fontSize: '0.75rem',
  fontWeight: 600,
  letterSpacing: '0.5px',
  textTransform: 'uppercase',
  color: theme.palette.text.secondary,
  padding: theme.spacing(1, 2, 0.5, 2),
  margin: theme.spacing(1, 0, 0, 0),
  transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
}));

const SectionDivider = styled(Divider)(({ theme }) => ({
  margin: theme.spacing(1, 2),
  borderColor: theme.palette.mode === 'dark' 
    ? 'rgba(255, 255, 255, 0.08)' 
    : 'rgba(0, 0, 0, 0.08)',
}));

const SectionContainer = styled(Box)(({ theme }) => ({
  '& + &': {
    marginTop: theme.spacing(1),
  },
}));

export default function SidebarSection({
  title,
  children,
  divider = false,
  collapsible = false,
  defaultExpanded = true,
}: SidebarSectionProps) {
  const { isExpanded, isMobile } = useSidebarStore();
  const [sectionExpanded, setSectionExpanded] = React.useState(defaultExpanded);
  
  const showTitle = (isExpanded || isMobile) && title;
  const showContent = !collapsible || sectionExpanded;

  return (
    <SectionContainer>
      {divider && <SectionDivider />}
      
      {showTitle && (
        <SectionTitle 
          variant="overline"
          onClick={collapsible ? () => setSectionExpanded(!sectionExpanded) : undefined}
          sx={{
            cursor: collapsible ? 'pointer' : 'default',
            '&:hover': collapsible ? {
              color: 'text.primary',
            } : {},
          }}
        >
          {title}
        </SectionTitle>
      )}
      
      <Collapse in={showContent} timeout={200}>
        <Box>
          {children}
        </Box>
      </Collapse>
    </SectionContainer>
  );
}