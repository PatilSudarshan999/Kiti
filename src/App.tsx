import React, { useEffect, useRef, useState, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useKitiStore } from './services/store';
import Login from './components/auth/Login';
import { WaiterView } from './components/waiter/WaiterView';
import { KitchenView } from './components/kitchen/KitchenView';
import { ManagerView } from './components/manager/ManagerView';
import { OwnerView } from './components/owner/OwnerView';
import { AppHeader } from './components/common/AppHeader';
import { KitiVoiceOrb } from './components/common/KitiVoiceOrb';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import LoadingSpinner from './components/common/LoadingSpinner';
import { AIVoiceService } from './services/aiVoiceService';
import type { UserRole } from './types';

// Layout wrapper for authenticated role views
function RoleLayout({ children, allowedRoles }: { children: React.ReactNode; allowedRoles: UserRole[] }) {
  const { state } = useKitiStore();
  const location = useLocation();

  if (!allowedRoles.includes(state.currentRole)) {
    // If navigating directly to a role path without matching role, auto-switch role in demo or redirect
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      <AppHeader />
      <main className="flex-1 p-4 lg:p-8 max-w-7xl mx-auto w-full">
        {children}
      </main>
    </div>
  );
}

export default function App() {
  const { setIsVoiceListening, addVoiceLog } = useKitiStore();
  const voiceServiceRef = useRef<AIVoiceService | null>(null);
  const [serviceReady, setServiceReady] = useState(false);

  useEffect(() => {
    const voiceService = new AIVoiceService();
    voiceServiceRef.current = voiceService;

    voiceService.onListeningChange = (listening: boolean) => {
      setIsVoiceListening(listening);
    };

    voiceService.onLog = (log) => {
      addVoiceLog(log);
    };

    setServiceReady(true);

    return () => {
      voiceService.stopListening();
    };
  }, [setIsVoiceListening, addVoiceLog]);

  return (
    <ErrorBoundary>
      <Suspense fallback={<LoadingSpinner />}>
        <Router>
          <div className="relative min-h-screen bg-slate-950 font-sans antialiased text-slate-100 selection:bg-amber-500 selection:text-black">
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route
                path="/waiter"
                element={
                  <RoleLayout allowedRoles={['Waiter']}>
                    <WaiterView />
                  </RoleLayout>
                }
              />
              <Route
                path="/kitchen"
                element={
                  <RoleLayout allowedRoles={['Kitchen Chief']}>
                    <KitchenView />
                  </RoleLayout>
                }
              />
              <Route
                path="/manager"
                element={
                  <RoleLayout allowedRoles={['Manager']}>
                    <ManagerView />
                  </RoleLayout>
                }
              />
              <Route
                path="/owner"
                element={
                  <RoleLayout allowedRoles={['Owner']}>
                    <OwnerView />
                  </RoleLayout>
                }
              />
              {/* Default redirect to Waiter view */}
              <Route path="/" element={<Navigate to="/waiter" replace />} />
              <Route path="*" element={<Navigate to="/waiter" replace />} />
            </Routes>

            {/* Shared Kiti Voice Orb available across all views */}
            {serviceReady && <KitiVoiceOrb voiceService={voiceServiceRef.current} />}
          </div>
        </Router>
      </Suspense>
    </ErrorBoundary>
  );
}
