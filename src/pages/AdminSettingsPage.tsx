import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import AdminNavigation from '../components/AdminNavigation';
import { AdminUserManagement } from '../components/AdminUserManagement';
import { AdminSEOManagement } from '../components/AdminSEOManagement';
import { AdminDiscountManagement } from '../components/AdminDiscountManagement';
import { AdminGiftOptionsManagement } from '../components/AdminGiftOptionsManagement';
import { AdminGiftProductsManagement } from '../components/AdminGiftProductsManagement';
import { AnalyticsDashboard } from '../components/AnalyticsDashboard';
import AnalyticsScheduler from '../components/AnalyticsScheduler';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';

export function AdminSettingsPage() {
  const { t } = useTranslation();
  const { isAdmin } = useAuth();
  const [activeTab, setActiveTab] = useState('users');
  const [dateRange, setDateRange] = useState<'today' | '7days' | '30days' | '90days'>('30days');

  // Log admin status for debugging
  console.log('AdminSettingsPage - isAdmin:', isAdmin);

  // No need to check isAdmin here as it's already handled by SecureAdminRoute
  // The component will only render if the user has admin access

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Analytics scheduler runs in the background */}
      <AnalyticsScheduler />

      <AdminNavigation />

      <div className="container mx-auto py-8 px-4 max-w-6xl">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">{t('admin.settings.title', 'Admin Settings')}</h1>
        <p className="text-gray-600 mb-6">
          {t('admin.settings.description', 'Manage admin settings, marketing features, and user permissions')}
        </p>

        <Tabs defaultValue="users" value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="mb-6 flex space-x-1 bg-gray-100 p-1 rounded-lg">
            <TabsTrigger value="users" className="flex-1 py-2 px-4 rounded-md data-[state=active]:bg-white data-[state=active]:shadow-sm">
              {t('admin.settings.users', 'Users')}
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex-1 py-2 px-4 rounded-md data-[state=active]:bg-white data-[state=active]:shadow-sm">
              {t('admin.settings.analytics', 'Analytics')}
            </TabsTrigger>
            <TabsTrigger value="seo" className="flex-1 py-2 px-4 rounded-md data-[state=active]:bg-white data-[state=active]:shadow-sm">
              {t('admin.settings.seo', 'SEO')}
            </TabsTrigger>
            <TabsTrigger value="discounts" className="flex-1 py-2 px-4 rounded-md data-[state=active]:bg-white data-[state=active]:shadow-sm">
              {t('admin.settings.discounts', 'Discounts')}
            </TabsTrigger>
            <TabsTrigger value="gifts" className="flex-1 py-2 px-4 rounded-md data-[state=active]:bg-white data-[state=active]:shadow-sm">
              {t('admin.settings.gifts', 'Gift Options')}
            </TabsTrigger>
            <TabsTrigger value="giftProducts" className="flex-1 py-2 px-4 rounded-md data-[state=active]:bg-white data-[state=active]:shadow-sm">
              {t('admin.settings.giftProducts', 'Gift Products')}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="users" className="mt-2">
            <AdminUserManagement />
          </TabsContent>
          
          <TabsContent value="analytics" className="mt-2">
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <h2 className="text-xl font-semibold mb-4">{t('admin.analytics.title', 'Analytics Dashboard')}</h2>
              <p className="text-gray-600 mb-6">{t('admin.analytics.description', 'View website analytics and user behavior')}</p>
              <AnalyticsDashboard dateRange={dateRange} setDateRange={setDateRange} />
            </div>
          </TabsContent>
          
          <TabsContent value="seo" className="mt-2">
            <AdminSEOManagement />
          </TabsContent>
          
          <TabsContent value="discounts" className="mt-2">
            <AdminDiscountManagement />
          </TabsContent>
          
          <TabsContent value="gifts" className="mt-2">
            <AdminGiftOptionsManagement />
          </TabsContent>
          
          <TabsContent value="giftProducts" className="mt-2">
            <AdminGiftProductsManagement />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
