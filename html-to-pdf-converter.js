import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';

async function convertHtmlToPdf(htmlFilePath, outputPdfPath) {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  try {
    const page = await browser.newPage();
    
    // Read HTML file
    const htmlContent = fs.readFileSync(htmlFilePath, 'utf8');
    
    // Set content
    await page.setContent(htmlContent, { 
      waitUntil: 'networkidle0',
      timeout: 30000 
    });
    
    // Generate PDF with high quality settings
    await page.pdf({
      path: outputPdfPath,
      format: 'A4',
      printBackground: true,
      margin: {
        top: '20mm',
        bottom: '20mm',
        left: '15mm',
        right: '15mm'
      },
      preferCSSPageSize: true
    });
    
    console.log(`✅ PDF created: ${outputPdfPath}`);
  } catch (error) {
    console.error(`❌ Error creating PDF: ${error.message}`);
  } finally {
    await browser.close();
  }
}

async function main() {
  const invoicesDir = './invoices_documents';
  
  // Convert both HTML files to PDF
  await convertHtmlToPdf(
    path.join(invoicesDir, 'povzetek_projekta_profesionalno.html'),
    path.join(invoicesDir, 'povzetek_projekta_profesionalno_NOVO.pdf')
  );
  
  await convertHtmlToPdf(
    path.join(invoicesDir, 'racun_profesionalno.html'),
    path.join(invoicesDir, 'racun_profesionalno_NOVO.pdf')
  );
  
  console.log('🎉 Conversion completed!');
}

main().catch(console.error);
