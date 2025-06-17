import React from 'react';
import CrispChat from '@app/components/CrispChat';
import Report from './components/Report';
import ReportIndex from './components/ReportIndex';

export default function ReportPage() {
  const searchParams = new URLSearchParams(window.location.search);
  const evalId = searchParams.get('evalId');

  return (
    <>
      {evalId ? <Report /> : <ReportIndex />}
      <CrispChat />
    </>
  );
}
