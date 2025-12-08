import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';

async function createUpdatedInvoicePDF(htmlFilePath, outputPdfPath) {
  const browser = await puppeteer.launch({
    headless: true,
    args: [
      '--no-sandbox', 
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-accelerated-2d-canvas',
      '--no-first-run',
      '--no-zygote',
      '--disable-gpu',
      '--disable-web-security',
      '--allow-running-insecure-content',
      '--disable-features=VizDisplayCompositor',
      '--force-color-profile=srgb',
      '--disable-background-timer-throttling',
      '--disable-backgrounding-occluded-windows',
      '--disable-renderer-backgrounding'
    ]
  });
  
  try {
    const page = await browser.newPage();
    
    // Set high DPI for crisp rendering
    await page.setViewport({ 
      width: 1200, 
      height: 1600, 
      deviceScaleFactor: 2
    });
    
    // Read HTML content
    const htmlContent = fs.readFileSync(htmlFilePath, 'utf8');
    
    // Set content
    await page.setContent(htmlContent, { 
      waitUntil: ['networkidle0', 'domcontentloaded'],
      timeout: 90000 
    });
    
    // Wait for all resources to load
    await page.evaluate(() => {
      return Promise.all([
        ...Array.from(document.images).map(img => {
          if (img.complete) return Promise.resolve();
          return new Promise(resolve => {
            img.onload = img.onerror = resolve;
          });
        }),
        document.fonts.ready
      ]);
    });
    
    // Additional wait for complete rendering
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Generate PDF with optimized settings
    await page.pdf({
      path: outputPdfPath,
      format: 'A4',
      printBackground: true,
      preferCSSPageSize: false,
      margin: {
        top: '15mm',
        bottom: '15mm',
        left: '12mm',
        right: '12mm'
      },
      displayHeaderFooter: false,
      scale: 0.8,
      timeout: 60000
    });
    
    console.log(`✅ Updated invoice PDF created: ${outputPdfPath}`);
  } catch (error) {
    console.error(`❌ Error creating updated invoice PDF: ${error.message}`);
  } finally {
    await browser.close();
  }
}

async function main() {
  const invoicesDir = './invoices_documents';
  
  console.log('📅 Updating invoice date...');
  console.log('   ❌ Changed from: 5. avgust 2025');
  console.log('   ✅ Changed to: 12. avgust 2025');
  console.log('');
  
  // Create updated invoice PDF
  await createUpdatedInvoicePDF(
    path.join(invoicesDir, 'racun_profesionalno.html'),
    path.join(invoicesDir, 'racun_FINAL_12_AVGUST.pdf')
  );
  
  console.log('🎉 Invoice date update completed!');
  console.log('📋 Created file: racun_FINAL_12_AVGUST.pdf');
  console.log('');
  console.log('💡 Invoice details:');
  console.log('   ✅ Issue date: 12. avgust 2025');
  console.log('   ✅ Due date: 27. avgust 2025 (15 days)');
  console.log('   ✅ Amount: 3.960 EUR');
  console.log('   ✅ Reference: S21');
  console.log('');
  console.log('🏆 This is the FINAL invoice to send!');
}

main().catch(console.error);
