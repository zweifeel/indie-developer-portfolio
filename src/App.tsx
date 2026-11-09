import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, useLocation, Navigate } from 'react-router-dom';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { HomePage } from './pages/HomePage';
import { ProjectsPage } from './pages/ProjectsPage';
import { ProjectDetailPage } from './pages/ProjectDetailPage';
import { FeedbackPage } from './pages/FeedbackPage';
import { AboutPage } from './pages/AboutPage';
import { AdminPage } from './pages/AdminPage';
import { PrivacyPolicyPage } from './pages/PrivacyPolicyPage';
import { DeleteAccountPage } from './pages/DeleteAccountPage';
import { B343VisualPrototype } from './prototypes/virtual-office-b343/B343VisualPrototype';

// Scroll to top helper on route change
const ScrollToTop: React.FC = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
};

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <div className="flex flex-col min-h-screen bg-[#090a0f] text-slate-100 selection:bg-violet-600 selection:text-white overflow-x-hidden">
        <Navbar />
        <main className="flex-1">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/projects" element={<ProjectsPage />} />
            <Route path="/projects/:slug" element={<ProjectDetailPage />} />
            <Route path="/projects/:slug/feedback" element={<FeedbackPage />} />
            <Route path="/projects/:slug/privacy" element={<PrivacyPolicyPage />} />
            <Route path="/privacy/:slug" element={<PrivacyPolicyPage />} />
            <Route path="/projects/:slug/delete-account" element={<DeleteAccountPage />} />
            <Route path="/delete-account/:slug" element={<DeleteAccountPage />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/admin" element={<AdminPage />} />
            <Route path="/prototypes/virtual-office-b343" element={<B343VisualPrototype />} />
            <Route path="/prototype/b343" element={<B343VisualPrototype />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </BrowserRouter>
  );
};

export default App;
