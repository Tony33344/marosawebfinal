import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';

async function convertHtmlToPdfChrome(htmlFilePath, outputPdfPath) {
  const browser = await puppeteer.launch({
    headless: true,
    args: [
      '--no-sandbox', 
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-accelerated-2d-canvas',
      '--no-first-run',
      '--no-zygote',
      '--disable-gpu'
    ]
  });
  
  try {
    const page = await browser.newPage();
    
    // Set viewport for consistent rendering
    await page.setViewport({ width: 1200, height: 800 });
    
    // Read HTML file
    const htmlContent = fs.readFileSync(htmlFilePath, 'utf8');
    
    // Set content and wait for everything to load
    await page.setContent(htmlContent, { 
      waitUntil: ['networkidle0', 'domcontentloaded'],
      timeout: 60000 
    });
    
    // Wait a bit more for fonts and styles to load
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Generate PDF with optimal settings
    await page.pdf({
      path: outputPdfPath,
      format: 'A4',
      printBackground: true,
      preferCSSPageSize: false,
      margin: {
        top: '15mm',
        bottom: '15mm',
        left: '10mm',
        right: '10mm'
      },
      displayHeaderFooter: false
    });
    
    console.log(`✅ High-quality PDF created: ${outputPdfPath}`);
  } catch (error) {
    console.error(`❌ Error creating PDF: ${error.message}`);
  } finally {
    await browser.close();
  }
}

async function main() {
  const invoicesDir = './invoices_documents';
  
  // Convert both HTML files to PDF with better quality
  await convertHtmlToPdfChrome(
    path.join(invoicesDir, 'povzetek_projekta_profesionalno.html'),
    path.join(invoicesDir, 'povzetek_projekta_FINAL.pdf')
  );
  
  await convertHtmlToPdfChrome(
    path.join(invoicesDir, 'racun_profesionalno.html'),
    path.join(invoicesDir, 'racun_FINAL.pdf')
  );
  
  console.log('🎉 High-quality PDF conversion completed!');
}

main().catch(console.error);
