import React, { useEffect } from 'react';
import {
  createBrowserRouter,
  createRoutesFromElements,
  Navigate,
  Route,
  RouterProvider,
  useLocation,
  Outlet,
} from 'react-router-dom';
import PageShell from './components/PageShell';
import { ProtectedRoute } from './components/ProtectedRoute';
import { ToastProvider } from './contexts/ToastContext';
import { UserProvider } from './contexts/UserContext';
import { useTelemetry } from './hooks/useTelemetry';
import { useUserInitialization } from './hooks/useUserInitialization';
import DatasetsPage from './pages/datasets/page';
import EvalCreatorPage from './pages/eval-creator/page';
import EvalPage from './pages/eval/page';
import EvalsIndexPage from './pages/evals/page';
import HistoryPage from './pages/history/page';
import LauncherPage from './pages/launcher/page';
import LoginPage from './pages/login';
import OnboardingPage from './pages/onboarding/page';
import PromptsPage from './pages/prompts/page';
import ReportPage from './pages/redteam/report/page';
import RedteamReportsPage from './pages/redteam/reports/page';
import RedteamSetupPage from './pages/redteam/setup/page';
import SubscriptionPage from './pages/subscription/page';
import SubscriptionSuccessPage from './pages/subscription/success';
import TestPlansPage from './pages/test-plans/page';
import LandingPage from './pages/landing/page';

const basename = import.meta.env.VITE_PUBLIC_BASENAME || '';

function TelemetryTracker() {
  const location = useLocation();
  const { recordEvent } = useTelemetry();

  useEffect(() => {
    recordEvent('webui_page_view', { path: location.pathname });
  }, [location, recordEvent]);

  return <Outlet />;
}

const router = createBrowserRouter(
  createRoutesFromElements(
    <>
      {import.meta.env.VITE_PROMPTFOO_LAUNCHER && (
        <Route path="/launcher" element={<LauncherPage />} />
      )}
      <Route path="/" element={<PageShell />}>
        <Route element={<TelemetryTracker />}>
          <Route path="/login" element={<LoginPage />} />
          <Route
            element={
              <ProtectedRoute>
                <Outlet />
              </ProtectedRoute>
            }
          >
            <Route
              index
              element={
                <Navigate
                  to={import.meta.env.VITE_PROMPTFOO_LAUNCHER ? '/launcher' : '/home'}
                  replace
                />
              }
            />
            <Route path="/home" element={<LandingPage />} />
            <Route path="/redteam" element={<Navigate to="/redteam/setup" replace />} />
            <Route path="/redteam/setup" element={<RedteamSetupPage />} />
            <Route path="/redteam/reports" element={<RedteamReportsPage />} />
            <Route path="/report" element={<ReportPage />} />
            <Route path="/setup" element={<EvalCreatorPage />} />
            <Route path="/subscription" element={<SubscriptionPage />} />
            <Route path="/subscription/success" element={<SubscriptionSuccessPage />} />
            <Route path="/onboarding" element={<OnboardingPage />} />
            <Route path="/test-plans" element={<TestPlansPage />} />
          </Route>
        </Route>
      </Route>
    </>,
  ),
  { basename },
);

function AppWithUserInit() {
  useUserInitialization();
  return <RouterProvider router={router} />;
}

function App() {
  return (
    <ToastProvider>
      <UserProvider>
        <AppWithUserInit />
      </UserProvider>
    </ToastProvider>
  );
}

export default App;
