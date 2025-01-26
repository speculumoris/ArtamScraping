const puppeteer = require('puppeteer');
const ProductParser = require('../parser/ProductParser');
const { Eserler } = require('../../models');

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
        // Kaydetmeden önce verileri kontrol et
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
            sanatciDogumOlum: productDetail.sanatciDogumOlum,  
        });

        console.log(`Eser başarıyla kaydedildi. ID: ${eser.id}`);
        return eser;
    } catch (error) {
        console.error('Veritabanına kayıt hatası:', error);
        throw error;
    }
};

const getProductInformations = async (link) => {
    const browser = await puppeteer.launch({
        headless: 'new',
        args: ['--no-sandbox']
    });

    try {
        const page = await browser.newPage();
        await page.goto(link, {
            waitUntil: 'networkidle0',
            timeout: 30000
        });

        const html = await page.content();
        const parser = new ProductParser();
        const productDetail = parser.parseProductDetail(html, link);

        if (productDetail) {
            await Eserler.create(productDetail);
            return true;
        }

        return false;

    } catch (error) {
        console.error(`${link} için hata:`, error);
        throw error;
    } finally {
        await browser.close();
    }
};

module.exports = {
    getProductInformations
};
