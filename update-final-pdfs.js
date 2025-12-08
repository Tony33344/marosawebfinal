import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';

async function createUpdatedPDF(htmlFilePath, outputPdfPath) {
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
    
    console.log(`✅ Updated PDF created: ${outputPdfPath}`);
  } catch (error) {
    console.error(`❌ Error creating updated PDF: ${error.message}`);
  } finally {
    await browser.close();
  }
}

async function main() {
  const invoicesDir = './invoices_documents';
  
  console.log('🔄 Updating PDFs with corrections...');
  console.log('   ❌ Removed date from header');
  console.log('   ✅ Added project launch: 1. september 2025');
  console.log('   ❌ Removed 99.9% uptime guarantee');
  console.log('   ✅ Changed 225+ hours to 500+ hours');
  console.log('');
  
  // Update povzetek PDF
  await createUpdatedPDF(
    path.join(invoicesDir, 'povzetek_projekta_profesionalno.html'),
    path.join(invoicesDir, 'povzetek_UPDATED.pdf')
  );
  
  // Update comprehensive report PDF
  await createUpdatedPDF(
    path.join(invoicesDir, 'obsezno_tehnicno_porocilo.html'),
    path.join(invoicesDir, 'OBSEZNO_POROCILO_UPDATED.pdf')
  );
  
  console.log('🎉 Updated PDFs completed!');
  console.log('📋 Created files:');
  console.log('   - povzetek_UPDATED.pdf');
  console.log('   - OBSEZNO_POROCILO_UPDATED.pdf');
  console.log('');
  console.log('💡 Changes made:');
  console.log('   ✅ Removed date from document header');
  console.log('   ✅ Added "Zagon projekta: 1. september 2025"');
  console.log('   ✅ Removed "99.9% uptime garancija"');
  console.log('   ✅ Changed "225+ ur" to "500+ ur strokovnega dela"');
}

main().catch(console.error);
