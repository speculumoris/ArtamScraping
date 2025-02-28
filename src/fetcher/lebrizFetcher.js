const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');
const cookiesPath = path.join(__dirname, '../../config/cookies.json');
const LebrizLot = require('../models/LebrizLot'); // Modeli import edin

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const parseSpecs = (specs) => {
    const boyutRegex = /(\d+\.?\d*)\s*x\s*(\d+\.?\d*)\s*cm/i;
    const turYuzeyRegex = /(.+?)\s*üzerine\s*(.+)/i;

    let boyutEn = null;
    let boyutBoy = null;
    let tur = null;

    const boyutMatch = specs.match(boyutRegex);
    if (boyutMatch) {
        boyutEn = parseFloat(boyutMatch[1]);
        boyutBoy = parseFloat(boyutMatch[2]);
    }

    const turYuzeyMatch = specs.match(turYuzeyRegex);
    if (turYuzeyMatch) {
        const yuzey = turYuzeyMatch[1].trim();
        const teknik = turYuzeyMatch[2].trim();
        tur = `${yuzey} üzerine ${teknik}`;
    }

    return { boyutEn, boyutBoy, tur };
};

const fetchLebrizData = async (artistName) => {
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
        await page.goto('http://lebriz.com/login', { waitUntil: 'domcontentloaded' });

        // Giriş bilgilerini doldur
        await page.waitForSelector('#login_txtEmailStd');
        await page.type('#login_txtEmailStd', 'arsiv@lebriz.com', { delay: 100 });

        await page.waitForSelector('#login_txtPassStd');
        await page.type('#login_txtPassStd', '12345', { delay: 100 });

        await page.waitForSelector('#login_butSubmitStd');
        await page.click('#login_butSubmitStd');

        await page.waitForNavigation({ waitUntil: 'networkidle0' });

        // Çerezleri kaydet
        const cookies = await page.cookies();
        fs.writeFileSync(cookiesPath, JSON.stringify(cookies, null, 2));
        console.log("✅ Giriş yapıldı ve çerezler kaydedildi!");
    }

    console.log("🟡 Lebriz giriş sayfasına gidiliyor...");
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
    await page.type('#pnlInfo_comboArtists_Input', artistName, { delay: 100 });

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

    let currentPage = 1;
    const totalPages = 44; // Toplam sayfa sayısı

    while (currentPage <= totalPages) {
        console.log(`Sayfa ${currentPage} işleniyor...`);

        const lots = await page.evaluate(() => {
            let lotElements = document.querySelectorAll('table[class="awdAucdbItem"]');
            let results = [];

            lotElements.forEach(lot => {
                let data = {};

                data.image = lot.querySelector('td.awdAucdbItemImg img')?.src || '';
                data.lotNo = lot.querySelector('span[id*="lblLotNo"]')?.innerText.trim() || '';
                data.artist = lot.querySelector('td[id*="fldSanatci"]')?.innerText.trim() || '';
                data.auction = lot.querySelector('td[id*="fldAuction"]')?.innerText.trim() || '';
                data.specs = lot.querySelector('td[id*="fldSpecs"]')?.innerText.trim() || '';

                const { boyutEn, boyutBoy, tur } = parseSpecs(data.specs);
                data.boyutEn = boyutEn;
                data.boyutBoy = boyutBoy;
                data.tur = tur;

                data.openingPriceTRL = lot.querySelector('td[id*="fldPriceOpeningTRL"]')?.innerText.trim() || '';
                data.salePriceTRL = lot.querySelector('img[id*="imgPriceSaleTRL"]')?.title || '';

                data.openingPriceUSD = lot.querySelector('td[id*="fldPriceOpeningUSD"]')?.innerText.trim() || '';
                data.salePriceUSD = lot.querySelector('img[id*="imgPriceSaleUSD"]')?.title || '';

                data.openingPriceEUR = lot.querySelector('td[id*="fldPriceOpeningEUR"]')?.innerText.trim() || '';
                data.salePriceEUR = lot.querySelector('img[id*="imgPriceSaleEUR"]')?.title || '';

                if (data.lotNo !== "") {
                    results.push(data);
                }
            });

            return results;
        });

        for (const lot of lots) {
            try {
                await LebrizLot.create(lot);
                console.log(`Lot No ${lot.lotNo} başarıyla kaydedildi.`);
            } catch (error) {
                console.error(`Lot No ${lot.lotNo} kaydedilirken hata oluştu:`, error.message);
            }
        }

        // Sonraki sayfaya geç
        currentPage++;
        if (currentPage <= totalPages) {
            await page.click(`a[href*="Page=${currentPage}"]`);
            await page.waitForNavigation({ waitUntil: 'networkidle0' });
        }
    }

    await browser.close();
};

module.exports = {
    fetchLebrizData,
}; 