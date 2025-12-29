import { Routes, Route } from 'react-router-dom';
import { useEffect, Suspense, lazy } from 'react';
import { useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { initSessionTimeout, cleanupSessionTimeout } from './utils/sessionTimeout';
import { useFirstTimeVisitor } from './hooks/useFirstTimeVisitor';
import { useTimeLimitedOffer } from './hooks/useTimeLimitedOffer';
import { Header } from './components/Header';
import { AboutSection } from './components/AboutSection';
import { ProductsSection } from './components/ProductsSection';
import { LocationSection } from './components/LocationSection';
import { Footer } from './components/Footer';
import { ProductDetail } from './components/ProductDetail';
import { RecipeDetail } from './components/RecipeDetail';
import { RecipesPage } from './pages/RecipesPage';
import { ScrollToTop } from './components/ScrollToTop';
import { AboutPage } from './pages/AboutPage';
import { CartProvider } from './context/CartContext';
import { Navigation } from './components/Navigation';
import { Cart } from './components/Cart';
import { CheckoutPage } from './pages/CheckoutPage';
import { ModularCheckoutPage } from './pages/ModularCheckoutPage';
import { ModularCheckoutPage2 } from './pages/ModularCheckoutPage2';
import { MultiStepCheckoutPage } from './pages/MultiStepCheckoutPage';
import { DariloProductPage } from './pages/DariloProductPage';
import { GiftBuilderPage } from './pages/GiftBuilderPage';
import { PresetGiftPage } from './pages/PresetGiftPage';
import { ProfilePage } from './pages/ProfilePage';
import { ChangePasswordPage } from './pages/ChangePasswordPage';
import { OrdersPage } from './pages/OrdersPage';
// Lazy load admin pages to reduce main bundle size
const AdminOrdersPage = lazy(() => import('./pages/AdminOrdersPage').then(module => ({ default: module.AdminOrdersPage })));
const AdminProductsPage = lazy(() => import('./pages/AdminProductsPage').then(module => ({ default: module.AdminProductsPage })));
const AdminSettingsPage = lazy(() => import('./pages/AdminSettingsPage').then(module => ({ default: module.AdminSettingsPage })));
const AdminDebugPage = lazy(() => import('./pages/AdminDebugPage').then(module => ({ default: module.AdminDebugPage })));
import { LoginPage } from './pages/LoginPage';
import { AuthCallbackPage } from './pages/AuthCallbackPage';
import { PrivacyPolicyPage } from './pages/PrivacyPolicyPage';
const BannerDiscountManager = lazy(() => import('./pages/admin/BannerDiscountManager').then(module => ({ default: module.BannerDiscountManager })));
const FeatureFlagsManager = lazy(() => import('./pages/admin/FeatureFlagsManager'));
import { OrderConfirmationPage } from './pages/OrderConfirmationPage';
import { OrderSuccessPage } from './pages/OrderSuccessPage';
import { StripeProvider } from './components/StripeProvider';
import { TestStripePage } from './pages/TestStripePage';
import { ImageTest } from './components/ImageTest';
import { SecureAdminRoute } from './components/SecureAdminRoute';
import { ErrorMonitor } from './components/ErrorMonitor';
import { StagingBanner } from './components/StagingBanner';
import { ToastProvider } from './components/Toast';
import { NewsletterSignup } from './components/NewsletterSignup';
import { FirstTimeVisitorDiscount } from './components/FirstTimeVisitorDiscount';
import { PageLoadingSpinner } from './components/common/LoadingSpinner';
import { SimpleBanner } from './components/SimpleBanner';
import ConfirmSubscriptionPage from './pages/ConfirmSubscriptionPage';
import { UnsubscribePage } from './pages/UnsubscribePage';
import { TestDariloLinkPage } from './pages/TestDariloLinkPage';
import { EmailTestPage } from './pages/EmailTestPage';
import { DirectEmailTestPage } from './pages/DirectEmailTestPage';
import { PopupDebugPage } from './pages/PopupDebugPage';
import TranslationStatus from './components/dev/TranslationStatus';
import TranslationDebug from './components/dev/TranslationDebug';
const TranslationsAdminPage = lazy(() => import('./pages/admin/TranslationsAdminPage'));
import { TestToastNotification } from './pages/TestToastNotification';
import { TestStickyNotification } from './pages/TestStickyNotification';
import { CookieConsent } from './components/CookieConsent';
import { CartNotificationWrapper } from './components/CartNotificationWrapper';
import { HelmetProvider } from 'react-helmet-async';
import { HomePageSchema } from './components/seo/StructuredData';
import { HomePageMeta } from './components/seo/OpenGraph';

function HomePage() {
  return (
    <>
      <HomePageMeta />
      <HomePageSchema />
      <Header />
      <AboutSection />
      <ProductsSection />
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          <NewsletterSignup />
        </div>
      </div>
      <LocationSection />
    </>
  );
}

function App() {
  const location = useLocation();
  const { i18n } = useTranslation();
  const { showPopup, closePopup, forceShowPopup, clearAllFlags } = useFirstTimeVisitor(3000); // Show popup after 3 seconds

  // Use the time-limited offer hook
  const { discount: fetchedDiscount, dismissed, handleDismiss } = useTimeLimitedOffer();

  // Initialize session timeout
  useEffect(() => {
    // Initialize session timeout (30 minutes)
    initSessionTimeout(30 * 60 * 1000);

    // Clean up on component unmount
    return () => {
      cleanupSessionTimeout();
    };
  }, []);

  // Initialize language from URL or localStorage
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const langParam = searchParams.get('lang');

    if (langParam && ['sl', 'en', 'hr', 'de'].includes(langParam)) {
      console.log(`Setting language from URL: ${langParam}`);
      i18n.changeLanguage(langParam);
    } else {
      // If no language in URL, check localStorage or set default
      const storedLang = localStorage.getItem('i18nextLng');
      if (storedLang && ['sl', 'en', 'hr', 'de'].includes(storedLang)) {
        console.log(`Setting language from localStorage: ${storedLang}`);
        i18n.changeLanguage(storedLang);
      } else {
        // Default to Slovenian if no valid language is found
        console.log('Setting default language: sl');
        i18n.changeLanguage('sl');
      }
    }

    console.log(`Current language after initialization: ${i18n.language}`);
  }, [location, i18n]);

  useEffect(() => {
    if (!import.meta.env.DEV) return;
    import('./utils/testDiscountAccess');
  }, []);

  return (
    <HelmetProvider>
      <div className="min-h-screen bg-stone-50">
        <ToastProvider>
          <StagingBanner />
          <CartProvider>
          <StripeProvider>
            <ScrollToTop />
            {/* DIRECT BANNER: Show the simple banner only if not dismissed */}
            {fetchedDiscount && !dismissed && (
              <SimpleBanner discount={fetchedDiscount} onDismiss={handleDismiss} />
            )}
            <Navigation />
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/o-nas" element={<AboutPage />} />
              <Route path="/izdelek/:id" element={<ProductDetail />} />
              <Route path="/products/:id" element={<ProductDetail />} />
              <Route path="/recipes" element={<RecipesPage />} />
              <Route path="/recipes/:id" element={<RecipeDetail />} />
              <Route path="/cart" element={<Cart />} />
              <Route path="/checkout" element={<CheckoutPage />} />
              <Route path="/checkout-modular" element={<ModularCheckoutPage />} />
              <Route path="/checkout-modular2" element={<ModularCheckoutPage2 />} />
              <Route path="/checkout-steps" element={<MultiStepCheckoutPage />} />
              <Route path="/darilo" element={<DariloProductPage />} />
              <Route path="/darilo/builder/:packageId" element={<GiftBuilderPage />} />
              <Route path="/darilo/preset/:packageId" element={<PresetGiftPage />} />
              <Route path="/profile" element={<ProfilePage />} />
              <Route path="/change-password" element={<ChangePasswordPage />} />
              <Route path="/orders" element={<OrdersPage />} />
              <Route path="/order-confirmation/:orderId" element={<OrderConfirmationPage />} />
              <Route path="/order-success" element={<OrderSuccessPage />} />
              <Route path="/admin/orders" element={
                <SecureAdminRoute>
                  <Suspense fallback={<PageLoadingSpinner />}>
                    <AdminOrdersPage />
                  </Suspense>
                </SecureAdminRoute>
              } />
              <Route path="/admin/products" element={
                <SecureAdminRoute>
                  <Suspense fallback={<PageLoadingSpinner />}>
                    <AdminProductsPage />
                  </Suspense>
                </SecureAdminRoute>
              } />
              <Route path="/admin/settings" element={
                <SecureAdminRoute>
                  <Suspense fallback={<PageLoadingSpinner />}>
                    <AdminSettingsPage />
                  </Suspense>
                </SecureAdminRoute>
              } />
              <Route path="/admin/banner-discounts" element={
                <SecureAdminRoute>
                  <Suspense fallback={<PageLoadingSpinner />}>
                    <BannerDiscountManager />
                  </Suspense>
                </SecureAdminRoute>
              } />
              <Route path="/admin/translations" element={
                <SecureAdminRoute>
                  <Suspense fallback={<PageLoadingSpinner />}>
                    <TranslationsAdminPage />
                  </Suspense>
                </SecureAdminRoute>
              } />
              <Route path="/admin/features" element={
                <SecureAdminRoute>
                  <Suspense fallback={<PageLoadingSpinner />}>
                    <FeatureFlagsManager />
                  </Suspense>
                </SecureAdminRoute>
              } />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/auth/callback" element={<AuthCallbackPage />} />
              <Route path="/auth/confirm-registration" element={<AuthCallbackPage />} />
              <Route path="/privacy-policy" element={<PrivacyPolicyPage />} />
              <Route path="/confirm-subscription" element={<ConfirmSubscriptionPage />} />
              <Route path="/unsubscribe" element={<UnsubscribePage />} />
              {import.meta.env.DEV && (
                <>
                  <Route path="/admin/debug" element={
                    <SecureAdminRoute>
                      <Suspense fallback={<PageLoadingSpinner />}>
                        <AdminDebugPage />
                      </Suspense>
                    </SecureAdminRoute>
                  } />
                  <Route path="/test-stripe" element={<TestStripePage />} />
                  <Route path="/image-test" element={<ImageTest />} />
                  <Route path="/test-darilo-link" element={<TestDariloLinkPage />} />
                  <Route path="/test-email" element={<EmailTestPage />} />
                  <Route path="/test-direct-email" element={<DirectEmailTestPage />} />
                  <Route path="/popup-debug" element={<PopupDebugPage />} />
                  <Route path="/test-toast" element={<TestToastNotification />} />
                  <Route path="/test-sticky" element={<TestStickyNotification />} />
                </>
              )}
            </Routes>
            <Footer />
            {/* Error Monitor - only visible in development mode */}
            <ErrorMonitor />

            {/* Translation tools - only visible in development mode */}
            <TranslationStatus />
            <TranslationDebug />

            {/* First-time visitor discount popup */}
            {showPopup && <FirstTimeVisitorDiscount onClose={closePopup} />}

            {/* Debug button - only visible in development */}
            {import.meta.env.DEV && (
              <div className="fixed bottom-4 right-4 z-50 flex space-x-2">
                <button
                  onClick={clearAllFlags}
                  className="px-3 py-1 bg-red-500 text-white text-sm rounded hover:bg-red-600"
                >
                  Reset Popup
                </button>
                <button
                  onClick={forceShowPopup}
                  className="px-3 py-1 bg-blue-500 text-white text-sm rounded hover:bg-blue-600"
                >
                  Show Popup
                </button>
                <a
                  href="/popup-debug"
                  className="px-3 py-1 bg-gray-500 text-white text-sm rounded hover:bg-gray-600"
                >
                  Debug
                </a>
                {/* Banner debug info */}
                {fetchedDiscount && (
                  <div className="px-3 py-1 bg-yellow-500 text-white text-sm rounded">
                    Banner Active
                  </div>
                )}
              </div>
            )}
          </StripeProvider>

          {/* Cart Notification - Responsive (Toast on desktop, Sticky on mobile) */}
          <CartNotificationWrapper />

          {/* GDPR Cookie Consent */}
          <CookieConsent />
          </CartProvider>
        </ToastProvider>
      </div>
    </HelmetProvider>
  );
}

export default App;
