const puppeteer = require('puppeteer');
const ProductParser = require('../parser/ProductParser');
const db = require('../../models');

this.browserConfig = {
    args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-infobars',
        '--window-position=0,0',
        '--ignore-certificate-errors',
        '--ignore-certificate-errors-spki-list',
        '--disable-accelerated-2d-canvas',
        '--disable-gpu'
    ].filter(Boolean),
    ignoreHTTPSErrors: true,
    headless: 'new',
    defaultViewport: null
};

const saveToDatabase = async (productDetail) => {
    try {
        const eser = await db.Esers.create({
            link: productDetail.link
        });

        console.log(`Eser başarıyla kaydedildi. ID: ${eser.id}`);
        return eser;
    } catch (error) {
        console.error('Veritabanına kayıt hatası:', error);
        throw error;
    }
};

const getTablesFromScraping = async () => {
    const browser = await puppeteer.launch(this.browserConfig);
    const results = [];

    try {
        const page = await browser.newPage();

        await page.goto('https://www.artam.com/muzayede/396-klasik-ve-cagdas-tablolar?count=435', {
            waitUntil: 'networkidle0',
            timeout: 0
        });

        const eserDetayButtons = await page.$$eval('div.online-auction-product__borderBtn', buttons => {
            return buttons
                .filter(button => button.textContent.trim() === 'ESER DETAY')
                .map((_, index) => index);
        });

        console.log(`Toplam Eser Sayısı: ${eserDetayButtons.length}`);

        for (let i = 0; i < eserDetayButtons.length; i++) {
            console.log(`Eser ${i + 1}/${eserDetayButtons.length} işleniyor...`);

            try {
                const buttons = await page.$$('div.online-auction-product__borderBtn');
                const eserDetayButtonsFiltered = [];

                for (const button of buttons) {
                    const text = await page.evaluate(el => el.textContent.trim(), button);
                    if (text === 'ESER DETAY') {
                        eserDetayButtonsFiltered.push(button);
                    }
                }

                // Doğru butona tıkla
                await Promise.all([
                    page.waitForNavigation({ waitUntil: 'networkidle0', timeout: 0 }),
                    eserDetayButtonsFiltered[i].click()
                ]);

                const html = await page.content();
                const currentUrl = page.url();

                const parser = new ProductParser();
                const productDetail = parser.parseProductDetail(html,currentUrl);
                if (productDetail) {
                    productDetail.url = currentUrl;

                    try {
                        const savedEser = await saveToDatabase(productDetail);
                        results.push(savedEser);
                        console.log(`Eser ${i + 1} başarıyla parse edildi ve kaydedildi: ${currentUrl}`);
                    } catch (dbError) {
                        console.error(`Eser ${i + 1} kaydedilirken hata oluştu:`, dbError.message);
                        if (!dbError.name === 'SequelizeUniqueConstraintError') {
                            throw dbError;
                        }
                    }
                }

                await Promise.all([
                    page.waitForNavigation({ waitUntil: 'networkidle0', timeout: 0 }),
                    page.goBack()
                ]);

                // Rate limiting
                await new Promise(resolve => setTimeout(resolve, 1000));

            } catch (error) {
                console.error(`Eser ${i + 1} işlenirken hata oluştu:`, error.message);

                await page.goto('https://www.artam.com/muzayede/396-klasik-ve-cagdas-tablolar?count=435', {
                    waitUntil: 'networkidle0',
                    timeout: 0
                });
            }
        }

        return results;

    } catch (error) {
        console.error('Scraping işlemi sırasında hata:', error);
        throw error;
    } finally {
        await browser.close();
    }
};

module.exports = {
    getTablesFromScraping
};
