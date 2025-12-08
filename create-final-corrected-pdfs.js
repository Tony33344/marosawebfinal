import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';

async function createFinalCorrectedPDF(htmlFilePath, outputPdfPath) {
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
    
    console.log(`✅ Final corrected PDF created: ${outputPdfPath}`);
  } catch (error) {
    console.error(`❌ Error creating final corrected PDF: ${error.message}`);
  } finally {
    await browser.close();
  }
}

async function main() {
  const invoicesDir = './invoices_documents';
  
  console.log('🎯 Creating final corrected PDFs...');
  console.log('   ❌ Removed "Dokument pripravljen: 5. avgust 2025"');
  console.log('   ✅ Added "90 dni brezplačne tehnične podpore"');
  console.log('   ✅ All previous fixes included');
  console.log('');
  
  // Create final corrected PDFs
  await createFinalCorrectedPDF(
    path.join(invoicesDir, 'povzetek_projekta_profesionalno.html'),
    path.join(invoicesDir, 'povzetek_FINAL_CORRECTED.pdf')
  );
  
  await createFinalCorrectedPDF(
    path.join(invoicesDir, 'obsezno_tehnicno_porocilo.html'),
    path.join(invoicesDir, 'OBSEZNO_POROCILO_FINAL_CORRECTED.pdf')
  );
  
  console.log('🎉 Final corrected PDFs completed!');
  console.log('📋 Created files:');
  console.log('   - povzetek_FINAL_CORRECTED.pdf');
  console.log('   - OBSEZNO_POROCILO_FINAL_CORRECTED.pdf');
  console.log('');
  console.log('💡 All corrections included:');
  console.log('   ❌ No date stamps');
  console.log('   ✅ Project launch: 1. september 2025');
  console.log('   ❌ No "referenčni projekt" mentions');
  console.log('   ✅ € icon fixed in tables');
  console.log('   ❌ No "99.9% uptime garancija"');
  console.log('   ✅ Changed to "500+ ur strokovnega dela"');
  console.log('   ✅ "90 dni brezplačne tehnične podpore"');
  console.log('');
  console.log('🏆 These are the FINAL versions to send!');
}

main().catch(console.error);
