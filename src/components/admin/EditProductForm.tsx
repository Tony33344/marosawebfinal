import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Product, PackageOption } from '../../types';
import { supabase } from '../../lib/supabaseClient';
import { X, Plus, Trash2 } from 'lucide-react';
import { getImageUrl } from '../../utils/imageUtils';

interface EditProductFormProps {
  product: Product;
  onClose: () => void;
  onSuccess: () => void;
}

export function EditProductForm({ product, onClose, onSuccess }: EditProductFormProps) {
  const { t } = useTranslation();
  const [name, setName] = useState(product.name || '');
  const [description, setDescription] = useState(product.description || '');
  const [category, setCategory] = useState(product.category || '');
  const [imageUrl, setImageUrl] = useState(product.image_url || '');
  const [additionalImages, setAdditionalImages] = useState<string[]>(product.additional_images || []);
  const [newImageUrl, setNewImageUrl] = useState('');
  const [stockQuantity, setStockQuantity] = useState(product.stock_quantity || 0);
  const [packageOptions, setPackageOptions] = useState<PackageOption[]>(() => {
    if (typeof product.package_options === 'string') {
      try {
        return JSON.parse(product.package_options);
      } catch {
        return [{ uniq_id: '1', price: 0, weight: '', unit: 'g', description: '' }];
      }
    } else if (Array.isArray(product.package_options) && product.package_options.length > 0) {
      return product.package_options;
    }
    return [{ uniq_id: '1', price: 0, weight: '', unit: 'g', description: '' }];
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAddImage = () => {
    if (newImageUrl) {
      // Clean up the image path
      let cleanedUrl = newImageUrl.trim();
      
      // Remove any leading/trailing slashes and spaces
      cleanedUrl = cleanedUrl.replace(/^[\\/\s]+|[\\/\s]+$/g, '');
      
      // Add leading slash if not present
      if (!cleanedUrl.startsWith('/') && !cleanedUrl.startsWith('http')) {
        cleanedUrl = '/' + cleanedUrl;
      }
      
      // Replace backslashes with forward slashes
      cleanedUrl = cleanedUrl.replace(/\\/g, '/');
      
      // Fix case sensitivity for known folders
      cleanedUrl = cleanedUrl
        .replace(/\/melisa(\/|$)/i, '/Melisa$1')
        .replace(/\/poprova meta\//i, '/Poprova meta/')
        .replace(/\/konopljino olje\//i, '/konopljino olje/');
      
      // Check if this image is already in the list (case insensitive)
      if (additionalImages.some(img => img.replace(/\\/g, '/').toLowerCase() === cleanedUrl.toLowerCase())) {
        setError(t('admin.products.duplicateImage', 'This image has already been added.'));
        return;
      }
      
      // Limit to 6 images total (main image + 5 additional)
      if (additionalImages.length >= 5) {
        setError(t('admin.products.maxImagesReached', 'Maximum of 5 additional images allowed.'));
        return;
      }
      
      setAdditionalImages([...additionalImages, cleanedUrl]);
      setNewImageUrl('');
      setError(null);
    }
  };

  const handleRemoveImage = (index: number) => {
    setAdditionalImages(additionalImages.filter((_, i) => i !== index));
  };

  const handleAddPackageOption = () => {
    setPackageOptions([
      ...packageOptions,
      {
        uniq_id: `${Date.now()}`, // Generate a unique ID
        price: 0,
        weight: '',
        unit: 'g',
        description: ''
      }
    ]);
  };

  const handleRemovePackageOption = (index: number) => {
    if (packageOptions.length > 1) {
      setPackageOptions(packageOptions.filter((_, i) => i !== index));
    }
  };

  const handlePackageOptionChange = (
    index: number,
    field: keyof PackageOption,
    value: string | number
  ) => {
    const updatedOptions = [...packageOptions];
    updatedOptions[index] = {
      ...updatedOptions[index],
      [field]: field === 'price' ? parseFloat(value as string) || 0 : value
    };
    setPackageOptions(updatedOptions);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      // Ensure imageUrl is not empty for Darilni paket products
      let finalImageUrl = imageUrl;
      if (name.includes('Darilni paket') && (!imageUrl || imageUrl.trim() === '')) {
        finalImageUrl = '/images/darilni_paket/gift_package.jpg';
        console.log('Setting default image for Darilni paket:', finalImageUrl);
      }

      // Ensure category is set for Darilni paket products
      let finalCategory = category;
      if (name.includes('Darilni paket') && (!category || category.trim() === '')) {
        finalCategory = 'gift';
        console.log('Setting default category for Darilni paket:', finalCategory);
      }

      // Prepare the update data
      const updateData: any = {
        name,
        description,
        category: finalCategory,
        image_url: finalImageUrl,
        stock_quantity: stockQuantity,
        // Always include additional_images field to ensure it gets updated
        // even when all images have been removed
        additional_images: additionalImages && additionalImages.length > 0 ? additionalImages : null,
        // Include package options
        package_options: JSON.stringify(packageOptions)
      };

      // Log the data we're about to update
      console.log('Updating product with data:', {
        id: product.id,
        ...updateData
      });

      // Perform the update
      const { error: updateError } = await supabase
        .from('products')
        .update(updateData)
        .eq('id', product.id);

      if (updateError) {
        console.error('Error updating product:', updateError);
        setError(`${t('admin.products.updateError')}: ${updateError.message}`);
        setSaving(false);
        return;
      }

      // Success - call the onSuccess callback
      onSuccess();
    } catch (err: any) {
      console.error('Error in handleSubmit:', err);
      setError(`${t('admin.products.updateError')}: ${err.message || 'Unknown error'}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <div className="admin-modal-header">
        <div className="flex justify-between items-center">
          <h2 className="admin-modal-title">{t('admin.products.editProduct')}</h2>
          <button
            type="button"
            className="text-gray-400 hover:text-gray-500"
            onClick={onClose}
          >
            <X className="h-6 w-6" />
          </button>
        </div>
      </div>

      <div className="admin-modal-body">
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Basic Information Section */}
          <div className="bg-white p-6 rounded-lg border border-gray-200">
            <h3 className="text-lg font-semibold text-brown-800 mb-4 border-b border-gray-200 pb-2">
              Osnovne informacije
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                  {t('admin.products.name')} *
                </label>
                <input
                  type="text"
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-brown-500 focus:border-brown-500"
                  required
                  placeholder="Vnesite ime izdelka"
                />
              </div>

              <div>
                <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-2">
                  {t('admin.products.category')}
                </label>
                <input
                  type="text"
                  id="category"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-brown-500 focus:border-brown-500"
                  placeholder="npr. Olje, Čaj, Semena"
                />
              </div>

              <div className="md:col-span-2">
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                  {t('admin.products.description')}
                </label>
                <textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-brown-500 focus:border-brown-500"
                  rows={4}
                  placeholder="Vnesite opis izdelka"
                />
              </div>

              <div>
                <label htmlFor="stockQuantity" className="block text-sm font-medium text-gray-700 mb-2">
                  {t('admin.products.stockQuantity')}
                </label>
                <input
                  type="number"
                  id="stockQuantity"
                  min="0"
                  value={stockQuantity}
                  onChange={(e) => setStockQuantity(parseInt(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-brown-500 focus:border-brown-500"
                  placeholder="0"
                />
              </div>
            </div>
          </div>

          {/* Main Product Image Section */}
          <div className="bg-white p-6 rounded-lg border border-gray-200">
            <h3 className="text-lg font-semibold text-brown-800 mb-4 border-b border-gray-200 pb-2">
              {t('admin.products.mainImage')}
            </h3>

            {imageUrl && (
              <div className="w-full flex justify-center mb-4">
                <div className="relative w-64 h-64 overflow-hidden rounded-lg border-2 border-gray-200 bg-gray-50">
                  <img
                    src={getImageUrl(imageUrl) || '/images/placeholder-product.jpg'}
                    alt={name}
                    className="w-full h-full object-contain p-2"
                    onError={(e) => {
                      if (import.meta.env.DEV) {
                        console.error('Error loading image:', imageUrl);
                      }
                      (e.target as HTMLImageElement).src = '/images/placeholder-product.jpg';
                    }}
                  />
                </div>
              </div>
            )}

            <div>
              <label htmlFor="imageUrl" className="block text-sm font-medium text-gray-700 mb-2">
                {t('admin.products.imageUrl')}
              </label>
              <div className="space-y-3">
                <input
                  type="text"
                  id="imageUrl"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-brown-500 focus:border-brown-500"
                  placeholder="/images/imeizdelka/slika.jpg"
                />
                <div className="flex items-center gap-3">
                  <span className="text-sm text-gray-500">{t('admin.products.or')}</span>
                  <label className="cursor-pointer bg-brown-100 hover:bg-brown-200 text-brown-800 px-4 py-2 rounded-md text-sm transition-colors">
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const fileName = file.name;
                          const productFolder = name.toLowerCase().trim().replace(/\s+/g, ' ') || 'product';
                          const correctPath = `/images/${productFolder}/${fileName}`;
                          setImageUrl(correctPath);
                          console.log('Selected file:', file.name);
                          console.log('Set path to:', correctPath);
                        }
                      }}
                    />
                    {t('admin.products.selectFile')}
                  </label>
                </div>
                <p className="text-xs text-gray-500">
                  {t('admin.products.imagePathHelp')}
                </p>
              </div>
            </div>
          </div>

          {/* Additional Images Section */}
          <div className="bg-white p-6 rounded-lg border border-gray-200">
            <h3 className="text-lg font-semibold text-brown-800 mb-4 border-b border-gray-200 pb-2">
              {t('admin.products.additionalImages')}
              <span className="text-sm font-normal text-gray-500 ml-2">({additionalImages.length}/5)</span>
            </h3>

            {/* Additional Images Grid */}
            {additionalImages.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4 mb-6">
                {additionalImages.map((imgUrl, index) => (
                  <div key={index} className="relative group">
                    <div className="w-full aspect-square overflow-hidden rounded-lg border-2 border-gray-200 bg-gray-50">
                      <img
                        src={getImageUrl(imgUrl) || '/images/placeholder-product.jpg'}
                        alt={`${name} - Slika ${index + 1}`}
                        className="w-full h-full object-contain p-1"
                        onError={(e) => {
                          if (import.meta.env.DEV) {
                            console.error('Error loading additional image:', imgUrl);
                          }
                          (e.target as HTMLImageElement).src = '/images/placeholder-product.jpg';
                        }}
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveImage(index)}
                      className="absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-all duration-200 shadow-lg"
                      title={t('admin.products.removeImage')}
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Add New Image Form */}
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="flex-1">
                  <label htmlFor="newImageUrl" className="block text-sm font-medium text-gray-700 mb-2">
                    {t('admin.products.addNewImage')}
                  </label>
                  <input
                    type="text"
                    id="newImageUrl"
                    value={newImageUrl}
                    onChange={(e) => setNewImageUrl(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-brown-500 focus:border-brown-500"
                    placeholder="/images/imeizdelka/slika.jpg"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddImage();
                      }
                    }}
                  />
                </div>
                <div className="flex items-end">
                  <button
                    type="button"
                    onClick={handleAddImage}
                    className="px-4 py-2 bg-brown-600 hover:bg-brown-700 text-white rounded-md transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                    disabled={!newImageUrl || additionalImages.length >= 5}
                  >
                    {t('admin.products.addImage')}
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <span className="text-sm text-gray-500">{t('admin.products.or')}</span>
                <label className="cursor-pointer bg-brown-100 hover:bg-brown-200 text-brown-800 px-4 py-2 rounded-md text-sm transition-colors">
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const fileName = file.name;
                        const productFolder = name.toLowerCase().trim().replace(/\s+/g, ' ') || 'product';
                        const correctPath = `/images/${productFolder}/${fileName}`;
                        setNewImageUrl(correctPath);
                        console.log('Selected additional file:', file.name);
                      }
                    }}
                  />
                  {t('admin.products.selectFile')}
                </label>
              </div>

              <div className="bg-blue-50 p-4 rounded-md">
                <p className="text-sm text-blue-800 font-medium mb-2">
                  {t('admin.products.note')}
                </p>
                <ul className="text-sm text-blue-700 space-y-1">
                  <li>• {t('admin.products.imageTip1')}</li>
                  <li>• {t('admin.products.imageTip2')}</li>
                  <li className="text-blue-900 font-medium">• {t('admin.products.imageTip3')}</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Package Options Section */}
          <div className="bg-white p-6 rounded-lg border border-gray-200">
            <h3 className="text-lg font-semibold text-brown-800 mb-4 border-b border-gray-200 pb-2">
              {t('admin.products.packageOptions')}
            </h3>

            <div className="space-y-4">
              {packageOptions.map((option, index) => (
                <div key={option.uniq_id} className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                  <div className="flex justify-between items-center mb-4">
                    <h4 className="text-base font-medium text-gray-800">
                      Možnost pakiranja {index + 1}
                    </h4>
                    <button
                      type="button"
                      className="px-3 py-1.5 bg-red-500 hover:bg-red-600 text-white text-sm rounded-md transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                      onClick={() => handleRemovePackageOption(index)}
                      disabled={packageOptions.length === 1}
                    >
                      <Trash2 className="h-4 w-4 mr-1 inline" />
                      {t('admin.products.removeOption')}
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label
                        htmlFor={`option-description-${index}`}
                        className="block text-sm font-medium text-gray-700 mb-2"
                      >
                        {t('admin.products.optionDescription')} *
                      </label>
                      <input
                        type="text"
                        id={`option-description-${index}`}
                        value={option.description}
                        onChange={(e) =>
                          handlePackageOptionChange(index, 'description', e.target.value)
                        }
                        placeholder="npr. 250g steklenica"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-brown-500 focus:border-brown-500"
                      />
                    </div>

                    <div>
                      <label
                        htmlFor={`option-price-${index}`}
                        className="block text-sm font-medium text-gray-700 mb-2"
                      >
                        {t('admin.products.price')} (€) *
                      </label>
                      <input
                        type="number"
                        id={`option-price-${index}`}
                        min="0"
                        step="0.01"
                        value={option.price}
                        onChange={(e) =>
                          handlePackageOptionChange(index, 'price', e.target.value)
                        }
                        placeholder="0.00"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-brown-500 focus:border-brown-500"
                      />
                    </div>

                    <div>
                      <label
                        htmlFor={`option-weight-${index}`}
                        className="block text-sm font-medium text-gray-700 mb-2"
                      >
                        {t('admin.products.weight')} *
                      </label>
                      <div className="flex">
                        <input
                          type="text"
                          id={`option-weight-${index}`}
                          value={option.weight}
                          placeholder="npr. 0,5 ali 250"
                          onChange={(e) =>
                            handlePackageOptionChange(index, 'weight', e.target.value)
                          }
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-l-md shadow-sm focus:outline-none focus:ring-2 focus:ring-brown-500 focus:border-brown-500"
                        />
                        <select
                          value={option.unit}
                          onChange={(e) =>
                            handlePackageOptionChange(index, 'unit', e.target.value)
                          }
                          className="px-3 py-2 border border-l-0 border-gray-300 rounded-r-md shadow-sm focus:outline-none focus:ring-2 focus:ring-brown-500 focus:border-brown-500 bg-white"
                        >
                          <option value="g">g</option>
                          <option value="kg">kg</option>
                          <option value="ml">ml</option>
                          <option value="l">l</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              <button
                type="button"
                className="w-full mt-4 px-4 py-2 border-2 border-dashed border-brown-300 text-brown-600 hover:border-brown-400 hover:text-brown-700 rounded-lg transition-colors"
                onClick={handleAddPackageOption}
              >
                <Plus className="h-5 w-5 mr-2 inline" />
                {t('admin.products.addOption')}
              </button>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
            <button
              type="button"
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={onClose}
              disabled={saving}
            >
              {t('admin.products.cancel')}
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-brown-600 hover:bg-brown-700 text-white rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={saving}
            >
              {saving ? t('admin.products.saving') : t('admin.products.save')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
