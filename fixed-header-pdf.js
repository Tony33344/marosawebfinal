import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';

async function createFixedHeaderPDF(htmlFilePath, outputPdfPath) {
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
    
    // Generate PDF with optimized settings for header fix
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
    
    console.log(`✅ Fixed header PDF created: ${outputPdfPath}`);
  } catch (error) {
    console.error(`❌ Error creating fixed header PDF: ${error.message}`);
  } finally {
    await browser.close();
  }
}

async function main() {
  const invoicesDir = './invoices_documents';
  
  console.log('🔧 Creating PDFs with fixed layout...');

  // Convert račun with fixed header
  await createFixedHeaderPDF(
    path.join(invoicesDir, 'racun_profesionalno.html'),
    path.join(invoicesDir, 'racun_FIXED_HEADER.pdf')
  );

  // Convert povzetek with fixed layout
  await createFixedHeaderPDF(
    path.join(invoicesDir, 'povzetek_projekta_profesionalno.html'),
    path.join(invoicesDir, 'povzetek_FIXED_HEADER.pdf')
  );

  console.log('🎉 Fixed layout PDF conversion completed!');
  console.log('📋 Created files:');
  console.log('   - racun_FIXED_HEADER.pdf');
  console.log('   - povzetek_FIXED_HEADER.pdf');
  console.log('');
  console.log('💡 This PDF should have:');
  console.log('   ✅ Fixed header layout (table instead of flex)');
  console.log('   ✅ Better company info display');
  console.log('   ✅ Improved parties section');
  console.log('   ✅ Optimized details grid');
}

main().catch(console.error);
