import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Container } from '@mui/material';
import RedteamReportsDataGrid from './components/RedteamReportsDataGrid';

export default function RedteamReportsPage() {
  const navigate = useNavigate();

  useEffect(() => {
    document.title = 'Red Team Reports | promptfoo';
  }, []);

  return (
    <Container maxWidth="xl" sx={{ py: 3 }}>
      <RedteamReportsDataGrid 
        onReportSelected={(evalId) => navigate(`/report?evalId=${evalId}`)} 
        showUtilityButtons 
      />
    </Container>
  );
}