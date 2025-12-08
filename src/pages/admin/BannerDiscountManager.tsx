import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { supabase } from '../../lib/supabaseClient';
import { TimeLimitedDiscount } from '../../services/discountService';
import { LimitedTimeOffer } from '../../components/LimitedTimeOffer';
import AdminNavigation from '../../components/AdminNavigation';

export function BannerDiscountManager() {
  const { t } = useTranslation();
  const [discounts, setDiscounts] = useState<TimeLimitedDiscount[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [editingDiscount, setEditingDiscount] = useState<TimeLimitedDiscount | null>(null);
  const [formMode, setFormMode] = useState<'create' | 'edit' | null>(null);

  // Initial form state for new discount
  const initialFormState: Omit<TimeLimitedDiscount, 'id'> = {
    code: '',
    description: 'Limited time offer',
    discount_type: 'percentage',
    discount_value: 15,
    min_order_amount: null,
    max_uses: null,
    current_uses: 0,
    valid_from: new Date().toISOString().split('T')[0],
    valid_until: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    is_active: true,
    category: 'oils',
    product_id: undefined,
    product_name: undefined,
    banner_text: '',
    show_in_banner: true,
    banner_start_time: new Date().toISOString().split('T')[0],
    banner_end_time: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  };

  const [formData, setFormData] = useState<Omit<TimeLimitedDiscount, 'id'>>(initialFormState);

  // Fetch discounts on mount
  useEffect(() => {
    fetchDiscounts();
  }, []);

  // Fetch active discounts from the database
  const fetchDiscounts = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch discount codes from the database
      const { data, error: fetchError } = await supabase
        .from('discount_codes')
        .select('*')
        .order('valid_until', { ascending: false });

      if (fetchError) {
        console.error('Error fetching discounts:', fetchError);
        throw fetchError;
      }

      setDiscounts(data || []);
    } catch (err: any) {
      console.error('Error fetching discounts:', err);
      setError(t('admin.discounts.fetchError', 'Failed to load discounts'));
    } finally {
      setLoading(false);
    }
  };

  // Handle form input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target as HTMLInputElement;

    // Handle checkboxes
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({ ...prev, [name]: checked }));
      return;
    }

    // Handle number inputs
    if (type === 'number') {
      setFormData(prev => ({ ...prev, [name]: value === '' ? null : Number(value) }));
      return;
    }

    // Handle other inputs
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setLoading(true);
      setError(null);
      setSuccess(null);

      if (formMode === 'create') {
        // Create new discount in database
        const { error: insertError } = await supabase
          .from('discount_codes')
          .insert([formData]);

        if (insertError) throw insertError;

        setSuccess(t('admin.discounts.createSuccess', 'Discount created successfully'));
      } else if (formMode === 'edit' && editingDiscount) {
        // Update existing discount in database
        const { error: updateError } = await supabase
          .from('discount_codes')
          .update(formData)
          .eq('id', editingDiscount.id);

        if (updateError) throw updateError;

        setSuccess(t('admin.discounts.updateSuccess', 'Discount updated successfully'));
      }

      // Reset form and fetch updated discounts
      setFormMode(null);
      setEditingDiscount(null);
      setFormData(initialFormState);
      fetchDiscounts();
    } catch (err: any) {
      console.error('Error saving discount:', err);
      setError(t('admin.discounts.saveError', 'Failed to save discount'));
    } finally {
      setLoading(false);
    }
  };

  // Handle edit button click
  const handleEdit = (discount: TimeLimitedDiscount) => {
    setEditingDiscount(discount);
    setFormData({
      code: discount.code,
      description: discount.description,
      discount_type: discount.discount_type,
      discount_value: discount.discount_value,
      min_order_amount: discount.min_order_amount,
      max_uses: discount.max_uses,
      current_uses: discount.current_uses,
      valid_from: new Date(discount.valid_from).toISOString().split('T')[0],
      valid_until: new Date(discount.valid_until).toISOString().split('T')[0],
      is_active: discount.is_active,
      category: discount.category,
      product_id: discount.product_id,
      product_name: discount.product_name,
      banner_text: discount.banner_text || '',
      show_in_banner: discount.show_in_banner || false,
      banner_start_time: discount.banner_start_time ? new Date(discount.banner_start_time).toISOString().split('T')[0] : '',
      banner_end_time: discount.banner_end_time ? new Date(discount.banner_end_time).toISOString().split('T')[0] : ''
    });
    setFormMode('edit');
  };

  // Handle delete button click
  const handleDelete = async (id: string) => {
    if (!window.confirm(t('admin.discounts.confirmDelete', 'Are you sure you want to delete this discount?'))) {
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setSuccess(null);

      const { error: deleteError } = await supabase
        .from('discount_codes')
        .delete()
        .eq('id', id);

      if (deleteError) throw deleteError;

      setSuccess(t('admin.discounts.deleteSuccess', 'Discount deleted successfully'));
      fetchDiscounts();
    } catch (err: any) {
      console.error('Error deleting discount:', err);
      setError(t('admin.discounts.deleteError', 'Failed to delete discount'));
    } finally {
      setLoading(false);
    }
  };

  // Toggle discount active status
  const toggleActive = async (id: string, currentStatus: boolean) => {
    try {
      setLoading(true);
      setError(null);
      setSuccess(null);

      const { error: toggleError } = await supabase
        .from('discount_codes')
        .update({ is_active: !currentStatus })
        .eq('id', id);

      if (toggleError) throw toggleError;

      setSuccess(t('admin.discounts.statusUpdateSuccess', 'Discount status updated successfully'));
      fetchDiscounts();
    } catch (err: any) {
      console.error('Error updating discount status:', err);
      setError(t('admin.discounts.statusUpdateError', 'Failed to update discount status'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminNavigation />
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-6">{t('admin.discounts.bannerTitle', 'Banner Discount Manager')}</h1>

      {/* Error and success messages */}
      {error && (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-100 border-l-4 border-green-500 text-green-700 p-4 mb-4">
          {success}
        </div>
      )}

      {/* Create new discount button */}
      {!formMode && (
        <button
          onClick={() => {
            setFormData(initialFormState);
            setFormMode('create');
          }}
          className="bg-blue-500 text-white px-4 py-2 rounded mb-6 hover:bg-blue-600"
        >
          {t('admin.discounts.createNew', 'Create New Banner Discount')}
        </button>
      )}

      {/* Discount form */}
      {formMode && (
        <div className="bg-white p-6 rounded-lg shadow-md mb-8">
          <h2 className="text-xl font-semibold mb-4">
            {formMode === 'create'
              ? t('admin.discounts.createNew', 'Create New Banner Discount')
              : t('admin.discounts.editDiscount', 'Edit Banner Discount')}
          </h2>

          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              {/* Code */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('admin.discounts.code', 'Discount Code')}
                </label>
                <input
                  type="text"
                  name="code"
                  value={formData.code}
                  onChange={handleInputChange}
                  className="w-full p-2 border rounded"
                  required
                />
              </div>

              {/* Discount Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('admin.discounts.discountType', 'Discount Type')}
                </label>
                <select
                  name="discount_type"
                  value={formData.discount_type}
                  onChange={handleInputChange}
                  className="w-full p-2 border rounded"
                  required
                >
                  <option value="percentage">{t('admin.discounts.percentage', 'Percentage')}</option>
                  <option value="fixed">{t('admin.discounts.fixed', 'Fixed Amount')}</option>
                </select>
              </div>

              {/* Discount Value */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('admin.discounts.discountValue', 'Discount Value')}
                </label>
                <input
                  type="number"
                  name="discount_value"
                  value={formData.discount_value}
                  onChange={handleInputChange}
                  className="w-full p-2 border rounded"
                  min="0"
                  max={formData.discount_type === 'percentage' ? 100 : undefined}
                  step={formData.discount_type === 'percentage' ? 1 : 0.01}
                  required
                />
              </div>

              {/* Valid From */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('admin.discounts.validFrom', 'Valid From')}
                </label>
                <input
                  type="date"
                  name="valid_from"
                  value={formData.valid_from}
                  onChange={handleInputChange}
                  className="w-full p-2 border rounded"
                  required
                />
              </div>

              {/* Valid Until */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('admin.discounts.validUntil', 'Valid Until')}
                </label>
                <input
                  type="date"
                  name="valid_until"
                  value={formData.valid_until}
                  onChange={handleInputChange}
                  className="w-full p-2 border rounded"
                  required
                />
              </div>

              {/* Description */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('admin.discounts.description', 'Description')}
                </label>
                <input
                  type="text"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  className="w-full p-2 border rounded"
                  required
                />
              </div>

              {/* Category */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('admin.discounts.category', 'Category (optional)')}
                </label>
                <input
                  type="text"
                  name="category"
                  value={formData.category || ''}
                  onChange={handleInputChange}
                  className="w-full p-2 border rounded"
                />
              </div>

              {/* Is Active */}
              <div className="flex items-center">
                <input
                  type="checkbox"
                  name="is_active"
                  checked={formData.is_active}
                  onChange={handleInputChange}
                  className="h-4 w-4 text-blue-600 border-gray-300 rounded"
                />
                <label className="ml-2 block text-sm text-gray-700">
                  {t('admin.discounts.isActive', 'Active')}
                </label>
              </div>

              {/* Banner Settings */}
              <div className="md:col-span-2 mt-6 border-t pt-4">
                <h3 className="text-lg font-medium mb-4">
                  {t('admin.discounts.bannerSettings', 'Banner Settings')}
                </h3>

                {/* Show in Banner */}
                <div className="flex items-center mb-4">
                  <input
                    type="checkbox"
                    name="show_in_banner"
                    checked={formData.show_in_banner}
                    onChange={handleInputChange}
                    className="h-4 w-4 text-blue-600 border-gray-300 rounded"
                  />
                  <label className="ml-2 block text-sm text-gray-700">
                    {t('admin.discounts.showInBanner', 'Show in promotional banner')}
                  </label>
                </div>

                {/* Banner Text */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('admin.discounts.bannerText', 'Banner Text')}
                  </label>
                  <input
                    type="text"
                    name="banner_text"
                    value={formData.banner_text}
                    onChange={handleInputChange}
                    className="w-full p-2 border rounded"
                    placeholder={`Use code ${formData.code} for ${formData.discount_type === 'percentage' ? formData.discount_value + '%' : '€' + formData.discount_value} off!`}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Banner Start Time */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {t('admin.discounts.bannerStartTime', 'Banner Start Time')}
                    </label>
                    <input
                      type="date"
                      name="banner_start_time"
                      value={formData.banner_start_time}
                      onChange={handleInputChange}
                      className="w-full p-2 border rounded"
                    />
                  </div>

                  {/* Banner End Time */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {t('admin.discounts.bannerEndTime', 'Banner End Time')}
                    </label>
                    <input
                      type="date"
                      name="banner_end_time"
                      value={formData.banner_end_time}
                      onChange={handleInputChange}
                      className="w-full p-2 border rounded"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-2">
              <button
                type="button"
                onClick={() => {
                  setFormMode(null);
                  setEditingDiscount(null);
                  setFormData(initialFormState);
                }}
                className="px-4 py-2 border border-gray-300 rounded text-gray-700 hover:bg-gray-50"
              >
                {t('common.cancel', 'Cancel')}
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                disabled={loading}
              >
                {loading
                  ? t('common.saving', 'Saving...')
                  : formMode === 'create'
                    ? t('common.create', 'Create')
                    : t('common.update', 'Update')}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Discounts list */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <h2 className="text-xl font-semibold p-4 bg-gray-50 border-b">
          {t('admin.discounts.currentDiscounts', 'Current Banner Discounts')}
        </h2>

        {loading && !formMode ? (
          <div className="p-4 text-center">{t('common.loading', 'Loading...')}</div>
        ) : discounts.length === 0 ? (
          <div className="p-4 text-center text-gray-500">
            {t('admin.discounts.noDiscounts', 'No banner discounts found')}
          </div>
        ) : (
          <div className="divide-y">
            {discounts.map(discount => (
              <div key={discount.id} className="p-4">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <span className="font-mono text-sm bg-gray-100 px-2 py-1 rounded">
                      {discount.code}
                    </span>
                    <span className={`ml-2 px-2 py-1 text-xs rounded ${
                      discount.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                    }`}>
                      {discount.is_active
                        ? t('admin.discounts.active', 'Active')
                        : t('admin.discounts.inactive', 'Inactive')}
                    </span>
                    <span className={`ml-2 px-2 py-1 text-xs rounded ${
                      discount.show_in_banner ? 'bg-amber-100 text-amber-800' : 'bg-gray-100 text-gray-800'
                    }`}>
                      {discount.show_in_banner
                        ? t('admin.discounts.showingInBanner', 'In Banner')
                        : t('admin.discounts.notShowingInBanner', 'Hidden')}
                    </span>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => toggleActive(discount.id as string, discount.is_active)}
                      className={`px-3 py-1 rounded text-sm ${
                        discount.is_active
                          ? 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200'
                          : 'bg-green-100 text-green-800 hover:bg-green-200'
                      }`}
                    >
                      {discount.is_active
                        ? t('admin.discounts.deactivate', 'Deactivate')
                        : t('admin.discounts.activate', 'Activate')}
                    </button>
                    <button
                      onClick={() => handleEdit(discount)}
                      className="px-3 py-1 bg-blue-100 text-blue-800 rounded text-sm hover:bg-blue-200"
                    >
                      {t('admin.discounts.edit', 'Edit')}
                    </button>
                    <button
                      onClick={() => handleDelete(discount.id as string)}
                      className="px-3 py-1 bg-red-100 text-red-800 rounded text-sm hover:bg-red-200"
                    >
                      {t('admin.discounts.delete', 'Delete')}
                    </button>
                  </div>
                </div>

                <div className="mt-2">
                  <p className="text-sm text-gray-600">
                    {t('admin.discounts.validityPeriod', 'Valid from {{from}} to {{to}}', {
                      from: new Date(discount.valid_from).toLocaleDateString(),
                      to: new Date(discount.valid_until).toLocaleDateString()
                    })}
                  </p>
                  <p className="text-sm font-medium mt-1">{discount.description}</p>
                  <p className="text-sm text-gray-600 mt-1">
                    {discount.discount_type === 'percentage'
                      ? `${discount.discount_value}% off`
                      : `€${discount.discount_value} off`}
                    {discount.min_order_amount ? ` (min €${discount.min_order_amount})` : ''}
                  </p>
                  {discount.show_in_banner && discount.banner_text && (
                    <p className="text-sm text-amber-600 mt-1">
                      <span className="font-medium">Banner:</span> {discount.banner_text}
                    </p>
                  )}
                </div>

                {/* Preview */}
                <div className="mt-4 border rounded overflow-hidden">
                  <div className="bg-gray-50 px-3 py-1 text-xs font-medium border-b">
                    {t('admin.discounts.preview', 'Preview')}
                  </div>
                  <div className="p-2">
                    <LimitedTimeOffer
                      discount={discount}
                      dismissed={false}
                      onDismiss={() => {}}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      </div>
    </div>
  );
}
