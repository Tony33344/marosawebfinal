import { test, expect } from '@playwright/test';

test('Product images load without staying white on live site', async ({ page }) => {
  // Test a few products with additional images
  const products = [
    { name: 'Prosena kaša', url: 'https://marosaf1.netlify.app/izdelek/11?lang=sl', expectedImages: 2 },
    { name: 'Fižol', url: 'https://marosaf1.netlify.app/izdelek/12?lang=sl', expectedImages: 3 },
    { name: 'Poprova meta', url: 'https://marosaf1.netlify.app/izdelek/6?lang=sl', expectedImages: 1 }
  ];

  for (const product of products) {
    await test.step(`Check ${product.name} images`, async () => {
      console.log(`Testing ${product.name}...`);
      await page.goto(product.url);
      await page.waitForLoadState('networkidle');

      // Wait for main product image
      await page.waitForSelector('img[alt*="Prosena kaša"], img[alt*="Fižol"], img[alt*="Poprova meta"]', { timeout: 10000 });

      // Check that main image is not a placeholder
      const mainImage = page.locator('img[alt*="Prosena kaša"], img[alt*="Fižol"], img[alt*="Poprova meta"]').first();
      await expect(mainImage).toBeVisible();
      const mainSrc = await mainImage.getAttribute('src');
      expect(mainSrc).not.toContain('placeholder');
      console.log(`Main image loaded: ${mainSrc}`);

      // Check gallery images if any
      const galleryImages = page.locator('img[alt*="Image"]');
      const count = await galleryImages.count();
      if (count > 0) {
        console.log(`Found ${count} gallery images, expected ${product.expectedImages}`);
        expect(count).toBeGreaterThanOrEqual(1);

        for (let i = 0; i < count; i++) {
          const galleryImg = galleryImages.nth(i);
          await expect(galleryImg).toBeVisible();
          const src = await galleryImg.getAttribute('src');
          expect(src).not.toContain('placeholder');
          console.log(`Gallery image ${i + 1} loaded: ${src}`);
        }
      } else {
        console.log('No gallery images found');
      }

      // Check console for any "Image failed to load" errors
      const consoleMessages = [];
      page.on('console', msg => {
        if (msg.type() === 'error' || msg.text().includes('failed to load')) {
          consoleMessages.push(msg.text());
        }
      });

      // Brief wait to catch any loading errors
      await page.waitForTimeout(2000);

      if (consoleMessages.length > 0) {
        console.warn(`Console errors for ${product.name}:`, consoleMessages);
      }
    });
  }
});
