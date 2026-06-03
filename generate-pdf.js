const puppeteer = require('puppeteer');
const path = require('path');

(async () => {
  console.log('🚀 Memulai generate PDF...');

  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();

  const htmlPath = path.resolve(__dirname, 'docs', 'laporan_pendalaman.html');
  const fileUrl = 'file:///' + htmlPath.replace(/\\/g, '/');

  console.log('📄 Membaca file HTML:', fileUrl);
  await page.goto(fileUrl, { waitUntil: 'networkidle0', timeout: 30000 });

  const outputPath = path.resolve(__dirname, 'LAPORAN_PENDALAMAN.pdf');

  await page.pdf({
    path: outputPath,
    format: 'A4',
    printBackground: true,
    margin: {
      top: '15mm',
      bottom: '15mm',
      left: '0mm',
      right: '0mm',
    },
    displayHeaderFooter: true,
    headerTemplate: '<div></div>',
    footerTemplate: `
      <div style="width:100%; text-align:center; font-size:8pt; color:#94a3b8; font-family:Inter,sans-serif; padding:0 60px;">
        <span>Laporan Pendalaman Proyek — WiFi Management FnB</span>
        <span style="float:right;">Halaman <span class="pageNumber"></span> / <span class="totalPages"></span></span>
      </div>
    `,
  });

  await browser.close();

  console.log('✅ PDF berhasil di-generate!');
  console.log('📁 Lokasi file:', outputPath);
})();
