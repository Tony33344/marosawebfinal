import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';

async function convertHtmlToPdfOptimized(htmlFilePath, outputPdfPath) {
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
      '--disable-features=VizDisplayCompositor'
    ]
  });
  
  try {
    const page = await browser.newPage();
    
    // Set high DPI for better quality
    await page.setViewport({ 
      width: 1200, 
      height: 1600, 
      deviceScaleFactor: 2 
    });
    
    // Read HTML file and convert to absolute file URL
    const htmlContent = fs.readFileSync(htmlFilePath, 'utf8');
    const absolutePath = path.resolve(htmlFilePath);
    const fileUrl = `file://${absolutePath}`;
    
    // Navigate to file URL for better resource loading
    await page.goto(fileUrl, { 
      waitUntil: ['networkidle0', 'domcontentloaded'],
      timeout: 60000 
    });
    
    // Wait for all images and fonts to load
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
    
    // Additional wait for rendering
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Generate PDF with optimal settings
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
      scale: 0.8  // Slightly smaller scale for better fit
    });
    
    console.log(`✅ Optimized PDF created: ${outputPdfPath}`);
  } catch (error) {
    console.error(`❌ Error creating PDF: ${error.message}`);
  } finally {
    await browser.close();
  }
}

async function main() {
  const invoicesDir = './invoices_documents';
  
  console.log('🚀 Starting optimized PDF conversion...');
  
  // Convert both HTML files to PDF with optimized settings
  await convertHtmlToPdfOptimized(
    path.join(invoicesDir, 'povzetek_projekta_profesionalno.html'),
    path.join(invoicesDir, 'povzetek_projekta_OPTIMIZED.pdf')
  );
  
  await convertHtmlToPdfOptimized(
    path.join(invoicesDir, 'racun_profesionalno.html'),
    path.join(invoicesDir, 'racun_OPTIMIZED.pdf')
  );
  
  console.log('🎉 Optimized PDF conversion completed!');
  console.log('📋 Created files:');
  console.log('   - povzetek_projekta_OPTIMIZED.pdf');
  console.log('   - racun_OPTIMIZED.pdf');
}

main().catch(console.error);
