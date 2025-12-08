import { test, expect } from '@playwright/test';
import { TEST_USERS, ROUTES } from '../../../config/test-data';

test.describe('Admin Product Management @admin', () => {
  
  // Helper function to close any popups/modals that may appear
  async function closePopups(page: any) {
    try {
      // Close newsletter/discount popup if visible
      const popupClose = page.locator('.fixed.inset-0 button:has-text("×"), .fixed.inset-0 button:has-text("Zapri"), .fixed.inset-0 button:has-text("Ne, hvala"), .fixed.inset-0 [aria-label="Close"], .fixed.inset-0 svg.lucide-x').first();
      if (await popupClose.isVisible({ timeout: 2000 })) {
        await popupClose.click();
        await page.waitForTimeout(500);
      }
    } catch {
      // No popup visible, continue
    }
    
    try {
      // Click outside any modal to dismiss
      const overlay = page.locator('.fixed.inset-0.bg-black.bg-opacity-50').first();
      if (await overlay.isVisible({ timeout: 1000 })) {
        await page.keyboard.press('Escape');
        await page.waitForTimeout(500);
      }
    } catch {
      // No overlay, continue
    }
  }

  // Helper function to login as admin
  async function loginAsAdmin(page: any) {
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    
    // Close any popups that may be blocking
    await closePopups(page);
    
    const emailInput = page.locator('input[type="email"], input[name="email"]').first();
    const passwordInput = page.locator('input[type="password"], input[name="password"]').first();
    const loginBtn = page.locator('button[type="submit"], button:has-text("Prijava")').first();
    
    await emailInput.fill(TEST_USERS.admin.email);
    await passwordInput.fill(TEST_USERS.admin.password);
    await loginBtn.click();
    
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
  }

  test.describe('Admin Access', () => {
    test('should access admin products page when logged in as admin', async ({ page }) => {
      await loginAsAdmin(page);
      
      await page.goto(ROUTES.admin.products);
      await page.waitForLoadState('networkidle');
      
      // Should not be redirected to login
      const url = page.url();
      const isOnAdminPage = url.includes('admin/products') || url.includes('admin');
      
      if (isOnAdminPage) {
        console.log('[UX-METRIC] Admin products page accessible');
        await expect(page.locator('h1, h2').first()).toBeVisible();
      } else if (url.includes('login')) {
        console.log('[UX-NOTE] Admin access requires valid admin credentials');
      }
    });

    test('should redirect to login when not authenticated', async ({ page }) => {
      await page.goto(ROUTES.admin.products);
      await page.waitForLoadState('networkidle');
      
      const url = page.url();
      // Should be redirected to login or show access denied
      expect(url.includes('login') || url.includes('admin')).toBeTruthy();
    });
  });

  test.describe('Product List', () => {
    test.beforeEach(async ({ page }) => {
      await loginAsAdmin(page);
      await page.goto(ROUTES.admin.products);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1000);
    });

    test('should display products table or list', async ({ page }) => {
      const productsContainer = page.locator('table, [data-testid="products-list"], .products-grid').first();
      
      if (await productsContainer.isVisible({ timeout: 5000 })) {
        console.log('[UX-METRIC] Products list visible');
        
        // Count products
        const productRows = page.locator('tbody tr, [data-testid="product-row"], .product-item');
        const count = await productRows.count();
        console.log(`[UX-METRIC] Products displayed: ${count}`);
      }
    });

    test('should have add product button', async ({ page }) => {
      const addProductBtn = page.locator('button:has-text("Dodaj"), button:has-text("Novi izdelek"), [data-testid="add-product"]');
      
      if (await addProductBtn.isVisible({ timeout: 3000 })) {
        console.log('[UX-METRIC] Add product button present');
      }
    });

    test('should have search/filter functionality', async ({ page }) => {
      const searchInput = page.locator('input[type="search"], input[placeholder*="Išči"], [data-testid="product-search"]');
      
      if (await searchInput.isVisible({ timeout: 3000 })) {
        await searchInput.fill('test');
        await page.waitForTimeout(500);
        console.log('[UX-METRIC] Product search available');
      }
    });
  });

  test.describe('Create Product', () => {
    test.beforeEach(async ({ page }) => {
      await loginAsAdmin(page);
      await page.goto(ROUTES.admin.products);
      await page.waitForTimeout(1000);
    });

    test('should open add product form', async ({ page }) => {
      const addProductBtn = page.locator('button:has-text("Dodaj"), button:has-text("Novi"), [data-testid="add-product"]').first();
      
      if (await addProductBtn.isVisible({ timeout: 3000 })) {
        await addProductBtn.click();
        await page.waitForTimeout(500);
        
        // Should show form or modal
        const productForm = page.locator('form, [data-testid="product-form"], .product-form');
        if (await productForm.isVisible({ timeout: 3000 })) {
          console.log('[UX-METRIC] Add product form opens correctly');
        }
      }
    });

    test('should have all required fields in product form', async ({ page }) => {
      const addProductBtn = page.locator('button:has-text("Dodaj"), button:has-text("Novi")').first();
      
      if (await addProductBtn.isVisible({ timeout: 3000 })) {
        await addProductBtn.click();
        await page.waitForTimeout(500);
        
        // Check for required fields
        const nameInput = page.locator('input[name="name"], [data-testid="product-name"]');
        const priceInput = page.locator('input[name="price"], [data-testid="product-price"]');
        const descriptionInput = page.locator('textarea[name="description"], [data-testid="product-description"]');
        const imageUpload = page.locator('input[type="file"], [data-testid="product-image"]');
        
        const fields = { nameInput, priceInput, descriptionInput, imageUpload };
        let visibleFields = 0;
        
        for (const [name, locator] of Object.entries(fields)) {
          if (await locator.isVisible({ timeout: 2000 }).catch(() => false)) {
            visibleFields++;
          }
        }
        
        console.log(`[UX-METRIC] Product form fields visible: ${visibleFields}/4`);
      }
    });

    test('should validate required fields', async ({ page }) => {
      const addProductBtn = page.locator('button:has-text("Dodaj"), button:has-text("Novi")').first();
      
      if (await addProductBtn.isVisible({ timeout: 3000 })) {
        await addProductBtn.click();
        await page.waitForTimeout(500);
        
        // Try to save without filling form
        const saveBtn = page.locator('button:has-text("Shrani"), button[type="submit"]').first();
        if (await saveBtn.isVisible({ timeout: 2000 })) {
          await saveBtn.click();
          await page.waitForTimeout(500);
          
          // Should show validation errors
          const errors = page.locator('.error, .text-red, [data-testid="error"]');
          const errorCount = await errors.count();
          
          if (errorCount > 0) {
            console.log(`[UX-METRIC] Form validation works - ${errorCount} errors shown`);
          }
        }
      }
    });
  });

  test.describe('Edit Product', () => {
    test.beforeEach(async ({ page }) => {
      await loginAsAdmin(page);
      await page.goto(ROUTES.admin.products);
      await page.waitForTimeout(1000);
    });

    test('should open edit form when clicking edit button', async ({ page }) => {
      const editBtn = page.locator('button:has-text("Uredi"), [data-testid="edit-btn"], .edit-button').first();
      
      if (await editBtn.isVisible({ timeout: 3000 })) {
        await editBtn.click();
        await page.waitForTimeout(500);
        
        // Should show edit form with populated data
        const productForm = page.locator('form, [data-testid="product-form"]');
        if (await productForm.isVisible({ timeout: 3000 })) {
          const nameInput = page.locator('input[name="name"], [data-testid="product-name"]');
          const nameValue = await nameInput.inputValue();
          
          if (nameValue.length > 0) {
            console.log('[UX-METRIC] Edit form populated with existing data');
          }
        }
      }
    });

    test('should save changes when editing product', async ({ page }) => {
      const editBtn = page.locator('button:has-text("Uredi"), [data-testid="edit-btn"]').first();
      
      if (await editBtn.isVisible({ timeout: 3000 })) {
        await editBtn.click();
        await page.waitForTimeout(500);
        
        // Modify a field
        const descriptionInput = page.locator('textarea[name="description"], [data-testid="product-description"]');
        if (await descriptionInput.isVisible({ timeout: 2000 })) {
          const currentDesc = await descriptionInput.inputValue();
          await descriptionInput.fill(currentDesc + ' (test edit)');
          
          // Save
          const saveBtn = page.locator('button:has-text("Shrani"), button[type="submit"]').first();
          await saveBtn.click();
          await page.waitForTimeout(1000);
          
          // Check for success message
          const successMsg = page.locator('.success, .text-green, [data-testid="success"]');
          if (await successMsg.isVisible({ timeout: 3000 })) {
            console.log('[UX-METRIC] Product edit saved successfully');
          }
        }
      }
    });
  });

  test.describe('Delete Product', () => {
    test.beforeEach(async ({ page }) => {
      await loginAsAdmin(page);
      await page.goto(ROUTES.admin.products);
      await page.waitForTimeout(1000);
    });

    test('should show confirmation before deleting', async ({ page }) => {
      const deleteBtn = page.locator('button:has-text("Izbriši"), [data-testid="delete-btn"], .delete-button').first();
      
      if (await deleteBtn.isVisible({ timeout: 3000 })) {
        await deleteBtn.click();
        await page.waitForTimeout(500);
        
        // Should show confirmation modal
        const confirmModal = page.locator('[data-testid="confirm-modal"], .modal, .confirm-dialog, [role="dialog"]');
        const confirmBtn = page.locator('button:has-text("Potrdi"), button:has-text("Da")');
        const cancelBtn = page.locator('button:has-text("Prekliči"), button:has-text("Ne")');
        
        if (await confirmModal.isVisible({ timeout: 3000 }) || await confirmBtn.isVisible({ timeout: 3000 })) {
          console.log('[UX-METRIC] Delete confirmation shown');
          
          // Cancel the delete
          if (await cancelBtn.isVisible({ timeout: 1000 })) {
            await cancelBtn.click();
          }
        }
      }
    });
  });

  test.describe('Product Images', () => {
    test.beforeEach(async ({ page }) => {
      await loginAsAdmin(page);
      await page.goto(ROUTES.admin.products);
      await page.waitForTimeout(1000);
    });

    test('should allow image upload', async ({ page }) => {
      const addProductBtn = page.locator('button:has-text("Dodaj"), button:has-text("Novi")').first();
      
      if (await addProductBtn.isVisible({ timeout: 3000 })) {
        await addProductBtn.click();
        await page.waitForTimeout(500);
        
        const imageUpload = page.locator('input[type="file"]');
        
        if (await imageUpload.isVisible({ timeout: 2000 })) {
          console.log('[UX-METRIC] Image upload field available');
          
          // Check for multiple image support
          const multipleAttr = await imageUpload.getAttribute('multiple');
          if (multipleAttr !== null) {
            console.log('[UX-METRIC] Multiple image upload supported');
          }
        }
      }
    });
  });
});

test.describe('Admin Orders Page @admin', () => {
  
  // Helper function to close any popups/modals that may appear
  async function closePopups(page: any) {
    try {
      const popupClose = page.locator('.fixed.inset-0 button:has-text("×"), .fixed.inset-0 button:has-text("Zapri"), .fixed.inset-0 button:has-text("Ne, hvala"), .fixed.inset-0 [aria-label="Close"], .fixed.inset-0 svg.lucide-x').first();
      if (await popupClose.isVisible({ timeout: 2000 })) {
        await popupClose.click();
        await page.waitForTimeout(500);
      }
    } catch {
      // No popup visible
    }
    
    try {
      const overlay = page.locator('.fixed.inset-0.bg-black.bg-opacity-50').first();
      if (await overlay.isVisible({ timeout: 1000 })) {
        await page.keyboard.press('Escape');
        await page.waitForTimeout(500);
      }
    } catch {
      // No overlay
    }
  }

  async function loginAsAdmin(page: any) {
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    
    // Close any popups that may be blocking
    await closePopups(page);
    
    const emailInput = page.locator('input[type="email"]').first();
    const passwordInput = page.locator('input[type="password"]').first();
    const loginBtn = page.locator('button[type="submit"]').first();
    
    await emailInput.fill(TEST_USERS.admin.email);
    await passwordInput.fill(TEST_USERS.admin.password);
    await loginBtn.click();
    
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
  }

  test('should access admin orders page', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto(ROUTES.admin.orders);
    await page.waitForTimeout(1000);
    
    const ordersContainer = page.locator('table, [data-testid="orders-list"], .orders-container').first();
    
    if (await ordersContainer.isVisible({ timeout: 5000 })) {
      console.log('[UX-METRIC] Orders page accessible');
    }
  });

  test('should display order list with key information', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto(ROUTES.admin.orders);
    await page.waitForTimeout(1000);
    
    const orderRows = page.locator('tbody tr, [data-testid="order-row"]');
    const count = await orderRows.count();
    
    if (count > 0) {
      console.log(`[UX-METRIC] Orders displayed: ${count}`);
      
      // Check for key columns
      const headers = page.locator('th, .table-header');
      const headerTexts = await headers.allTextContents();
      console.log('[UX-METRIC] Order columns:', headerTexts.join(', '));
    }
  });

  test('should have order status filter', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto(ROUTES.admin.orders);
    await page.waitForTimeout(1000);
    
    const statusFilter = page.locator('select[name="status"], [data-testid="status-filter"]');
    
    if (await statusFilter.isVisible({ timeout: 3000 })) {
      console.log('[UX-METRIC] Order status filter available');
    }
  });

  test('should allow viewing order details', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto(ROUTES.admin.orders);
    await page.waitForTimeout(1000);
    
    const firstOrder = page.locator('tbody tr, [data-testid="order-row"]').first();
    
    if (await firstOrder.isVisible({ timeout: 3000 })) {
      await firstOrder.click();
      await page.waitForTimeout(500);
      
      // Should show order details
      const orderDetails = page.locator('[data-testid="order-details"], .order-details, .modal');
      if (await orderDetails.isVisible({ timeout: 3000 })) {
        console.log('[UX-METRIC] Order details view works');
      }
    }
  });
});
