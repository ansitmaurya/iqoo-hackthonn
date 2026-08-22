import React, { useEffect, useState } from 'react';
import { useSentinelStore } from './store/useSentinelStore';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { SplashScreen } from './components/SplashScreen';
import { LiveMonitoringPage } from './pages/LiveMonitoringPage';
import { AlertsQueuePage } from './pages/AlertsQueuePage';
import { TransactionExplorerPage } from './pages/TransactionExplorerPage';
import { NetworkVisualizationPage } from './pages/NetworkVisualizationPage';
import { GlobalThreatMapPage } from './pages/GlobalThreatMapPage';
import { InvestigationWorkspacePage } from './pages/InvestigationWorkspacePage';
import { AnalyticsPage } from './pages/AnalyticsPage';
import { AuditLogPage } from './pages/AuditLogPage';
import { TransactionDrawer } from './components/TransactionDrawer';
import { AlertDrawer } from './components/AlertDrawer';
import { AccountModal } from './components/AccountModal';

export const App: React.FC = () => {
  const { activeTab, startSimulation } = useSentinelStore();
  const [showSplash, setShowSplash] = useState<boolean>(true);

  // Auto-start simulation stream on mount
  useEffect(() => {
    startSimulation();
  }, [startSimulation]);

  return (
    <>
      {/* High-End Cinematic Animated Splash Intro Screen */}
      {showSplash && (
        <SplashScreen onComplete={() => setShowSplash(false)} />
      )}

      <div className="app-container">
      {/* Fixed Left Navigation */}
      <Sidebar onReplayIntro={() => setShowSplash(true)} />

      {/* Main App Content Viewport */}
      <div className="main-viewport">
        {/* Global SOC Header with Stream Controls, Live Date & Time & Metrics */}
        <Header />

        {/* Scrollable Page Canvas */}
        <main className="page-content-scroll">
          {activeTab === 'live' && <LiveMonitoringPage />}
          {activeTab === 'alerts' && <AlertsQueuePage />}
          {activeTab === 'transactions' && <TransactionExplorerPage />}
          {activeTab === 'network' && <NetworkVisualizationPage />}
          {activeTab === 'global' && <GlobalThreatMapPage />}
          {activeTab === 'investigations' && <InvestigationWorkspacePage />}
          {activeTab === 'analytics' && <AnalyticsPage />}
          {activeTab === 'audit' && <AuditLogPage />}
        </main>
      </div>

      {/* Global Slide-Over Inspection Drawers & Modals */}
      <TransactionDrawer />
      <AlertDrawer />
      <AccountModal />
    </div>
    </>
  );
};

export default App;
