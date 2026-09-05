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
import { TransactionIngestModal } from './components/TransactionIngestModal';

const SESSION_INTRO_KEY = 'TRACEGUARD_INTRO_SHOWN';

export const App: React.FC = () => {
  const { 
    activeTab, 
    startSimulation, 
    syncWithBackend, 
    isIngestModalOpen, 
    setIsIngestModalOpen 
  } = useSentinelStore();
  
  // Check if user has already seen the intro in this browser session
  const [showSplash, setShowSplash] = useState<boolean>(() => {
    try {
      const alreadyShown = sessionStorage.getItem(SESSION_INTRO_KEY);
      return alreadyShown !== 'true';
    } catch {
      return true;
    }
  });

  const [isReplay, setIsReplay] = useState<boolean>(false);

  // Hydrate from live Flask / PostgreSQL backend & start stream on mount
  useEffect(() => {
    syncWithBackend();
    startSimulation();
  }, [syncWithBackend, startSimulation]);

  const handleSplashComplete = () => {
    try {
      sessionStorage.setItem(SESSION_INTRO_KEY, 'true');
    } catch {
      // Ignore sessionStorage issues
    }
    setShowSplash(false);
    setIsReplay(false);
  };

  const handleReplayIntro = () => {
    setIsReplay(true);
    setShowSplash(true);
  };

  return (
    <>
      {/* High-End Cinematic Animated Startup Intro Screen */}
      {showSplash && (
        <SplashScreen 
          onComplete={handleSplashComplete} 
          isReplay={isReplay} 
        />
      )}

      <div className="app-container">
        {/* Fixed Left Navigation */}
        <Sidebar onReplayIntro={handleReplayIntro} />

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
        <TransactionIngestModal 
          isOpen={isIngestModalOpen} 
          onClose={() => setIsIngestModalOpen(false)} 
        />
      </div>
    </>
  );
};

export default App;
