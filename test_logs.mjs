import puppeteer from 'puppeteer';

(async () => {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    
    page.on('console', msg => {
        if (msg.text().includes('[NOVA 3D]')) {
            console.log(msg.text());
        }
    });

    console.log('Navigating to http://localhost:5173...');
    try {
        await page.goto('http://localhost:5173', { waitUntil: 'networkidle0', timeout: 15000 });
    } catch (e) {
        console.error('Error navigating:', e.message);
    }
    
    await new Promise(resolve => setTimeout(resolve, 5000));
    await browser.close();
})();
