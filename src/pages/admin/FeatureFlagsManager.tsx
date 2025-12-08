import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  CreditCard, 
  ShoppingCart, 
  Megaphone, 
  Palette, 
  Truck, 
  Search, 
  BarChart,
  ToggleLeft,
  ToggleRight,
  RotateCcw,
  Save,
  CheckCircle,
  AlertCircle,
  Settings,
  Zap
} from 'lucide-react';
import AdminNavigation from '../../components/AdminNavigation';
import { 
  FeatureFlag, 
  getFeatureFlags, 
  saveFeatureFlags, 
  resetFeatureFlags,
  CATEGORY_NAMES 
} from '../../config/featureFlags';

const CATEGORY_ICON_MAP: Record<FeatureFlag['category'], React.ReactNode> = {
  payment: <CreditCard className="w-5 h-5" />,
  checkout: <ShoppingCart className="w-5 h-5" />,
  marketing: <Megaphone className="w-5 h-5" />,
  ui: <Palette className="w-5 h-5" />,
  shipping: <Truck className="w-5 h-5" />,
  seo: <Search className="w-5 h-5" />,
  analytics: <BarChart className="w-5 h-5" />
};

const FeatureFlagsManager: React.FC = () => {
  const { t } = useTranslation();
  const [flags, setFlags] = useState<FeatureFlag[]>([]);
  const [unsavedChanges, setUnsavedChanges] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [activeCategory, setActiveCategory] = useState<FeatureFlag['category'] | 'all'>('all');

  useEffect(() => {
    setFlags(getFeatureFlags());
  }, []);

  const handleToggle = (flagId: string) => {
    setFlags(prevFlags => 
      prevFlags.map(flag => 
        flag.id === flagId ? { ...flag, enabled: !flag.enabled } : flag
      )
    );
    setUnsavedChanges(true);
    setSaveSuccess(false);
  };

  const handleSave = () => {
    saveFeatureFlags(flags);
    setUnsavedChanges(false);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const handleReset = () => {
    if (window.confirm(t('admin.featureFlags.confirmReset', 'Are you sure you want to reset all features to defaults?'))) {
      resetFeatureFlags();
      setFlags(getFeatureFlags());
      setUnsavedChanges(false);
    }
  };

  const enableAll = () => {
    setFlags(prevFlags => 
      prevFlags.map(flag => {
        if (activeCategory === 'all' || flag.category === activeCategory) {
          return { ...flag, enabled: true };
        }
        return flag;
      })
    );
    setUnsavedChanges(true);
  };

  const disableAll = () => {
    setFlags(prevFlags => 
      prevFlags.map(flag => {
        if (activeCategory === 'all' || flag.category === activeCategory) {
          return { ...flag, enabled: false };
        }
        return flag;
      })
    );
    setUnsavedChanges(true);
  };

  const categories = ['all', 'payment', 'checkout', 'marketing', 'ui', 'shipping', 'seo', 'analytics'] as const;
  
  const filteredFlags = activeCategory === 'all' 
    ? flags 
    : flags.filter(f => f.category === activeCategory);

  const enabledCount = filteredFlags.filter(f => f.enabled).length;
  const totalCount = filteredFlags.length;

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminNavigation />
      
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <Settings className="w-8 h-8 text-brown-600" />
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                {t('admin.featureFlags.title', 'Feature Management')}
              </h1>
              <p className="text-gray-600">
                {t('admin.featureFlags.subtitle', 'Enable or disable website features')}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            {unsavedChanges && (
              <span className="flex items-center gap-1 text-amber-600">
                <AlertCircle className="w-4 h-4" />
                {t('admin.featureFlags.unsavedChanges', 'Unsaved changes')}
              </span>
            )}
            {saveSuccess && (
              <span className="flex items-center gap-1 text-green-600">
                <CheckCircle className="w-4 h-4" />
                {t('admin.featureFlags.saved', 'Saved!')}
              </span>
            )}
            <button
              onClick={handleReset}
              className="flex items-center gap-2 px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
              {t('admin.featureFlags.reset', 'Reset')}
            </button>
            <button
              onClick={handleSave}
              disabled={!unsavedChanges}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                unsavedChanges 
                  ? 'bg-brown-600 hover:bg-brown-700 text-white' 
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              <Save className="w-4 h-4" />
              {t('admin.featureFlags.save', 'Save Changes')}
            </button>
          </div>
        </div>

        {/* Category Tabs */}
        <div className="flex flex-wrap gap-2 mb-6">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                activeCategory === cat
                  ? 'bg-brown-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
              }`}
            >
              {cat === 'all' ? (
                <Zap className="w-4 h-4" />
              ) : (
                CATEGORY_ICON_MAP[cat]
              )}
              {cat === 'all' ? t('admin.featureFlags.all', 'All') : CATEGORY_NAMES[cat]}
            </button>
          ))}
        </div>

        {/* Stats Bar */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <div>
                <span className="text-2xl font-bold text-green-600">{enabledCount}</span>
                <span className="text-gray-500 ml-1">/ {totalCount}</span>
                <span className="text-gray-500 ml-2">{t('admin.featureFlags.enabled', 'enabled')}</span>
              </div>
              <div className="h-8 w-px bg-gray-200" />
              <div className="w-48 bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-green-500 h-2 rounded-full transition-all"
                  style={{ width: `${(enabledCount / totalCount) * 100}%` }}
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={enableAll}
                className="px-3 py-1 text-sm bg-green-100 text-green-700 hover:bg-green-200 rounded transition-colors"
              >
                {t('admin.featureFlags.enableAll', 'Enable All')}
              </button>
              <button
                onClick={disableAll}
                className="px-3 py-1 text-sm bg-red-100 text-red-700 hover:bg-red-200 rounded transition-colors"
              >
                {t('admin.featureFlags.disableAll', 'Disable All')}
              </button>
            </div>
          </div>
        </div>

        {/* Feature Flags Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredFlags.map(flag => (
            <div
              key={flag.id}
              className={`bg-white rounded-lg shadow-sm border-2 transition-all ${
                flag.enabled 
                  ? 'border-green-300 bg-green-50/30' 
                  : 'border-gray-200'
              }`}
            >
              <div className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${
                      flag.enabled ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-500'
                    }`}>
                      {CATEGORY_ICON_MAP[flag.category]}
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{flag.name}</h3>
                      <span className={`text-xs px-2 py-0.5 rounded ${
                        flag.enabled 
                          ? 'bg-green-100 text-green-700' 
                          : 'bg-gray-100 text-gray-600'
                      }`}>
                        {CATEGORY_NAMES[flag.category]}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => handleToggle(flag.id)}
                    className="flex-shrink-0"
                  >
                    {flag.enabled ? (
                      <ToggleRight className="w-10 h-10 text-green-500" />
                    ) : (
                      <ToggleLeft className="w-10 h-10 text-gray-400" />
                    )}
                  </button>
                </div>
                <p className="mt-3 text-sm text-gray-600">{flag.description}</p>
                {!flag.enabled && flag.defaultEnabled && (
                  <p className="mt-2 text-xs text-amber-600 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {t('admin.featureFlags.defaultEnabled', 'This feature is enabled by default')}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Help Section */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="font-semibold text-blue-800 mb-2">
            {t('admin.featureFlags.helpTitle', 'How Feature Flags Work')}
          </h3>
          <ul className="text-sm text-blue-700 space-y-1">
            <li>• {t('admin.featureFlags.help1', 'Toggle features on/off to control what\'s visible on your website')}</li>
            <li>• {t('admin.featureFlags.help2', 'Changes take effect immediately after saving')}</li>
            <li>• {t('admin.featureFlags.help3', 'Disabled features are completely hidden from customers')}</li>
            <li>• {t('admin.featureFlags.help4', 'Use "Reset" to restore all default settings')}</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default FeatureFlagsManager;
