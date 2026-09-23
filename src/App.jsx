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
import Home from '@/pages/Home';
import Symptoms from '@/pages/Symptoms';
import Food from '@/pages/Food';
import Meds from '@/pages/Meds';
import Records from '@/pages/Records';
import ServicesMap from '@/pages/ServicesMap';
import Trends from '@/pages/Trends';
import SymptomCharts from '@/pages/SymptomCharts';
import Assistant from '@/pages/Assistant';
import Community from '@/pages/Community';
import Summary from '@/pages/Summary';
import Settings from '@/pages/Settings';
import Abbonamento from '@/pages/Abbonamento';
import Account from '@/pages/Account';
import About from '@/pages/About';
import Contact from '@/pages/Contact';
import ArticleDetail from '@/pages/ArticleDetail';
import IBDNews from '@/pages/IBDNews';
import Esami from '@/pages/Esami';
import Correlazioni from '@/pages/Correlazioni';
import AdminConversions from '@/pages/AdminConversions';
import Shop from '@/pages/Shop';
import ShopAdmin from '@/pages/ShopAdmin';
import MarketingAdmin from '@/pages/MarketingAdmin';
import ProductDetail from '@/pages/ProductDetail';
import Founders from '@/pages/Founders';
import Login from '@/pages/Login';
import Register from '@/pages/Register';
import ForgotPassword from '@/pages/ForgotPassword';
import ResetPassword from '@/pages/ResetPassword';
import Guida from '@/pages/Guida';
import { AnimatePresence } from 'framer-motion';
import PageTransition from '@/components/PageTransition';
import PageViewBeacon from '@/components/PageViewBeacon';
// Add page imports here

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin } = useAuth();
  const location = useLocation();

  // Show loading spinner while checking app public settings or auth
  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
      </div>
    );
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
        <Route path="/guida" element={<PageTransition><Guida /></PageTransition>} />
        <Route path="/contact" element={<PageTransition><Contact /></PageTransition>} />
        <Route path="/founders" element={<PageTransition><Founders /></PageTransition>} />
        <Route path="/news" element={<PageTransition><IBDNews /></PageTransition>} />
        <Route path="/news/:id" element={<PageTransition><ArticleDetail /></PageTransition>} />
        <Route path="/community" element={<PageTransition><Community /></PageTransition>} />
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
        {/* Login required: account, settings, admin and shop (reserved + standby) */}
        <Route element={<ProtectedRoute unauthenticatedElement={<Navigate to="/login" replace />} />}>
          <Route path="/shop" element={<PageTransition><Shop /></PageTransition>} />
          <Route path="/shop/:slug" element={<PageTransition><ProductDetail /></PageTransition>} />
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
  );
};


function App() {

  return (
    <AuthProvider>
      <BiometricLockProvider>
        <LanguageProvider>
          <QueryClientProvider client={queryClientInstance}>
            <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
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