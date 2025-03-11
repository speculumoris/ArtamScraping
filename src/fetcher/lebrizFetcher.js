const puppeteer = require('puppeteer');
const fs = require('fs');
const { join } = require("path");
const cookiesPath = "/Users/yusufsefabayindir/Desktop/puppeteer/artscraping/cookies.json";

module.exports = async function lebrizFetcher() {
    const browser = await puppeteer.launch({
        headless: false,
        args: [
            "--disable-setuid-sandbox",
            "--disable-dev-shm-usage",
            "--single-process",
            "--no-sandbox",
            "--window-size=1080,1024",
            "--disable-features=PasswordLeakDetection",
            "--suppress-message-center-popups",
        ],
    });

    const page = await browser.newPage();
    console.log("🟡 Cookie dosyası yükleniyor...");
    if (fs.existsSync(cookiesPath)) {
        const rawCookies = fs.readFileSync(cookiesPath, "utf8");
        const cookies = JSON.parse(rawCookies);

        if (Array.isArray(cookies)) {
            await page.setCookie(...cookies);
            console.log("✅ Cookies yüklendi!");
        } else {
            console.error("❌ Cookies hatalı formatta!");
        }
    } else {
        console.warn("⚠️ Cookie dosyası bulunamadı, giriş yapılacak...");
    }

    console.log("🟡 Artam giriş sayfasına gidiliyor...");
    await page.setViewport({ width: 1080, height: 3500 });

    await page.goto('http://lebriz.com/pages/auction_DB.aspx?lang=TR', { waitUntil: 'domcontentloaded' });

    // Alert'leri otomatik olarak kabul et
    page.on('dialog', async dialog => {
        console.log(dialog.message());
        await dialog.accept();
    });

    await sleep(4000);

    console.log("Giriş yapıldı!");
    await page.waitForSelector('#pnlInfo_comboArtists_Input');
    await page.type('#pnlInfo_comboArtists_Input', ' nuri iyem', { delay: 100 });

    await sleep(1000);

    await page.waitForSelector('.rcbList li', { visible: true });
    await sleep(1000);
    await page.evaluate(() => {
        let firstItem = document.querySelector('.rcbList li');
        if (firstItem) firstItem.click();
    });
    await page.waitForSelector('#pnlInfo_butSubmitArtists');
    await page.click('#pnlInfo_butSubmitArtists');

    await sleep(1000);
    const lots = await page.evaluate(() => {
        let lotElements = document.querySelectorAll('table[class="awdAucdbItem"]'); // Tüm lotları bul
        let results = [];

        lotElements.forEach(lot => {
            let data = {};

            data.image = lot.querySelector('td.awdAucdbItemImg img')?.src || '';
            data.lotNo = lot.querySelector('span[id*="lblLotNo"]')?.innerText.trim() || '';
            data.artist = lot.querySelector('td[id*="fldSanatci"]')?.innerText.trim() || '';
            data.auction = lot.querySelector('td[id*="fldAuction"]')?.innerText.trim() || '';
            data.specs = lot.querySelector('td[id*="fldSpecs"]')?.innerText.trim() || '';

            data.openingPriceTRL = lot.querySelector('td[id*="fldPriceOpeningTRL"]')?.innerText.trim() || '';
            data.salePriceTRL = lot.querySelector('img[id*="imgPriceSaleTRL"]')?.title || '';

            data.openingPriceUSD = lot.querySelector('td[id*="fldPriceOpeningUSD"]')?.innerText.trim() || '';
            data.salePriceUSD = lot.querySelector('img[id*="imgPriceSaleUSD"]')?.title || '';

            data.openingPriceEUR = lot.querySelector('td[id*="fldPriceOpeningEUR"]')?.innerText.trim() || '';
            data.salePriceEUR = lot.querySelector('img[id*="imgPriceSaleEUR"]')?.title || '';
            if (data.lotNo !== ""){
                results.push(data);
            }
        });

        return results;
    });

    console.log(lots);
    await sleep(5000);
    await browser.close();
    return lots;
};

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
