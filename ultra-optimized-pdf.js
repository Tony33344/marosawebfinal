import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';

async function createUltraOptimizedPDF(htmlFilePath, outputPdfPath) {
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
    
    // Set ultra high DPI for crisp rendering
    await page.setViewport({ 
      width: 1400, 
      height: 1800, 
      deviceScaleFactor: 3  // Very high DPI
    });
    
    // Read and modify HTML for better PDF rendering
    let htmlContent = fs.readFileSync(htmlFilePath, 'utf8');
    
    // Add CSS optimizations for PDF
    const pdfOptimizations = `
    <style>
      @media print {
        * {
          -webkit-print-color-adjust: exact !important;
          color-adjust: exact !important;
          print-color-adjust: exact !important;
        }
        
        body {
          font-family: 'Segoe UI', Arial, sans-serif !important;
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
        }
        
        .container {
          max-width: none !important;
          margin: 0 !important;
          padding: 20px !important;
        }
        
        .feature-grid {
          display: grid !important;
          grid-template-columns: repeat(2, 1fr) !important;
          gap: 15px !important;
        }
        
        .feature-card {
          break-inside: avoid !important;
          page-break-inside: avoid !important;
        }
        
        .services-table {
          width: 100% !important;
          border-collapse: collapse !important;
        }
        
        .total-section {
          background: linear-gradient(135deg, #2d5a27, #4a7c59) !important;
          -webkit-print-color-adjust: exact !important;
        }
        
        .price-box {
          background: linear-gradient(135deg, #2d5a27, #4a7c59) !important;
          -webkit-print-color-adjust: exact !important;
        }
      }
    </style>
    `;
    
    // Insert optimizations before closing head tag
    htmlContent = htmlContent.replace('</head>', pdfOptimizations + '</head>');
    
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
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // Generate PDF with ultra-optimized settings
    await page.pdf({
      path: outputPdfPath,
      format: 'A4',
      printBackground: true,
      preferCSSPageSize: false,
      margin: {
        top: '12mm',
        bottom: '12mm',
        left: '10mm',
        right: '10mm'
      },
      displayHeaderFooter: false,
      scale: 0.75,  // Optimal scale for content fit
      timeout: 60000
    });
    
    console.log(`✅ Ultra-optimized PDF created: ${outputPdfPath}`);
  } catch (error) {
    console.error(`❌ Error creating ultra-optimized PDF: ${error.message}`);
  } finally {
    await browser.close();
  }
}

async function main() {
  const invoicesDir = './invoices_documents';
  
  console.log('🚀 Starting ultra-optimized PDF conversion...');
  
  // Convert both HTML files to PDF with ultra-optimized settings
  await createUltraOptimizedPDF(
    path.join(invoicesDir, 'povzetek_projekta_profesionalno.html'),
    path.join(invoicesDir, 'povzetek_ULTRA.pdf')
  );
  
  await createUltraOptimizedPDF(
    path.join(invoicesDir, 'racun_profesionalno.html'),
    path.join(invoicesDir, 'racun_ULTRA.pdf')
  );
  
  console.log('🎉 Ultra-optimized PDF conversion completed!');
  console.log('📋 Created files:');
  console.log('   - povzetek_ULTRA.pdf');
  console.log('   - racun_ULTRA.pdf');
  console.log('');
  console.log('💡 These PDFs should have:');
  console.log('   ✅ Perfect color preservation');
  console.log('   ✅ High-resolution rendering');
  console.log('   ✅ Optimized layout for A4');
  console.log('   ✅ Print-ready quality');
}

main().catch(console.error);
