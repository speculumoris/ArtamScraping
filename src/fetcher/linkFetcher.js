const puppeteer = require("puppeteer");
const ProductParser = require("../parser/ProductParser");
const db = require("../../models");
const fs = require("fs");
const proxyConfig = require("../../config/proxy_config.json");
const uaMac = require("../../assets/UserAgents/ua-mac.json");
const uaFirefox = require("../../assets/UserAgents/ua-firefox.json");
const cookiesPath = "/Users/yusufsefabayindir/IdeaProjects/ArtamScraping/config/cookies.json"; 



const getRandomUserAgent = () => {
  const allUserAgents = [...uaMac, ...uaFirefox];
  const randomIndex = Math.floor(Math.random() * allUserAgents.length);
  return allUserAgents[randomIndex];
};

const saveToDatabase = async (productDetail) => {
  try {
    const eser = await db.EserlerCsv.create({
      sanatciAd: productDetail.sanatciAd.toUpperCase(),
      sanatciDogumOlum: productDetail.sanatciDogumOlum,
      bagisBilgisi: productDetail.bagisBilgisi,
      baskiBilgisi: productDetail.baskiBilgisi,
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
    });

    console.log(`Eser başarıyla kaydedildi. ID: ${eser.id}`);
    return eser;
  } catch (error) {
    console.error("Veritabanına kayıt hatası:", error);
    throw error;
  }
};

const getProcessedLotNumbers = async () => {
    const processedLots = await db.EserlerCsv.findAll({
        attributes: ['lotNo'],
        raw: true
    });
    return processedLots.map(lot => lot.lotNo);
};

const getMaxProcessedLotNumber = async () => {
    const maxLot = await db.EserlerCsv.max('lotNo');
    return maxLot || 0; // Eğer hiç kayıt yoksa 0 döner
};

const getTablesFromScraping = async () => {
  const randomUserAgent = getRandomUserAgent();

  const browser = await puppeteer.launch({
    //executablePath: '/usr/bin/google-chrome',
    args: [
      "--start-maximized",
      "--remote-allow-origins=*",
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
      "--window-size=1920,1080",
      "--ignore-certificate-errors",
      "--disable-accelerated-2d-canvas",
      "--disable-gpu",
      "--hide-scrollbars",
      "--disable-notifications",
      "--disable-extensions",
      "--disable-plugins",
      "--disable-web-security",
      //`--proxy-server=${randomProxyHost}:${proxyConfig.port}`
    ],
    headless: true,
    timeout: 0,
    ignoreHTTPSErrors: true,
  });
  const results = [];

  try {
  
    const page = await browser.newPage();
    //await page.authenticate({
    //    username: proxyConfig.username,
    //    password: proxyConfig.password
    //});

    await page.setViewport({ width: 1920, height: 1080 });
    await page.setDefaultNavigationTimeout(60000);
    await page.setUserAgent(randomUserAgent);
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
  
    await page.goto(
      "https://www.artam.com/muzayede/396-klasik-ve-cagdas-tablolar?count=435",
      {
        waitUntil: "networkidle0",
        timeout: 0,
      }
    );

    const eserDetayButtons = await page.$$eval(
      "div.online-auction-product__borderBtn",
      (buttons) => {
        return buttons
          .filter((button) => button.textContent.trim() === "ESER DETAY")
          .map((_, index) => index);
      }
    );

    console.log(`Toplam Eser Sayısı: ${eserDetayButtons.length}`);

    const maxProcessedLotNumber = await getMaxProcessedLotNumber();

    for (let i = 0; i < eserDetayButtons.length; i++) {
      console.log(`Eser ${i + 1}/${eserDetayButtons.length} işleniyor...`);

      try {
        const buttons = await page.$$("div.online-auction-product__borderBtn");
        const eserDetayButtonsFiltered = [];

        for (const button of buttons) {
          const text = await page.evaluate(
            (el) => el.textContent.trim(),
            button
          );
          if (text === "ESER DETAY") {
            eserDetayButtonsFiltered.push(button);
          }
        }

        // Doğru butona tıkla
        await Promise.all([
          page.waitForNavigation({ waitUntil: "networkidle0", timeout: 0 }),
          eserDetayButtonsFiltered[i].click(),
        ]);

        const html = await page.content();
        const currentUrl = page.url();

        const parser = new ProductParser();
        const productDetail = parser.parseProductDetail(html, currentUrl);
        if (productDetail) {
          // Eğer lot numarası maxProcessedLotNumber'dan küçükse, atla
          if (productDetail.lotNo <= maxProcessedLotNumber) {
            console.log(`Lot No ${productDetail.lotNo} zaten işlenmiş, atlanıyor.`);
            continue;
          }

          productDetail.url = currentUrl;

          try {
            const savedEser = await saveToDatabase(productDetail);
            results.push(savedEser);
            console.log(
              `Eser ${
                i + 1
              } başarıyla parse edildi ve kaydedildi: ${currentUrl}`
            );
          } catch (dbError) {
            console.error(
              `Eser ${i + 1} kaydedilirken hata oluştu:`,
              dbError.message
            );
            if (dbError.name !== "SequelizeUniqueConstraintError") {
              throw dbError;
            }
          }
        }

        await Promise.all([
          page.waitForNavigation({ waitUntil: "networkidle0", timeout: 0 }),
          page.goBack(),
        ]);

        // Rate limiting
        await new Promise((resolve) => setTimeout(resolve, 1000));
      } catch (error) {
        console.error(`Eser ${i + 1} işlenirken hata oluştu:`, error.message);

        await page.goto(
          "https://www.artam.com/muzayede/396-klasik-ve-cagdas-tablolar?count=435",
          {
            waitUntil: "networkidle0",
            timeout: 0,
          }
        );
      }
    }

    return results;
  } catch (error) {
    console.error("Scraping işlemi sırasında hata:", error);
    throw error;
  } finally {
    await browser.close();
  }
};

module.exports = {
  getTablesFromScraping,
};
