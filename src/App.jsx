import { lazy, Suspense } from 'react';
import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes, Navigate, useLocation } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import ScrollToTop from './components/ScrollToTop';
import { BiometricLockProvider } from '@/lib/biometric';
import ProtectedRoute from '@/components/ProtectedRoute';
import { LanguageProvider } from '@/lib/i18n';
import { ThemeProvider } from 'next-themes';
import { AnimatePresence } from 'framer-motion';
import PageTransition from '@/components/PageTransition';
import PageViewBeacon from '@/components/PageViewBeacon';
import SeoMetaManager from '@/components/SeoMetaManager';

// Route-based code-splitting: each page is loaded on demand to keep the
// initial WebView bundle small and speed up first paint.
const Home = lazy(() => import('@/pages/Home'));
const Symptoms = lazy(() => import('@/pages/Symptoms'));
const Food = lazy(() => import('@/pages/Food'));
const Meds = lazy(() => import('@/pages/Meds'));
const Records = lazy(() => import('@/pages/Records'));
const ServicesMap = lazy(() => import('@/pages/ServicesMap'));
const Trends = lazy(() => import('@/pages/Trends'));
const SymptomCharts = lazy(() => import('@/pages/SymptomCharts'));
const Assistant = lazy(() => import('@/pages/Assistant'));
const Community = lazy(() => import('@/pages/Community'));
const Summary = lazy(() => import('@/pages/Summary'));
const Settings = lazy(() => import('@/pages/Settings'));
const Abbonamento = lazy(() => import('@/pages/Abbonamento'));
const Account = lazy(() => import('@/pages/Account'));
const About = lazy(() => import('@/pages/About'));
const Contact = lazy(() => import('@/pages/Contact'));
const Privacy = lazy(() => import('@/pages/Privacy'));
const ArticleDetail = lazy(() => import('@/pages/ArticleDetail'));
const IBDNews = lazy(() => import('@/pages/IBDNews'));
const Esami = lazy(() => import('@/pages/Esami'));
const Correlazioni = lazy(() => import('@/pages/Correlazioni'));
const AdminConversions = lazy(() => import('@/pages/AdminConversions'));
const Shop = lazy(() => import('@/pages/Shop'));
const ShopAdmin = lazy(() => import('@/pages/ShopAdmin'));
const MarketingAdmin = lazy(() => import('@/pages/MarketingAdmin'));
const ProductDetail = lazy(() => import('@/pages/ProductDetail'));
const Founders = lazy(() => import('@/pages/Founders'));
const Login = lazy(() => import('@/pages/Login'));
const Register = lazy(() => import('@/pages/Register'));
const ForgotPassword = lazy(() => import('@/pages/ForgotPassword'));
const ResetPassword = lazy(() => import('@/pages/ResetPassword'));
const Guida = lazy(() => import('@/pages/Guida'));
const ScaricaApp = lazy(() => import('@/pages/ScaricaApp'));
const Supporto = lazy(() => import('@/pages/Supporto'));

const PageLoader = () => (
  <div className="fixed inset-0 flex items-center justify-center">
    <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin" />
  </div>
);

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin } = useAuth();
  const location = useLocation();

  // Show loading spinner while checking app public settings or auth
  if (isLoadingPublicSettings || isLoadingAuth) {
    return <PageLoader />;
  }

  // Handle authentication errors
  if (authError) {
    if (authError.type === 'user_not_registered') {
      return <UserNotRegisteredError />;
    } else if (authError.type === 'auth_required') {
      // Redirect to login automatically
      navigateToLogin();
      return null;
    }
  }

  // Render the main app
  return (
    <>
    <SeoMetaManager />
    <Suspense fallback={<PageLoader />}>
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        {/* Auth routes (public) */}
        <Route path="/login" element={<PageTransition><Login /></PageTransition>} />
        <Route path="/register" element={<PageTransition><Register /></PageTransition>} />
        <Route path="/forgot-password" element={<PageTransition><ForgotPassword /></PageTransition>} />
        <Route path="/reset-password" element={<PageTransition><ResetPassword /></PageTransition>} />
        {/* Public pages: navigable without login. Diario usable as guest (local). */}
        <Route path="/" element={<PageTransition><Home /></PageTransition>} />
        <Route path="/about" element={<PageTransition><About /></PageTransition>} />
        <Route path="/privacy" element={<PageTransition><Privacy /></PageTransition>} />
        <Route path="/guida" element={<PageTransition><Guida /></PageTransition>} />
        <Route path="/scarica" element={<PageTransition><ScaricaApp /></PageTransition>} />
        <Route path="/contact" element={<PageTransition><Contact /></PageTransition>} />
        <Route path="/founders" element={<PageTransition><Founders /></PageTransition>} />
        <Route path="/news" element={<PageTransition><IBDNews /></PageTransition>} />
        <Route path="/news/:id" element={<PageTransition><ArticleDetail /></PageTransition>} />
        <Route path="/community" element={<PageTransition><Community /></PageTransition>} />
        <Route path="/supporto" element={<PageTransition><Supporto /></PageTransition>} />
        <Route path="/symptoms" element={<PageTransition><Symptoms /></PageTransition>} />
        <Route path="/food" element={<PageTransition><Food /></PageTransition>} />
        <Route path="/meds" element={<PageTransition><Meds /></PageTransition>} />
        <Route path="/records" element={<PageTransition><Records /></PageTransition>} />
        <Route path="/esami" element={<PageTransition><Esami /></PageTransition>} />
        <Route path="/trends" element={<PageTransition><Trends /></PageTransition>} />
        <Route path="/symptom-charts" element={<PageTransition><SymptomCharts /></PageTransition>} />
        <Route path="/correlazioni" element={<PageTransition><Correlazioni /></PageTransition>} />
        <Route path="/assistant" element={<PageTransition><Assistant /></PageTransition>} />
        <Route path="/map" element={<PageTransition><ServicesMap /></PageTransition>} />
        <Route path="/summary" element={<PageTransition><Summary /></PageTransition>} />
        <Route path="/abbonamento" element={<PageTransition><Abbonamento /></PageTransition>} />
        {/* Shop is public (standby vetrina for all visitors); account/settings/admin require login */}
        <Route path="/shop" element={<PageTransition><Shop /></PageTransition>} />
        <Route path="/shop/:slug" element={<PageTransition><ProductDetail /></PageTransition>} />
        {/* Login required: account, settings, admin */}
        <Route element={<ProtectedRoute unauthenticatedElement={<Navigate to="/login" replace />} />}>
          <Route path="/settings" element={<PageTransition><Settings /></PageTransition>} />
          <Route path="/account" element={<PageTransition><Account /></PageTransition>} />
          <Route element={<ProtectedRoute unauthenticatedElement={<Navigate to="/login" replace />} requireRole="admin" />}>
            <Route path="/admin/conversioni" element={<PageTransition><AdminConversions /></PageTransition>} />
            <Route path="/admin/marketing" element={<PageTransition><MarketingAdmin /></PageTransition>} />
            <Route path="/shop/admin" element={<PageTransition><ShopAdmin /></PageTransition>} />
          </Route>
        </Route>
        <Route path="*" element={<PageTransition><PageNotFound /></PageTransition>} />
      </Routes>
    </AnimatePresence>
    </Suspense>
    </>
  );
};


function App() {

  return (
    <AuthProvider>
      <BiometricLockProvider>
        <LanguageProvider>
          <QueryClientProvider client={queryClientInstance}>
            <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false} forcedTheme="light">
              <Router>
                <ScrollToTop />
                <PageViewBeacon />
                <AuthenticatedApp />
              </Router>
            </ThemeProvider>
            <Toaster />
          </QueryClientProvider>
        </LanguageProvider>
      </BiometricLockProvider>
    </AuthProvider>
  )
}

export default App