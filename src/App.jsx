import { lazy, Suspense } from 'react';
import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes, useLocation } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import ScrollToTop from './components/ScrollToTop';
import { BiometricLockProvider } from '@/lib/biometric';
import ProtectedRoute from '@/components/ProtectedRoute';
import RequireLogin from '@/components/RequireLogin';
import { LanguageProvider } from '@/lib/i18n';
import { GuestPreviewProvider } from '@/lib/GuestPreviewContext';
import { ThemeProvider } from 'next-themes';
import { AnimatePresence } from 'framer-motion';
import PageTransition from '@/components/PageTransition';
import PageViewBeacon from '@/components/PageViewBeacon';
import SeoMetaManager from '@/components/SeoMetaManager';
import PersistentTabs from '@/components/PersistentTabs';
import { useAndroidBack } from '@/hooks/useAndroidBack';

// Route-based code-splitting: each page is loaded on demand to keep the
// initial WebView bundle small and speed up first paint.
const Home = lazy(() => import('@/pages/Home'));
const Food = lazy(() => import('@/pages/Food'));
const Meds = lazy(() => import('@/pages/Meds'));
const MedicationCalendarPage = lazy(() => import('@/pages/MedicationCalendar'));
const ServicesMap = lazy(() => import('@/pages/ServicesMap'));
const Trends = lazy(() => import('@/pages/Trends'));
const SymptomCharts = lazy(() => import('@/pages/SymptomCharts'));
const Assistant = lazy(() => import('@/pages/Assistant'));
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
const Analisi = lazy(() => import('@/pages/Analisi'));
const TrendMensili = lazy(() => import('@/pages/TrendMensili'));
const AdminConversions = lazy(() => import('@/pages/AdminConversions'));
const AdminGuestPreview = lazy(() => import('@/pages/AdminGuestPreview'));
const AdminSupport = lazy(() => import('@/pages/AdminSupport'));
const AdminAccessReport = lazy(() => import('@/pages/AdminAccessReport'));
const AdminBusiness = lazy(() => import('@/pages/AdminBusiness'));
const Shop = lazy(() => import('@/pages/Shop'));
const ShopAdmin = lazy(() => import('@/pages/ShopAdmin'));
const MarketingAdmin = lazy(() => import('@/pages/MarketingAdmin'));
const ScreenshotGenerator = lazy(() => import('@/pages/ScreenshotGenerator'));
const PlayStoreDescriptions = lazy(() => import('@/pages/PlayStoreDescriptions'));
const ProductDetail = lazy(() => import('@/pages/ProductDetail'));
const Invita = lazy(() => import('@/pages/Invita'));
const PreparaVisita = lazy(() => import('@/pages/PreparaVisita'));
const CalorieAnalysis = lazy(() => import('@/pages/CalorieAnalysis'));
const Login = lazy(() => import('@/pages/Login'));
const Register = lazy(() => import('@/pages/Register'));
const ForgotPassword = lazy(() => import('@/pages/ForgotPassword'));
const ResetPassword = lazy(() => import('@/pages/ResetPassword'));
const SharedReport = lazy(() => import('@/pages/SharedReport'));
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
  useAndroidBack();

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
    <PersistentTabs />
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        {/* Auth routes (public) */}
        <Route path="/login" element={<PageTransition><Login /></PageTransition>} />
        <Route path="/register" element={<PageTransition><Register /></PageTransition>} />
        <Route path="/forgot-password" element={<PageTransition><ForgotPassword /></PageTransition>} />
        <Route path="/reset-password" element={<PageTransition><ResetPassword /></PageTransition>} />
        {/* Public pages: solo Home e About (piu' informativa privacy e link report condivisi) */}
        <Route path="/" element={<PageTransition><Home /></PageTransition>} />
        <Route path="/about" element={<PageTransition><About /></PageTransition>} />
        <Route path="/privacy" element={<PageTransition><Privacy /></PageTransition>} />
        <Route path="/report/:shareId" element={<SharedReport />} />
        {/* Tutto il resto richiede registrazione (trial 45 giorni, poi sola lettura) */}
        <Route element={<ProtectedRoute unauthenticatedElement={<RequireLogin />} />}>
          <Route path="/scarica" element={<PageTransition><ScaricaApp /></PageTransition>} />
          <Route path="/contact" element={<PageTransition><Contact /></PageTransition>} />
          <Route path="/invita" element={<PageTransition><Invita /></PageTransition>} />
          <Route path="/news" element={<PageTransition><IBDNews /></PageTransition>} />
          <Route path="/news/:id" element={<PageTransition><ArticleDetail /></PageTransition>} />
          <Route path="/community" element={null} />
          <Route path="/supporto" element={<PageTransition><Supporto /></PageTransition>} />
          <Route path="/symptoms" element={null} />
          <Route path="/food" element={<PageTransition><Food /></PageTransition>} />
          <Route path="/meds" element={<PageTransition><Meds /></PageTransition>} />
          <Route path="/meds/calendar" element={<PageTransition><MedicationCalendarPage /></PageTransition>} />
          <Route path="/visita" element={<PageTransition><PreparaVisita /></PageTransition>} />
          <Route path="/records" element={null} />
          <Route path="/esami" element={<PageTransition><Esami /></PageTransition>} />
          <Route path="/trends" element={<PageTransition><Trends /></PageTransition>} />
          <Route path="/symptom-charts" element={<PageTransition><SymptomCharts /></PageTransition>} />
          <Route path="/correlazioni" element={<PageTransition><Correlazioni /></PageTransition>} />
          <Route path="/analisi" element={<PageTransition><Analisi /></PageTransition>} />
          <Route path="/trend-mensili" element={<PageTransition><TrendMensili /></PageTransition>} />
          <Route path="/calorie-analysis" element={<PageTransition><CalorieAnalysis /></PageTransition>} />
          <Route path="/assistant" element={<PageTransition><Assistant /></PageTransition>} />
          <Route path="/map" element={<PageTransition><ServicesMap /></PageTransition>} />
          <Route path="/summary" element={<PageTransition><Summary /></PageTransition>} />
          <Route path="/abbonamento" element={<PageTransition><Abbonamento /></PageTransition>} />
          <Route path="/shop" element={<PageTransition><Shop /></PageTransition>} />
          <Route path="/shop/:slug" element={<PageTransition><ProductDetail /></PageTransition>} />
          <Route path="/settings" element={<PageTransition><Settings /></PageTransition>} />
          <Route path="/account" element={<PageTransition><Account /></PageTransition>} />
          <Route element={<ProtectedRoute unauthenticatedElement={<RequireLogin />} requireRole="admin" />}>
            <Route path="/admin/conversioni" element={<PageTransition><AdminConversions /></PageTransition>} />
            <Route path="/admin/guest-preview" element={<PageTransition><AdminGuestPreview /></PageTransition>} />
            <Route path="/admin/supporto" element={<PageTransition><AdminSupport /></PageTransition>} />
            <Route path="/admin/access-report" element={<PageTransition><AdminAccessReport /></PageTransition>} />
            <Route path="/admin/business" element={<PageTransition><AdminBusiness /></PageTransition>} />
            <Route path="/admin/marketing" element={<PageTransition><MarketingAdmin /></PageTransition>} />
            <Route path="/shop/admin" element={<PageTransition><ShopAdmin /></PageTransition>} />
            <Route path="/admin/screenshots" element={<PageTransition><ScreenshotGenerator /></PageTransition>} />
            <Route path="/admin/play-store" element={<PageTransition><PlayStoreDescriptions /></PageTransition>} />
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
          <GuestPreviewProvider>
          <QueryClientProvider client={queryClientInstance}>
            <ThemeProvider attribute="class" defaultTheme="system" enableSystem={true}>
              <Router>
                <ScrollToTop />
                <PageViewBeacon />
                <AuthenticatedApp />
              </Router>
            </ThemeProvider>
            <Toaster />
          </QueryClientProvider>
          </GuestPreviewProvider>
        </LanguageProvider>
      </BiometricLockProvider>
    </AuthProvider>
  )
}

export default App