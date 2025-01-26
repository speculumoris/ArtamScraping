const puppeteer = require('puppeteer');
const ProductParser = require('../parser/ProductParser');
const { Eserler } = require('../../models');

const randomDelay = (min, max) => {
    return Math.floor(Math.random() * (max - min + 1) + min);
};

const simulateHumanBehavior = async (page) => {
    await page.evaluate(async () => {
        await new Promise((resolve) => {
            let totalHeight = 0;
            const distance = 100;
            const timer = setInterval(() => {
                window.scrollBy(0, distance);
                totalHeight += distance;
                if (totalHeight >= document.body.scrollHeight) {
                    clearInterval(timer);
                    resolve();
                }
            }, 100);
        });
    });
    
    await page.mouse.move(randomDelay(100, 500), randomDelay(100, 500));
};

const saveToDatabase = async (productDetail) => {
    try {
        console.log('Kaydedilecek veriler:', {
            sanatciDogumOlum: productDetail.sanatciDogumOlum,
            tarihi: productDetail.tarihi
        });

        const eser = await Eserler.create({
            sanatciAd: productDetail.sanatciAd,
            turu: productDetail.turu,
            eserAdi: productDetail.eserAdi,
            lotNo: productDetail.lotNo,
            teklifSayisi: productDetail.teklifSayisi,
            muzayedeNo: productDetail.muzayedeNo,
            tarih: productDetail.tarih,
            boyutEn: productDetail.boyutEn,
            boyutBoy: productDetail.boyutBoy,
            boyutBirim: productDetail.boyutBirim,
            imzali: productDetail.imzali,
            tarihi: productDetail.tarihi,
            baslangicFiyati: productDetail.baslangicFiyati,
            satisFiyati: productDetail.satisFiyati,
            guncelDegerOrtalamasi: productDetail.guncelDegerOrtalamasi,
            link: productDetail.link,
            imageLink: productDetail.imageLink,
            sanatciDogumOlum: productDetail.sanatciDogumOlum
        });

        console.log(`Eser başarıyla kaydedildi. ID: ${eser.id}`);
        return eser;
    } catch (error) {
        console.error('Veritabanına kayıt hatası:', error);
        throw error;
    }
};

const getProductInformations = async (link, retryCount = 3) => {
    const browser = await puppeteer.launch({
        headless: 'new',
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--window-size=1920,1080',
            '--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        ]
    });

    try {
        const page = await browser.newPage();
        await page.setViewport({ width: 1920, height: 1080 });
        await page.setDefaultNavigationTimeout(60000);
        
        await page.setRequestInterception(true);
        page.on('request', (request) => {
            if (['image', 'stylesheet', 'font'].includes(request.resourceType())) {
                request.continue();
            } else {
                request.continue();
            }
        });

        for (let attempt = 1; attempt <= retryCount; attempt++) {
            try {
                console.log(`${link} için ${attempt}. deneme...`);
                
                await page.goto(link, {
                    waitUntil: 'networkidle2',
                    timeout: 30000
                });

                await simulateHumanBehavior(page);
                
                try {
                    await page.waitForSelector('.artamOnlineAuctionProductDetail__averagePrice', {
                        timeout: 10000,
                        visible: true
                    });
                    
                    await page.waitForTimeout(1000);
                    
                    await page.waitForFunction(
                        () => {
                            const el = document.querySelector('.artamOnlineAuctionProductDetail__averagePrice');
                            return el && el.textContent.includes('TL');
                        },
                        { timeout: 5000 }
                    );
                } catch (waitError) {
                    console.log(`⚠️ Güncel değer elementi beklenirken uyarı:`, waitError.message);
                }

                await page.waitForTimeout(randomDelay(2000, 5000));

                const html = await page.content();
                const parser = new ProductParser();
                const productDetail = parser.parseProductDetail(html, link);

                if (productDetail) {
                    const existingProduct = await Eserler.findOne({
                        where: { link: productDetail.link }
                    });

                    if (!existingProduct) {
                        await Eserler.create(productDetail);
                        console.log(`✅ ${link} başarıyla işlendi ve kaydedildi`);
                    } else {
                        console.log(`⚠️ ${link} zaten veritabanında mevcut`);
                    }
                    return true;
                }

                console.log(`❌ ${link} için veri parse edilemedi`);
                return false;

            } catch (error) {
                console.error(`❌ Deneme ${attempt}/${retryCount} başarısız:`, error.message);
                if (attempt === retryCount) throw error;
                await page.waitForTimeout(randomDelay(3000, 7000));
            }
        }

    } catch (error) {
        console.error(`🚫 ${link} için kritik hata:`, error.message);
        throw error;
    } finally {
        if (browser) {
            await browser.close();
        }
    }
};

module.exports = {
    getProductInformations
};
