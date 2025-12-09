import React from 'react';
import AdminNavigation from '../../components/AdminNavigation';
import { TranslationManager } from '../../components/admin/TranslationManager';

const TranslationsAdminPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <AdminNavigation />
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <TranslationManager />
      </div>
    </div>
  );
};

export default TranslationsAdminPage;
