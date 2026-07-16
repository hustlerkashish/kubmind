import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { DashboardLayout } from '@/layouts/DashboardLayout';
import { AuthLayout } from '@/layouts/AuthLayout';

import { LoginPage } from '@/pages/auth/LoginPage';
import { RegisterPage } from '@/pages/auth/RegisterPage';
import { ForgotPasswordPage } from '@/pages/auth/ForgotPasswordPage';
import { DashboardPage } from '@/pages/dashboard/DashboardPage';

import { PodsPage } from '@/pages/k8s/PodsPage';
import { DeploymentsPage } from '@/pages/k8s/DeploymentsPage';
import { NodesPage } from '@/pages/k8s/NodesPage';
import { ServicesPage } from '@/pages/k8s/ServicesPage';
import { NamespacesPage } from '@/pages/k8s/NamespacesPage';
import { EventsPage } from '@/pages/k8s/EventsPage';

import { TelemetryMetricsPage } from '@/pages/metrics/TelemetryMetricsPage';
import { LogExplorerPage } from '@/pages/logs/LogExplorerPage';
import { IncidentCenterPage } from '@/pages/incidents/IncidentCenterPage';
import { CopilotChatPage } from '@/pages/copilot/CopilotChatPage';
import { RecommendationsPage } from '@/pages/recommendations/RecommendationsPage';

import { SettingsPage } from '@/pages/settings/SettingsPage';
import { ProfilePage } from '@/pages/profile/ProfilePage';
import { NotFoundPage } from '@/pages/error/NotFoundPage';
import { UnauthorizedPage } from '@/pages/error/UnauthorizedPage';
import { useAuth } from '@/context/AuthContext';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
}

export function AppRoutes() {
  return (
    <Routes>
      {/* Public Auth Routes */}
      <Route element={<AuthLayout />}>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      </Route>

      {/* Main Protected Dashboard Routes */}
      <Route
        element={
          <ProtectedRoute>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<DashboardPage />} />

        {/* Dedicated Live K8s Pages */}
        <Route path="/k8s/pods" element={<PodsPage />} />
        <Route path="/k8s/deployments" element={<DeploymentsPage />} />
        <Route path="/k8s/nodes" element={<NodesPage />} />
        <Route path="/k8s/services" element={<ServicesPage />} />
        <Route path="/k8s/namespaces" element={<NamespacesPage />} />
        <Route path="/k8s/events" element={<EventsPage />} />

        {/* Observability & AI Copilot Routes */}
        <Route path="/metrics" element={<TelemetryMetricsPage />} />
        <Route path="/logs" element={<LogExplorerPage />} />
        <Route path="/incidents" element={<IncidentCenterPage />} />
        <Route path="/copilot" element={<CopilotChatPage />} />
        <Route path="/recommendations" element={<RecommendationsPage />} />

        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/profile" element={<ProfilePage />} />
      </Route>

      {/* Error & Fallback Routes */}
      <Route path="/unauthorized" element={<UnauthorizedPage />} />
      <Route path="404" element={<NotFoundPage />} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
