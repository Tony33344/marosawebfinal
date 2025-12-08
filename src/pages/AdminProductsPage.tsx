import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabaseClient';
import { Product, PackageOption } from '../types';
import { EditProductForm } from '../components/admin/EditProductForm';
import { AddProductForm } from '../components/admin/AddProductForm';
import { PlusCircle, Edit, Trash2, Package } from 'lucide-react';
import { isAdminEmail } from '../config/adminConfig';
import { Image } from '../components/Image';
import { useProducts } from '../hooks/useProducts';
import { parsePackageOptions } from '../utils/packageUtils';
import AdminNavigation from '../components/AdminNavigation';

export function AdminProductsPage() {
  const { t, i18n } = useTranslation();
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  // Use the shared useProducts hook
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const { products, loading, error: fetchError, refetch } = useProducts({
    categoryFilter,
    includeInactive: true
  });

  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [editingProductId, setEditingProductId] = useState<number | null>(null);
  const [editingStockQuantity, setEditingStockQuantity] = useState<number>(0);
  const [categories, setCategories] = useState<string[]>([]);
  const [updatingProductId, setUpdatingProductId] = useState<number | null>(null);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isAddingProduct, setIsAddingProduct] = useState(false);
  const [deletingProductId, setDeletingProductId] = useState<number | null>(null);
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [error, setError] = useState<string | null>(fetchError);

  // Check if user is admin
  const isAdmin = user && isAdminEmail(user.email);

  // Update error state when fetchError changes
  useEffect(() => {
    setError(fetchError);
  }, [fetchError]);

  useEffect(() => {
    // Redirect if not logged in or not admin
    if (!authLoading && (!user || !isAdmin)) {
      navigate(`/?lang=${i18n.language}`);
      return;
    }

    // Extract unique categories for the filter
    if (products.length > 0) {
      const uniqueCategories = Array.from(
        new Set(products.map(product => product.category).filter(Boolean))
      ) as string[];
      setCategories(uniqueCategories);
    }
  }, [user, authLoading, navigate, i18n.language, isAdmin, products]);

  const updateProductStock = async (productId: number, newStockQuantity: number) => {
    if (!user || !isAdmin) return;

    try {
      setUpdatingProductId(productId);

      const { error: updateError } = await supabase
        .from('products')
        .update({ stock_quantity: newStockQuantity })
        .eq('id', productId);

      if (updateError) {
        throw updateError;
      }

      // Update local state
      setProducts(
        products.map((product) =>
          product.id === productId
            ? { ...product, stock_quantity: newStockQuantity }
            : product
        )
      );

      setSuccessMessage(t('admin.products.stockUpdateSuccess'));
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err: any) {
      console.error('Error updating product stock:', err);
      setError(t('admin.products.updateError'));
      setTimeout(() => setError(null), 3000);
    } finally {
      setUpdatingProductId(null);
      setEditingProductId(null);
    }
  };

  const handleEditProduct = (product: Product) => {
    setEditingProduct(product);
  };

  const handleAddProduct = () => {
    setIsAddingProduct(true);
  };

  const handleDeleteProduct = (productId: number) => {
    setDeletingProductId(productId);
    setShowDeleteConfirmation(true);
  };

  const confirmDeleteProduct = async () => {
    if (!deletingProductId || !user || !isAdmin) return;

    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', deletingProductId);

      if (error) {
        throw error;
      }

      // Update local state
      setProducts(products.filter(product => product.id !== deletingProductId));
      setSuccessMessage(t('admin.products.deleteSuccess'));
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err: any) {
      console.error('Error deleting product:', err);
      setError(t('admin.products.deleteError'));
      setTimeout(() => setError(null), 3000);
    } finally {
      setDeletingProductId(null);
      setShowDeleteConfirmation(false);
    }
  };

  const handleEditStock = (productId: number, currentStock: number) => {
    setEditingProductId(productId);
    setEditingStockQuantity(currentStock);
  };

  const handleStockChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value);
    if (!isNaN(value) && value >= 0) {
      setEditingStockQuantity(value);
    }
  };

  const getStockStatusClass = (quantity: number | undefined) => {
    if (quantity === undefined || quantity === null) return 'admin-status-neutral';
    if (quantity <= 0) return 'admin-status-danger';
    if (quantity < 5) return 'admin-status-warning';
    return 'admin-status-success';
  };

  const getStockStatusText = (quantity: number | undefined) => {
    if (quantity === undefined || quantity === null) return t('admin.products.stockUnknown');
    if (quantity <= 0) return t('admin.products.outOfStock');
    if (quantity < 5) return t('admin.products.lowStock');
    return t('admin.products.inStock');
  };

  return (
    <div className="admin-container">
      <AdminNavigation />
      <div className="admin-header">
        <h1 className="admin-title">{t('admin.products.title')}</h1>
        <p className="admin-subtitle">{t('admin.products.manage')}</p>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {successMessage && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
          {successMessage}
        </div>
      )}

      <div className="admin-actions">
        <div className="admin-filters">
          <label htmlFor="category-filter" className="admin-filter-label">
            {t('admin.products.filterByCategory')}:
          </label>
          <select
            id="category-filter"
            className="admin-filter-select"
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
          >
            <option value="all">{t('admin.products.allCategories')}</option>
            {categories.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </div>

        <button
          type="button"
          className="admin-button-primary"
          onClick={handleAddProduct}
        >
          <PlusCircle className="admin-button-icon" />
          {t('admin.products.addProduct')}
        </button>
      </div>

      {loading ? (
        <div className="text-center py-8">{t('admin.products.loading')}</div>
      ) : products.length === 0 ? (
        <div className="text-center py-8">{t('admin.products.noProducts')}</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="admin-table">
            <thead className="admin-table-header">
              <tr>
                <th className="admin-table-header-cell">ID</th>
                <th className="admin-table-header-cell">{t('admin.products.imageUrl')}</th>
                <th className="admin-table-header-cell">{t('admin.products.productName')}</th>
                <th className="admin-table-header-cell">{t('admin.products.category')}</th>
                <th className="admin-table-header-cell">{t('admin.products.stockStatus')}</th>
                <th className="admin-table-header-cell">{t('admin.products.stockQuantity')}</th>
                <th className="admin-table-header-cell">{t('admin.products.actions')}</th>
              </tr>
            </thead>
            <tbody className="admin-table-body">
              {products.map((product) => (
                <tr key={product.id} className="admin-table-row">
                  <td className="admin-table-cell">{product.id}</td>
                  <td className="admin-table-cell">
                    <div className="w-16 h-16 relative overflow-hidden rounded-md border border-brown-200">
                      {product.image_url ? (
                        <Image
                          src={product.image_url}
                          alt={product.name}
                          className="w-full h-full object-cover"
                          fallbackSrc="/images/placeholder-product.svg"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gray-100 text-gray-400 text-xs">
                          No Image
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="admin-table-cell">{product.name}</td>
                  <td className="admin-table-cell">{product.category || '-'}</td>
                  <td className="admin-table-cell">
                    <span className={`admin-status-indicator ${getStockStatusClass(product.stock_quantity)}`}>
                      {getStockStatusText(product.stock_quantity)}
                    </span>
                  </td>
                  <td className="admin-table-cell">
                    {editingProductId === product.id ? (
                      <div className="flex items-center space-x-2">
                        <input
                          type="number"
                          min="0"
                          value={editingStockQuantity}
                          onChange={handleStockChange}
                          className="admin-form-input w-20"
                        />
                        <button
                          type="button"
                          className="admin-button-secondary text-xs py-1 px-2"
                          onClick={() => updateProductStock(product.id, editingStockQuantity)}
                          disabled={updatingProductId === product.id}
                        >
                          {updatingProductId === product.id ? '...' : t('admin.products.save')}
                        </button>
                        <button
                          type="button"
                          className="admin-button-secondary text-xs py-1 px-2"
                          onClick={() => setEditingProductId(null)}
                        >
                          {t('admin.products.cancel')}
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center space-x-2">
                        <span>{product.stock_quantity ?? 0}</span>
                        <button
                          type="button"
                          className="admin-button-secondary text-xs py-1 px-2"
                          onClick={() => handleEditStock(product.id, product.stock_quantity ?? 0)}
                        >
                          {t('admin.products.editStock')}
                        </button>
                      </div>
                    )}
                  </td>
                  <td className="admin-table-cell">
                    <div className="flex space-x-2">
                      <button
                        type="button"
                        className="admin-button-secondary"
                        onClick={() => handleEditProduct(product)}
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        className="admin-button-danger"
                        onClick={() => handleDeleteProduct(product.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Edit Product Modal */}
      {editingProduct && (
        <div className="admin-modal-overlay">
          <div className="admin-modal">
            <EditProductForm
              product={editingProduct}
              onClose={() => setEditingProduct(null)}
              onSuccess={() => {
                setEditingProduct(null);
                refetch();
              }}
            />
          </div>
        </div>
      )}

      {/* Add Product Modal */}
      {isAddingProduct && (
        <div className="admin-modal-overlay">
          <div className="admin-modal">
            <AddProductForm
              onClose={() => setIsAddingProduct(false)}
              onSuccess={() => {
                setIsAddingProduct(false);
                refetch();
              }}
            />
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirmation && (
        <div className="admin-modal-overlay">
          <div className="admin-modal max-w-md">
            <div className="p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                {t('admin.products.confirmDelete')}
              </h3>
              <p className="text-sm text-gray-500 mb-6">
                {t('admin.products.deleteWarning')}
              </p>
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  className="admin-button-secondary"
                  onClick={() => {
                    setShowDeleteConfirmation(false);
                    setDeletingProductId(null);
                  }}
                >
                  {t('admin.products.cancel')}
                </button>
                <button
                  type="button"
                  className="admin-button-danger"
                  onClick={confirmDeleteProduct}
                >
                  {t('admin.products.confirmDeleteButton')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
