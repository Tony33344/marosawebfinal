import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

const AdminNavigation: React.FC = () => {
  const { t } = useTranslation();
  const location = useLocation();

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  // Log the current location for debugging
  console.log('AdminNavigation - Current location:', location.pathname);

  return (
    <div className="bg-white shadow-md rounded-lg mb-6">
      <nav className="flex flex-wrap">
        <Link
          to="/admin/orders"
          className={`px-6 py-3 text-center flex-1 ${isActive('/admin/orders')
            ? 'bg-amber-600 text-white font-medium'
            : 'text-gray-700 hover:bg-amber-50'}`}
          onClick={(e) => {
            // Log click for debugging
            console.log('Orders link clicked');
            // Force navigation to ensure it works
            e.preventDefault();
            window.location.href = '/admin/orders';
          }}
        >
          {t('admin.navigation.orders', 'Order Management')}
        </Link>
        <Link
          to="/admin/products"
          className={`px-6 py-3 text-center flex-1 ${isActive('/admin/products')
            ? 'bg-amber-600 text-white font-medium'
            : 'text-gray-700 hover:bg-amber-50'}`}
          onClick={(e) => {
            // Log click for debugging
            console.log('Products link clicked');
            // Force navigation to ensure it works
            e.preventDefault();
            window.location.href = '/admin/products';
          }}
        >
          {t('admin.navigation.products', 'Product Management')}
        </Link>
        <Link
          to="/admin/settings"
          className={`px-6 py-3 text-center flex-1 ${isActive('/admin/settings')
            ? 'bg-amber-600 text-white font-medium'
            : 'text-gray-700 hover:bg-amber-50'}`}
          onClick={(e) => {
            // Log click for debugging
            console.log('Settings link clicked');
            // Force navigation to ensure it works
            e.preventDefault();
            window.location.href = '/admin/settings';
          }}
        >
          {t('admin.navigation.settings', 'Admin Settings')}
        </Link>
        <Link
          to="/admin/banner-discounts"
          className={`px-6 py-3 text-center flex-1 ${isActive('/admin/banner-discounts')
            ? 'bg-amber-600 text-white font-medium'
            : 'text-gray-700 hover:bg-amber-50'}`}
          onClick={(e) => {
            // Log click for debugging
            console.log('Banner Discounts link clicked');
            // Force navigation to ensure it works
            e.preventDefault();
            window.location.href = '/admin/banner-discounts';
          }}
        >
          {t('admin.navigation.bannerDiscounts', 'Banner Discounts')}
        </Link>
        <Link
          to="/admin/translations"
          className={`px-6 py-3 text-center flex-1 ${isActive('/admin/translations')
            ? 'bg-amber-600 text-white font-medium'
            : 'text-gray-700 hover:bg-amber-50'}`}
          onClick={(e) => {
            // Log click for debugging
            console.log('Translations link clicked');
            // Force navigation to ensure it works
            e.preventDefault();
            window.location.href = '/admin/translations';
          }}
        >
          {t('admin.navigation.translations', 'Translations')}
        </Link>
        <Link
          to="/admin/features"
          className={`px-6 py-3 text-center flex-1 ${isActive('/admin/features')
            ? 'bg-amber-600 text-white font-medium'
            : 'text-gray-700 hover:bg-amber-50'}`}
          onClick={(e) => {
            console.log('Features link clicked');
            e.preventDefault();
            window.location.href = '/admin/features';
          }}
        >
          {t('admin.navigation.features', 'Features')}
        </Link>
      </nav>
    </div>
  );
};

export default AdminNavigation;
