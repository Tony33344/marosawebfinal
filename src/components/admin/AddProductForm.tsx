import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { supabase } from '../../lib/supabaseClient';
import { X, Plus, Trash2 } from 'lucide-react';
import { getImageUrl } from '../../utils/imageUtils';

interface AddProductFormProps {
  onClose: () => void;
  onSuccess: () => void;
}

export function AddProductForm({ onClose, onSuccess }: AddProductFormProps) {
  const { t } = useTranslation();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [additionalImages, setAdditionalImages] = useState<string[]>([]);
  const [newImageUrl, setNewImageUrl] = useState('');
  const [stockQuantity, setStockQuantity] = useState(0);
  const [packageOptions, setPackageOptions] = useState([
    { uniq_id: '1', price: 0, weight: '', unit: 'g', description: '' }
  ]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [nextProductId, setNextProductId] = useState<number | null>(null);

  // Fetch the next available product ID when the component mounts
  useEffect(() => {
    const fetchNextAvailableProductId = async () => {
      try {
        // Get all product IDs
        const { data, error } = await supabase
          .from('products')
          .select('id')
          .order('id', { ascending: true });

        if (error) {
          console.error('Error fetching product IDs:', error);
          return;
        }

        if (data && data.length > 0) {
          // Convert all IDs to numbers
          const existingIds = data.map(product => parseInt(product.id, 10))
            .filter(id => !isNaN(id)) // Filter out any invalid IDs
            .sort((a, b) => a - b); // Sort in ascending order

          console.log('Existing product IDs:', existingIds);

          // Find the first gap in the sequence
          let nextId = 1;
          for (const id of existingIds) {
            if (id > nextId) {
              // We found a gap, use this ID
              break;
            }
            nextId = id + 1;
          }

          console.log('Next available product ID:', nextId);
          setNextProductId(nextId);
        } else {
          setNextProductId(1); // No products yet, start with ID 1
        }
      } catch (err) {
        console.error('Error in fetchNextAvailableProductId:', err);
      }
    };

    fetchNextAvailableProductId();
  }, []);

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

  const handleAddImage = () => {
    if (newImageUrl && !additionalImages.includes(newImageUrl)) {
      // Limit to 6 images total (main image + 5 additional)
      if (additionalImages.length >= 5) {
        setError(t('admin.products.maxImagesReached', 'Maximum of 5 additional images allowed.'));
        return;
      }
      setAdditionalImages([...additionalImages, newImageUrl]);
      setNewImageUrl('');
    }
  };

  const handleRemoveImage = (index: number) => {
    setAdditionalImages(additionalImages.filter((_, i) => i !== index));
  };

  const handlePackageOptionChange = (
    index: number,
    field: keyof typeof packageOptions[0],
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
      // Validate inputs
      if (!name.trim()) {
        setError(t('admin.products.nameRequired'));
        return;
      }

      if (packageOptions.length === 0) {
        setError(t('admin.products.packageOptionsRequired'));
        return;
      }

      if (nextProductId === null) {
        setError(t('admin.products.noIdAvailable'));
        return;
      }

      // Special handling for Darilni paket products
      let finalImageUrl = imageUrl;
      let finalCategory = category;

      if (name.includes('Darilni paket')) {
        // Set default image if not provided
        if (!imageUrl || imageUrl.trim() === '') {
          finalImageUrl = '/images/darilni_paket/gift_package.jpg';
          console.log('Setting default image for Darilni paket:', finalImageUrl);
        }

        // Set default category if not provided
        if (!category || category.trim() === '') {
          finalCategory = 'gift';
          console.log('Setting default category for Darilni paket:', finalCategory);
        }
      }

      // Prepare the product data
      const productData: any = {
        id: nextProductId,
        name,
        description,
        category: finalCategory,
        image_url: finalImageUrl,
        stock_quantity: stockQuantity,
        package_options: JSON.stringify(packageOptions)
      };

      // Only include additional_images if it's not empty
      if (additionalImages && additionalImages.length > 0) {
        productData.additional_images = additionalImages;
      }

      // Create the product
      const { error: createError } = await supabase.from('products').insert(productData);

      if (createError) {
        console.error('Error creating product:', createError);
        setError(`${t('admin.products.createError')}: ${createError.message}`);
        setSaving(false);
        return;
      }

      // Success - call the onSuccess callback
      onSuccess();
    } catch (err: any) {
      console.error('Error in handleSubmit:', err);
      setError(`${t('admin.products.createError')}: ${err.message || 'Unknown error'}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <div className="admin-modal-header">
        <div className="flex justify-between items-center">
          <h2 className="admin-modal-title">{t('admin.products.addProduct')}</h2>
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

        {nextProductId !== null && (
          <div className="bg-blue-100 border border-blue-400 text-blue-700 px-4 py-3 rounded mb-4">
            {t('admin.products.nextProductId')}: {nextProductId}
          </div>
        )}

        <form onSubmit={handleSubmit} className="admin-form">
          {/* Main Product Image Preview */}
          <div className="mb-6">
            <h3 className="text-lg font-medium text-brown-800 mb-2">{t('admin.products.mainImage', 'Main Product Image')}</h3>
            {imageUrl && (
              <div className="w-full flex justify-center mb-4">
                <div className="relative w-64 h-64 overflow-hidden rounded-md border border-brown-200">
                  <img
                    src={getImageUrl(imageUrl) || '/images/placeholder-product.jpg'}
                    alt={name || 'Product preview'}
                    className="w-full h-full object-contain p-2"
                    onError={(e) => {
                      // Only log in development
                      if (import.meta.env.DEV) {
                        console.error('Error loading image:', imageUrl);
                      }
                      // Use a local placeholder image instead of external URL to avoid CORS issues
                      (e.target as HTMLImageElement).src = '/images/placeholder-product.jpg';
                    }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Additional Images Section */}
          <div className="mb-6">
            <h3 className="text-lg font-medium text-brown-800 mb-2">
              {t('admin.products.additionalImages', 'Additional Images')}
              <span className="text-sm font-normal text-gray-500 ml-2">({additionalImages.length}/5)</span>
            </h3>

            {/* Additional Images Grid */}
            {additionalImages.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4 mb-4">
                {additionalImages.map((imgUrl, index) => (
                  <div key={index} className="relative group">
                    <div className="w-full aspect-square overflow-hidden rounded-md border border-brown-200">
                      <img
                        src={getImageUrl(imgUrl) || '/images/placeholder-product.jpg'}
                        alt={`Product image ${index + 1}`}
                        className="w-full h-full object-contain p-1"
                        onError={(e) => {
                          // Only log in development
                          if (import.meta.env.DEV) {
                            console.error('Error loading additional image:', imgUrl);
                          }
                          // Use a local placeholder image instead of external URL to avoid CORS issues
                          (e.target as HTMLImageElement).src = '/images/placeholder-product.jpg';
                        }}
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveImage(index)}
                      className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                      title={t('admin.products.removeImage', 'Remove Image')}
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Add New Image Form */}
            <div className="flex flex-col gap-2 mt-4">
              <div className="flex items-end gap-2">
                <div className="flex-1">
                  <label htmlFor="newImageUrl" className="block text-sm font-medium text-brown-700 mb-1">
                    {t('admin.products.addNewImage', 'Add New Image URL')}
                  </label>
                  <input
                    type="text"
                    id="newImageUrl"
                    value={newImageUrl}
                    onChange={(e) => setNewImageUrl(e.target.value)}
                    className="admin-form-input"
                    placeholder="/images/productname/image.jpg or https://example.com/image.jpg"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleAddImage}
                  className="admin-button-secondary h-10"
                  disabled={!newImageUrl || additionalImages.length >= 5}
                >
                  {t('admin.products.addImage', 'Add')}
                </button>
              </div>

              <div className="flex items-center mt-2">
                <span className="text-sm text-gray-600 mr-2">{t('admin.products.or', 'Or')}</span>
                <label className="cursor-pointer bg-brown-100 hover:bg-brown-200 text-brown-800 px-3 py-2 rounded-md text-sm transition-colors">
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        // Create a path to the images folder with the correct format
                        const fileName = file.name;
                        // Get the product name or use a default folder
                        // For "caj konoplja", use the full name as the folder
                        const productFolder = name.toLowerCase().trim().replace(/\s+/g, ' ') || 'product';
                        // Use the correct path format: /images/productname/filename.jpg
                        const correctPath = `/images/${productFolder}/${fileName}`;
                        setNewImageUrl(correctPath);

                        // Optional: You could also implement actual file upload here
                        // For now, we're just setting the path assuming the user will upload manually
                        console.log('Selected additional file:', file.name);
                        console.log('Set additional image path to:', correctPath);
                      }
                    }}
                  />
                  {t('admin.products.selectFile', 'Select Image File')}
                </label>
              </div>
            </div>
          </div>

          <div className="admin-form-section">
            <div className="admin-form-group">
              <label htmlFor="name" className="admin-form-label">
                {t('admin.products.name')}:
              </label>
              <div className="admin-form-field">
                <input
                  type="text"
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="admin-form-input"
                  required
                />
              </div>
            </div>

            <div className="admin-form-group">
              <label htmlFor="description" className="admin-form-label">
                {t('admin.products.description')}:
              </label>
              <div className="admin-form-field">
                <textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="admin-form-textarea"
                  rows={4}
                />
              </div>
            </div>

            <div className="admin-form-group">
              <label htmlFor="category" className="admin-form-label">
                {t('admin.products.category')}:
              </label>
              <div className="admin-form-field">
                <input
                  type="text"
                  id="category"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="admin-form-input"
                />
              </div>
            </div>

            <div className="admin-form-group">
              <label htmlFor="imageUrl" className="admin-form-label">
                {t('admin.products.imageUrl')}:
              </label>
              <div className="admin-form-field">
                <div className="flex flex-col space-y-2">
                  <input
                    type="text"
                    id="imageUrl"
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    className="admin-form-input"
                    placeholder="/images/productname/image.jpg or https://example.com/image.jpg"
                  />
                  <div className="flex items-center">
                    <span className="text-sm text-gray-600 mr-2">{t('admin.products.or', 'Or')}</span>
                    <label className="cursor-pointer bg-brown-100 hover:bg-brown-200 text-brown-800 px-3 py-2 rounded-md text-sm transition-colors">
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            // Create a path to the images folder with the correct format
                            const fileName = file.name;
                            // Get the product name or use a default folder
                            // For "caj konoplja", use the full name as the folder
                            const productFolder = name.toLowerCase().trim().replace(/\s+/g, ' ') || 'product';
                            // Use the correct path format: /images/productname/filename.jpg
                            const correctPath = `/images/${productFolder}/${fileName}`;
                            setImageUrl(correctPath);

                            // Optional: You could also implement actual file upload here
                            // For now, we're just setting the path assuming the user will upload manually
                            console.log('Selected file:', file.name);
                            console.log('Set path to:', correctPath);
                          }
                        }}
                      />
                      {t('admin.products.selectFile', 'Select Image File')}
                    </label>
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {t('admin.products.imagePathHelp', 'For local images, use path like: /images/productname/image.jpg')}
                </p>
              </div>
            </div>

            <div className="admin-form-group">
              <label htmlFor="stockQuantity" className="admin-form-label">
                {t('admin.products.stockQuantity')}:
              </label>
              <div className="admin-form-field">
                <input
                  type="number"
                  id="stockQuantity"
                  min="0"
                  value={stockQuantity}
                  onChange={(e) => setStockQuantity(parseInt(e.target.value) || 0)}
                  className="admin-form-input"
                />
              </div>
            </div>
          </div>

          <div className="mt-8">
            <h3 className="text-lg font-medium text-brown-900 mb-4">
              {t('admin.products.packageOptions')}
            </h3>

            {packageOptions.map((option, index) => (
              <div key={option.uniq_id} className="bg-brown-50 p-4 rounded-md mb-4">
                <div className="flex justify-between items-center mb-3">
                  <h4 className="text-sm font-medium text-brown-700">
                    {t('admin.products.option')} {index + 1}
                  </h4>
                  <button
                    type="button"
                    className="admin-button-danger text-xs"
                    onClick={() => handleRemovePackageOption(index)}
                    disabled={packageOptions.length === 1}
                  >
                    <Trash2 className="h-3 w-3 mr-1" />
                    {t('admin.products.removeOption')}
                  </button>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label
                      htmlFor={`option-description-${index}`}
                      className="block text-sm font-medium text-brown-700 mb-1"
                    >
                      {t('admin.products.optionDescription')}:
                    </label>
                    <input
                      type="text"
                      id={`option-description-${index}`}
                      value={option.description}
                      onChange={(e) =>
                        handlePackageOptionChange(index, 'description', e.target.value)
                      }
                      placeholder={t('admin.products.optionDescriptionPlaceholder')}
                      className="admin-form-input"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor={`option-price-${index}`}
                      className="block text-sm font-medium text-brown-700 mb-1"
                    >
                      {t('admin.products.price')}:
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
                      className="admin-form-input"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor={`option-weight-${index}`}
                      className="block text-sm font-medium text-brown-700 mb-1"
                    >
                      {t('admin.products.weight')}:
                    </label>
                    <div className="flex">
                      <input
                        type="text"
                        id={`option-weight-${index}`}
                        value={option.weight}
                        placeholder="e.g. 0,5l, 1kg, 200g"
                        onChange={(e) =>
                          handlePackageOptionChange(index, 'weight', e.target.value)
                        }
                        className="admin-form-input rounded-r-none flex-1"
                        style={{ minWidth: '80px' }} /* Fixed minimum width */
                      />
                      <select
                        value={option.unit}
                        onChange={(e) =>
                          handlePackageOptionChange(index, 'unit', e.target.value)
                        }
                        className="admin-form-select rounded-l-none w-20"
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
              className="admin-button-secondary mt-2"
              onClick={handleAddPackageOption}
            >
              <Plus className="h-4 w-4 mr-1" />
              {t('admin.products.addOption')}
            </button>
          </div>

          <div className="admin-form-actions mt-8">
            <button
              type="button"
              className="admin-button-secondary"
              onClick={onClose}
              disabled={saving}
            >
              {t('admin.products.cancel')}
            </button>
            <button
              type="submit"
              className="admin-button-primary"
              disabled={saving}
            >
              {saving ? t('admin.products.creating') : t('admin.products.create')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
