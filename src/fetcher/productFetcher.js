const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const ProductParser = require('../parser/ProductParser');
const { EserlerCsv } = require('../../models');
const uaMac = require('../../assets/UserAgents/ua-mac.json');
const uaFirefox = require('../../assets/UserAgents/ua-firefox.json');

puppeteer.use(StealthPlugin());

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

        const eser = await EserlerCsv.create({
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

const getRandomProxy = () => {
    const hosts = Object.values(proxyConfig.defaultHost);
    const randomIndex = Math.floor(Math.random() * hosts.length);
    return hosts[randomIndex];
};

const getRandomUserAgent = () => {
    const allUserAgents = [...uaMac, ...uaFirefox];
    const randomIndex = Math.floor(Math.random() * allUserAgents.length);
    return allUserAgents[randomIndex];
};

const getProductInformations = async (link, retryCount = 3) => {
    const randomProxyHost = getRandomProxy();
    const randomUserAgent = getRandomUserAgent();
    
    const browser = await puppeteer.launch({
        executablePath: '/usr/bin/google-chrome',
        args: [
            '--start-maximized',
            '--remote-allow-origins=*',
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--window-size=1920,1080',
            '--ignore-certificate-errors',
            '--disable-accelerated-2d-canvas',
            '--disable-gpu',
            '--hide-scrollbars',
            '--disable-notifications',
            '--disable-extensions',
            '--disable-plugins',
            '--disable-web-security',
            `--proxy-server=http://${proxyConfig.username}:${proxyConfig.password}@${randomProxyHost}:${proxyConfig.port}`
        ],
        headless: true,
        timeout: 0,
        ignoreHTTPSErrors: true,
    });


    try {
        const email = "sefa.byndr4@gmail.com";
        const password = "135797531Sef";
        const page = await browser.newPage();
        await page.setViewport({ width: 1920, height: 1080 });
        await page.setDefaultNavigationTimeout(60000);
        await page.setUserAgent(randomUserAgent());
        console.log("🟡 Artam giriş sayfasına gidiliyor...");
        const cookies= 
        await page.setCookie(...cookies);
        /*await page.goto('https://artam.com/giris', { waitUntil: 'networkidle2', timeout: 30000 });

        // Email ve şifre alanlarını bekle
        await page.waitForSelector('#loginEmail', { timeout: 5000 });
        await page.waitForSelector('#loginPassword', { timeout: 5000 });

        // Email ve şifreyi gir
        await page.type('#loginEmail', email, { delay: 100 });  
        await page.type('#loginPassword', password, { delay: 100 });

        // "Oturum Aç" butonuna tıkla
        await page.click('button:has-text("Oturum Aç")');

        // Giriş işlemi sonrası yönlendirmeyi bekle
        await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 10000 });


        */
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
                    const existingProduct = await EserlerCsv.findOne({
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
