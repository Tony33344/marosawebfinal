import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Recipe } from '../types';
import { supabase } from '../lib/supabaseClient';
import { X, Plus, Trash2 } from 'lucide-react';
import { getImageUrl } from '../utils/imageUtils';

interface EditRecipeFormProps {
  recipe: Recipe;
  onClose: () => void;
  onSuccess: () => void;
}

export function EditRecipeForm({ recipe, onClose, onSuccess }: EditRecipeFormProps) {
  const { t } = useTranslation();
  
  // Basic recipe information
  const [title, setTitle] = useState(recipe.title || '');
  const [titleEn, setTitleEn] = useState(recipe.title_en || '');
  const [titleDe, setTitleDe] = useState(recipe.title_de || '');
  const [titleHr, setTitleHr] = useState(recipe.title_hr || '');
  const [titleSl, setTitleSl] = useState(recipe.title_sl || '');
  
  // Image URL
  const [imageUrl, setImageUrl] = useState(recipe.image_url || '');
  const [additionalImages, setAdditionalImages] = useState<string[]>(recipe.additional_images || []);
  const [newImageUrl, setNewImageUrl] = useState('');
  
  // Recipe details
  const [prepTime, setPrepTime] = useState(recipe.prepTime || '');
  const [cookTime, setCookTime] = useState(recipe.cookTime || '');
  const [difficulty, setDifficulty] = useState(recipe.difficulty || '');
  
  // Ingredients
  const [ingredients, setIngredients] = useState<string[]>(recipe.ingredients || []);
  const [ingredientsEn, setIngredientsEn] = useState<string[]>(recipe.ingredients_en || []);
  const [ingredientsDe, setIngredientsDe] = useState<string[]>(recipe.ingredients_de || []);
  const [ingredientsHr, setIngredientsHr] = useState<string[]>(recipe.ingredients_hr || []);
  const [ingredientsSl, setIngredientsSl] = useState<string[]>(recipe.ingredients_sl || []);
  
  // Instructions
  const [instructions, setInstructions] = useState<string[]>(recipe.instructions || []);
  const [instructionsEn, setInstructionsEn] = useState<string[]>(recipe.instructions_en || []);
  const [instructionsDe, setInstructionsDe] = useState<string[]>(recipe.instructions_de || []);
  const [instructionsHr, setInstructionsHr] = useState<string[]>(recipe.instructions_hr || []);
  const [instructionsSl, setInstructionsSl] = useState<string[]>(recipe.instructions_sl || []);
  
  // Related products
  const [relatedProductIds, setRelatedProductIds] = useState<number[]>(recipe.relatedProductIds || []);
  const [availableProducts, setAvailableProducts] = useState<any[]>([]);
  
  // Form state
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Fetch available products for the related products dropdown
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const { data, error } = await supabase
          .from('products')
          .select('id, name')
          .eq('isActive', true)
          .order('name');
          
        if (error) throw error;
        setAvailableProducts(data || []);
      } catch (err) {
        console.error('Error fetching products:', err);
      }
    };
    
    fetchProducts();
  }, []);
  
  // Handle adding a new ingredient
  const handleAddIngredient = (language: string = 'default') => {
    switch (language) {
      case 'en':
        setIngredientsEn([...ingredientsEn, '']);
        break;
      case 'de':
        setIngredientsDe([...ingredientsDe, '']);
        break;
      case 'hr':
        setIngredientsHr([...ingredientsHr, '']);
        break;
      case 'sl':
        setIngredientsSl([...ingredientsSl, '']);
        break;
      default:
        setIngredients([...ingredients, '']);
        break;
    }
  };
  
  // Handle removing an ingredient
  const handleRemoveIngredient = (index: number, language: string = 'default') => {
    switch (language) {
      case 'en':
        setIngredientsEn(ingredientsEn.filter((_, i) => i !== index));
        break;
      case 'de':
        setIngredientsDe(ingredientsDe.filter((_, i) => i !== index));
        break;
      case 'hr':
        setIngredientsHr(ingredientsHr.filter((_, i) => i !== index));
        break;
      case 'sl':
        setIngredientsSl(ingredientsSl.filter((_, i) => i !== index));
        break;
      default:
        setIngredients(ingredients.filter((_, i) => i !== index));
        break;
    }
  };
  
  // Handle updating an ingredient
  const handleUpdateIngredient = (index: number, value: string, language: string = 'default') => {
    switch (language) {
      case 'en': {
        const updatedIngredientsEn = [...ingredientsEn];
        updatedIngredientsEn[index] = value;
        setIngredientsEn(updatedIngredientsEn);
        break;
      }
      case 'de': {
        const updatedIngredientsDe = [...ingredientsDe];
        updatedIngredientsDe[index] = value;
        setIngredientsDe(updatedIngredientsDe);
        break;
      }
      case 'hr': {
        const updatedIngredientsHr = [...ingredientsHr];
        updatedIngredientsHr[index] = value;
        setIngredientsHr(updatedIngredientsHr);
        break;
      }
      case 'sl': {
        const updatedIngredientsSl = [...ingredientsSl];
        updatedIngredientsSl[index] = value;
        setIngredientsSl(updatedIngredientsSl);
        break;
      }
      default: {
        const updatedIngredients = [...ingredients];
        updatedIngredients[index] = value;
        setIngredients(updatedIngredients);
        break;
      }
    }
  };
  
  // Handle adding a new instruction
  const handleAddInstruction = (language: string = 'default') => {
    switch (language) {
      case 'en':
        setInstructionsEn([...instructionsEn, '']);
        break;
      case 'de':
        setInstructionsDe([...instructionsDe, '']);
        break;
      case 'hr':
        setInstructionsHr([...instructionsHr, '']);
        break;
      case 'sl':
        setInstructionsSl([...instructionsSl, '']);
        break;
      default:
        setInstructions([...instructions, '']);
        break;
    }
  };
  
  // Handle removing an instruction
  const handleRemoveInstruction = (index: number, language: string = 'default') => {
    switch (language) {
      case 'en':
        setInstructionsEn(instructionsEn.filter((_, i) => i !== index));
        break;
      case 'de':
        setInstructionsDe(instructionsDe.filter((_, i) => i !== index));
        break;
      case 'hr':
        setInstructionsHr(instructionsHr.filter((_, i) => i !== index));
        break;
      case 'sl':
        setInstructionsSl(instructionsSl.filter((_, i) => i !== index));
        break;
      default:
        setInstructions(instructions.filter((_, i) => i !== index));
        break;
    }
  };
  
  // Handle updating an instruction
  const handleUpdateInstruction = (index: number, value: string, language: string = 'default') => {
    switch (language) {
      case 'en': {
        const updatedInstructionsEn = [...instructionsEn];
        updatedInstructionsEn[index] = value;
        setInstructionsEn(updatedInstructionsEn);
        break;
      }
      case 'de': {
        const updatedInstructionsDe = [...instructionsDe];
        updatedInstructionsDe[index] = value;
        setInstructionsDe(updatedInstructionsDe);
        break;
      }
      case 'hr': {
        const updatedInstructionsHr = [...instructionsHr];
        updatedInstructionsHr[index] = value;
        setInstructionsHr(updatedInstructionsHr);
        break;
      }
      case 'sl': {
        const updatedInstructionsSl = [...instructionsSl];
        updatedInstructionsSl[index] = value;
        setInstructionsSl(updatedInstructionsSl);
        break;
      }
      default: {
        const updatedInstructions = [...instructions];
        updatedInstructions[index] = value;
        setInstructions(updatedInstructions);
        break;
      }
    }
  };
  
  // Handle adding an additional image
  const handleAddImage = () => {
    if (newImageUrl && !additionalImages.includes(newImageUrl)) {
      // Limit to 5 additional images
      if (additionalImages.length >= 5) {
        setError(t('admin.recipes.maxImagesReached', 'Maximum of 5 additional images allowed.'));
        return;
      }
      setAdditionalImages([...additionalImages, newImageUrl]);
      setNewImageUrl('');
    }
  };
  
  // Handle removing an additional image
  const handleRemoveImage = (index: number) => {
    setAdditionalImages(additionalImages.filter((_, i) => i !== index));
  };
  
  // Handle toggling a related product
  const handleToggleRelatedProduct = (productId: number) => {
    if (relatedProductIds.includes(productId)) {
      setRelatedProductIds(relatedProductIds.filter(id => id !== productId));
    } else {
      setRelatedProductIds([...relatedProductIds, productId]);
    }
  };
  
  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setSaving(true);
      setError(null);
      
      // Prepare the update data
      const updateData = {
        title,
        title_en: titleEn || null,
        title_de: titleDe || null,
        title_hr: titleHr || null,
        title_sl: titleSl || null,
        image_url: imageUrl,
        additional_images: additionalImages.length > 0 ? additionalImages : null,
        prepTime,
        cookTime,
        difficulty,
        ingredients,
        ingredients_en: ingredientsEn.length > 0 ? ingredientsEn : null,
        ingredients_de: ingredientsDe.length > 0 ? ingredientsDe : null,
        ingredients_hr: ingredientsHr.length > 0 ? ingredientsHr : null,
        ingredients_sl: ingredientsSl.length > 0 ? ingredientsSl : null,
        instructions,
        instructions_en: instructionsEn.length > 0 ? instructionsEn : null,
        instructions_de: instructionsDe.length > 0 ? instructionsDe : null,
        instructions_hr: instructionsHr.length > 0 ? instructionsHr : null,
        instructions_sl: instructionsSl.length > 0 ? instructionsSl : null,
        relatedProductIds
      };
      
      // Perform the update
      const { error: updateError } = await supabase
        .from('recipes')
        .update(updateData)
        .eq('id', recipe.id);
        
      if (updateError) {
        throw updateError;
      }
      
      // Success - call the onSuccess callback
      onSuccess();
    } catch (err: any) {
      console.error('Error in handleSubmit:', err);
      setError(`${t('admin.recipes.updateError', 'Failed to update recipe')}: ${err.message || 'Unknown error'}`);
    } finally {
      setSaving(false);
    }
  };
  
  return (
    <div>
      <div className="admin-modal-header">
        <div className="flex justify-between items-center">
          <h2 className="admin-modal-title">{t('admin.recipes.editRecipe', 'Edit Recipe')}</h2>
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
        
        <form onSubmit={handleSubmit}>
          {/* Basic Information */}
          <div className="admin-form-section">
            <h3 className="admin-form-section-title">{t('admin.recipes.basicInfo', 'Basic Information')}</h3>
            
            <div className="admin-form-grid">
              {/* Title (Slovenian) */}
              <div className="admin-form-field">
                <label htmlFor="title" className="admin-form-label">
                  {t('admin.recipes.title', 'Title')} (SL) <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="title"
                  className="admin-form-input"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                />
              </div>
              
              {/* Title (English) */}
              <div className="admin-form-field">
                <label htmlFor="title_en" className="admin-form-label">
                  {t('admin.recipes.titleEn', 'Title (EN)')}
                </label>
                <input
                  type="text"
                  id="title_en"
                  className="admin-form-input"
                  value={titleEn}
                  onChange={(e) => setTitleEn(e.target.value)}
                />
              </div>
              
              {/* Title (German) */}
              <div className="admin-form-field">
                <label htmlFor="title_de" className="admin-form-label">
                  {t('admin.recipes.titleDe', 'Title (DE)')}
                </label>
                <input
                  type="text"
                  id="title_de"
                  className="admin-form-input"
                  value={titleDe}
                  onChange={(e) => setTitleDe(e.target.value)}
                />
              </div>
              
              {/* Title (Croatian) */}
              <div className="admin-form-field">
                <label htmlFor="title_hr" className="admin-form-label">
                  {t('admin.recipes.titleHr', 'Title (HR)')}
                </label>
                <input
                  type="text"
                  id="title_hr"
                  className="admin-form-input"
                  value={titleHr}
                  onChange={(e) => setTitleHr(e.target.value)}
                />
              </div>
            </div>
          </div>
          
          {/* Images */}
          <div className="admin-form-section">
            <h3 className="admin-form-section-title">{t('admin.recipes.images', 'Images')}</h3>
            
            {/* Main Image */}
            <div className="admin-form-field">
              <label htmlFor="image_url" className="admin-form-label">
                {t('admin.recipes.mainImage', 'Main Image URL')} <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="image_url"
                className="admin-form-input"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                required
              />
              {imageUrl && (
                <div className="mt-2">
                  <img
                    src={getImageUrl(imageUrl)}
                    alt={title}
                    className="w-32 h-32 object-cover rounded border border-gray-300"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = '/images/recipe-placeholder.svg';
                    }}
                  />
                </div>
              )}
            </div>
            
            {/* Additional Images */}
            <div className="admin-form-field">
              <label className="admin-form-label">
                {t('admin.recipes.additionalImages', 'Additional Images')}
              </label>
              
              <div className="flex items-center space-x-2 mb-4">
                <input
                  type="text"
                  className="admin-form-input flex-grow"
                  value={newImageUrl}
                  onChange={(e) => setNewImageUrl(e.target.value)}
                  placeholder={t('admin.recipes.imageUrlPlaceholder', 'Enter image URL')}
                />
                <button
                  type="button"
                  className="admin-button-secondary"
                  onClick={handleAddImage}
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
              
              {/* Additional Images Grid */}
              {additionalImages.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4 mb-4">
                  {additionalImages.map((imgUrl, index) => (
                    <div key={index} className="relative group">
                      <div className="w-full aspect-square overflow-hidden rounded-md border border-brown-200">
                        <img
                          src={getImageUrl(imgUrl) || '/images/recipe-placeholder.svg'}
                          alt={`${title} - Image ${index + 1}`}
                          className="w-full h-full object-contain p-1"
                          onError={(e) => {
                            console.error('Error loading additional image:', imgUrl);
                            (e.target as HTMLImageElement).src = '/images/recipe-placeholder.svg';
                          }}
                        />
                      </div>
                      <button
                        type="button"
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => handleRemoveImage(index)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          
          {/* Recipe Details */}
          <div className="admin-form-section">
            <h3 className="admin-form-section-title">{t('admin.recipes.details', 'Recipe Details')}</h3>
            
            <div className="admin-form-grid">
              {/* Prep Time */}
              <div className="admin-form-field">
                <label htmlFor="prep_time" className="admin-form-label">
                  {t('admin.recipes.prepTime', 'Prep Time')}
                </label>
                <input
                  type="text"
                  id="prep_time"
                  className="admin-form-input"
                  value={prepTime}
                  onChange={(e) => setPrepTime(e.target.value)}
                  placeholder="e.g., 15 min"
                />
              </div>
              
              {/* Cook Time */}
              <div className="admin-form-field">
                <label htmlFor="cook_time" className="admin-form-label">
                  {t('admin.recipes.cookTime', 'Cook Time')}
                </label>
                <input
                  type="text"
                  id="cook_time"
                  className="admin-form-input"
                  value={cookTime}
                  onChange={(e) => setCookTime(e.target.value)}
                  placeholder="e.g., 30 min"
                />
              </div>
              
              {/* Difficulty */}
              <div className="admin-form-field">
                <label htmlFor="difficulty" className="admin-form-label">
                  {t('admin.recipes.difficulty', 'Difficulty')}
                </label>
                <select
                  id="difficulty"
                  className="admin-form-input"
                  value={difficulty}
                  onChange={(e) => setDifficulty(e.target.value)}
                >
                  <option value="">{t('admin.recipes.selectDifficulty', 'Select difficulty')}</option>
                  <option value="Easy">{t('admin.recipes.easy', 'Easy')}</option>
                  <option value="Medium">{t('admin.recipes.medium', 'Medium')}</option>
                  <option value="Hard">{t('admin.recipes.hard', 'Hard')}</option>
                </select>
              </div>
            </div>
          </div>
          
          {/* Related Products */}
          <div className="admin-form-section">
            <h3 className="admin-form-section-title">{t('admin.recipes.relatedProducts', 'Related Products')}</h3>
            
            <div className="admin-form-field">
              <label className="admin-form-label">
                {t('admin.recipes.selectRelatedProducts', 'Select related products')}
              </label>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {availableProducts.map((product) => (
                  <div key={product.id} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id={`product-${product.id}`}
                      checked={relatedProductIds.includes(product.id)}
                      onChange={() => handleToggleRelatedProduct(product.id)}
                      className="h-4 w-4 text-brown-600 focus:ring-brown-500 border-gray-300 rounded"
                    />
                    <label htmlFor={`product-${product.id}`} className="text-sm text-gray-700">
                      {product.name}
                    </label>
                  </div>
                ))}
              </div>
            </div>
          </div>
          
          {/* Form Actions */}
          <div className="admin-form-actions mt-8">
            <button
              type="button"
              className="admin-button-secondary"
              onClick={onClose}
              disabled={saving}
            >
              {t('admin.recipes.cancel', 'Cancel')}
            </button>
            <button
              type="submit"
              className="admin-button-primary"
              disabled={saving}
            >
              {saving ? t('admin.recipes.saving', 'Saving...') : t('admin.recipes.save', 'Save')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
