const cheerio = require('cheerio');

class ProductParser {
    constructor() {
        this.data = {
            sanatciAd: "",
            sanatciDogumOlum: null,
            turu: "",
            eserAdi: "",
            lotNo: 0,
            teklifSayisi: 0,
            muzayedeNo: "",
            tarih: null,
            boyutEn: null,
            boyutBoy: null,
            boyutBirim: "cm",
            imzali: false,
            tarihi: null,
            baslangicFiyati: 0.00,
            satisFiyati: null,
            guncelDegerOrtalamasi: null,
            link: ""
        };
    }

    parseProductDetail(html,url) {
        const $ = cheerio.load(html);

        try {
            const lotNo = $('.online-auction-product__lotno.artamOnlineAuctionProductDetail__lotno').text().trim();
            this.data.lotNo = parseInt(lotNo.replace(/[^0-9]/g, ''));
            this.data.muzayedeNo = "396"; // TODO: muzayedeNo dinamik olmalı


            const sanatciInfo = $('.online-auction-product__name.artamOnlineAuctionProductDetail__name').text().trim();
            this.data.sanatciAd = sanatciInfo.split('(')[0].trim();
            this.data.sanatciDogumOlum = sanatciInfo.match(/\((.*?)\)/);



        
            const literatureText = $('.categoryProduct__longDesc').text().trim();
            const eserAdiMatch = literatureText.match(/"([^"]+)"/);
            this.data.eserAdi = eserAdiMatch[1];
            

            const descText = $('.online-auction-product__desc, .artamOnlineAuctionProductDetail__desc').text().trim();

            const teknikMatch = descText.match(/([^,]+) üzerine ([^,]+)/);
            this.data.turu = this.data.turu + " "+ teknikMatch ? `${teknikMatch[2]} (${teknikMatch[1]})` : null;

            this.data.imzali = descText.toLowerCase().includes('imzalı');

            const tarihMatch = descText.match(/(\d{4}) tarihli/);
            this.data.tarihi = tarihMatch ? new Date(tarihMatch[1]) : null;

            const boyutMatch = descText.match(/(\d+)x(\d+)\s*(cm|mm|m)/i);
            if (boyutMatch) {
                this.data.boyutEn = parseInt(boyutMatch[1]);
                this.data.boyutBoy = parseInt(boyutMatch[2]);
                this.data.boyutBirim = boyutMatch[3].toLowerCase();
            }

            const bitisText = $('.artamOnlineAuctionProductDetail__finishedTime').text().trim();
            const bitisTarihiMatch = bitisText.match(/(\d{2})\.(\d{2})\.(\d{4})/);
            if (bitisTarihiMatch) {
                this.data.tarih = new Date(
                    bitisTarihiMatch[3], 
                    bitisTarihiMatch[2] - 1, 
                    bitisTarihiMatch[1]
                );
            }

            const guncelFiyat = $('.online-auction-product__price span').text().trim();
            const guncelFiyatMatch = guncelFiyat.match(/(\d+(?:,\d+)*(?:\.\d+)?)\s*TL/);
            if (guncelFiyatMatch) {
                this.data.satisFiyati = parseFloat(guncelFiyatMatch[1].replace(/[.,]/g, ''));
            }

            const baslangicText = $('.artamOnlineAuctionProductDetail__openingPrice').text().trim();
            const baslangicMatch = baslangicText.match(/(\d+(?:,\d+)*(?:\.\d+)?)\s*TL/);
            if (baslangicMatch) {
                this.data.baslangicFiyati = parseFloat(baslangicMatch[1].replace(/[.,]/g, ''));
            }

            const averageText = $('.artamOnlineAuctionProductDetail__averagePrice').text().trim();
            const averageMatch = averageText.match(/(\d+(?:,\d+)*(?:\.\d+)?)\s*TL\s*-\s*(\d+(?:,\d+)*(?:\.\d+)?)\s*TL/);
            if (averageMatch) {
                const min = parseFloat(averageMatch[1].replace(/[.,]/g, ''));
                const max = parseFloat(averageMatch[2].replace(/[.,]/g, ''));
                this.data.guncelDegerOrtalamasi = (min + max) / 2;
            }

            this.data.link = url;

            const teklifText = $('.online-auction-product__offer_count').text().trim();
            const teklifMatch = teklifText.match(/\d+/);
            this.data.teklifSayisi = teklifMatch ? parseInt(teklifMatch[0]) : 0;

            return this.data;
        } catch (error) {
            console.error('Parse hatası:', error);
            return null;
        }
    }
}

module.exports = ProductParser;
