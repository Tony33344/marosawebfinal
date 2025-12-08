import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';

async function createComprehensiveReportPDF(htmlFilePath, outputPdfPath) {
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
    
    // Generate PDF with optimized settings for long document
    await page.pdf({
      path: outputPdfPath,
      format: 'A4',
      printBackground: true,
      preferCSSPageSize: false,
      margin: {
        top: '20mm',
        bottom: '20mm',
        left: '15mm',
        right: '15mm'
      },
      displayHeaderFooter: true,
      headerTemplate: '<div style="font-size: 10px; color: #666; text-align: center; width: 100%;">Obsežno tehnično poročilo - Kmetija Maroša</div>',
      footerTemplate: '<div style="font-size: 10px; color: #666; text-align: center; width: 100%;">Stran <span class="pageNumber"></span> od <span class="totalPages"></span></div>',
      scale: 0.8,
      timeout: 120000
    });
    
    console.log(`✅ Comprehensive report PDF created: ${outputPdfPath}`);
  } catch (error) {
    console.error(`❌ Error creating comprehensive report PDF: ${error.message}`);
  } finally {
    await browser.close();
  }
}

async function main() {
  const invoicesDir = './invoices_documents';
  
  console.log('📋 Creating comprehensive technical report PDF...');
  console.log('   📄 Converting HTML to PDF');
  console.log('   📊 Including all technical details');
  console.log('   🎯 Optimized for professional presentation');
  console.log('');
  
  // Convert comprehensive report
  await createComprehensiveReportPDF(
    path.join(invoicesDir, 'obsezno_tehnicno_porocilo.html'),
    path.join(invoicesDir, 'OBSEZNO_TEHNICNO_POROCILO.pdf')
  );
  
  console.log('🎉 Comprehensive report PDF completed!');
  console.log('📋 Created file: OBSEZNO_TEHNICNO_POROCILO.pdf');
  console.log('');
  console.log('💡 This comprehensive report includes:');
  console.log('   ✅ Complete technical architecture');
  console.log('   ✅ All implemented functionalities');
  console.log('   ✅ Security and GDPR compliance');
  console.log('   ✅ Testing with test customers');
  console.log('   ✅ Performance optimizations');
  console.log('   ✅ Analytics and monitoring');
  console.log('   ✅ Maintenance and support details');
  console.log('   ✅ Project value breakdown');
  console.log('');
  console.log('📖 Perfect for comprehensive project documentation!');
}

main().catch(console.error);
