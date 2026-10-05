import puppeteer from 'puppeteer';

(async () => {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    
    page.on('console', msg => {
        if (msg.text().includes('[GLB_INSPECT]')) {
            console.log(msg.text());
        }
    });

    await page.evaluateOnNewDocument(() => {
        window._inspected = false;
        const originalConsoleLog = console.log;
        console.log = function(...args) {
            originalConsoleLog.apply(console, args);
            if (args[0] === '[NOVA 3D] ON_ADD') {
                window._ready = true;
            }
        };
    });

    try {
        await page.goto('http://localhost:5173', { waitUntil: 'networkidle0', timeout: 15000 });
        
        await page.evaluate(async () => {
            return new Promise(resolve => {
                const interval = setInterval(() => {
                    // We need to access the scene. We can't directly, but we can hook into Three.js if it's exposed, 
                    // or we can just modify NovaVehicle3D.ts to print wheel positions.
                    resolve();
                }, 500);
            });
        });
    } catch (e) {
        console.error('Error navigating:', e.message);
    }
    
    await browser.close();
})();
