const cheerio = require('cheerio');

class ProductParser {
    constructor() {
        this.data = {
            sanatciAd: "",
            sanatciDogumOlum: "",
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
            tarihi: 0,
            baslangicFiyati: 0.00,
            satisFiyati: null,
            guncelDegerOrtalamasi: "",
            link: "",
            imageLink: ""
        };
    }

    parseProductDetail(html, url) {
        const $ = cheerio.load(html);

        try {
            const detailContainer = $('.artamOnlineAuctionProductDetail');
            if (!detailContainer.length) {
                console.error('Detay container bulunamadı');
                return null;
            }
            const parts = url.split('/');
            const sanatciEser = parts[parts.length - 1];

            const regex = /^(.*?)-(\d{4}(?:-\d{4})?)-(.*?)(?:-\d+)?$/;

            const match = sanatciEser.match(regex);
            if (match) {
                this.data.sanatciAd = match[1].replace(/-/g, ' ').trim();
                this.data.sanatciDogumOlum = match[2];
                this.data.eserAdi = match[3].replace(/-/g, ' ').trim()
            }else{
                const sanatciName = detailContainer.find('.online-auction-product__name.artamOnlineAuctionProductDetail__name').first().text().trim();
                const sanatciMatch = sanatciName.match(/(.*?)\s*\((\d{4}-\d{4})\)/);
                if (sanatciMatch) {
                    this.data.sanatciAd = sanatciMatch[1].trim();
                    this.data.sanatciDogumOlum = sanatciMatch[2];
                }

                const eserAdi = detailContainer.find('.online-auction-product__name.artamOnlineAuctionProductDetail__name').eq(1).text().trim();
                this.data.eserAdi = eserAdi;
            }
            const lotNoText = detailContainer.find('.online-auction-product__lotno.artamOnlineAuctionProductDetail__lotno').text().trim();
            this.data.lotNo = parseInt(lotNoText.replace(/[^0-9]/g, ''));
            this.data.muzayedeNo = "396";

            const descText = detailContainer.find('.online-auction-product__desc.artamOnlineAuctionProductDetail__desc').text().trim();

            const teknikMatch = descText.match(/([^,]+) üzerine ([^,]+)/);
            if (teknikMatch) {
                this.data.turu = `${teknikMatch[2]} (${teknikMatch[1]})`;
            }

            this.data.imzali = descText.toLowerCase().includes('imzalı');

            const yearRegex = /\b(19|20)\d{2}\b/g;
            const years = descText.match(yearRegex);
            if (years) {
                this.data.tarihi = parseInt(years);
            }

            const boyutMatch = descText.match(/(\d+)x(\d+)\s*(cm|mm|m)/i);
            if (boyutMatch) {
                this.data.boyutEn = parseInt(boyutMatch[1]);
                this.data.boyutBoy = parseInt(boyutMatch[2]);
                this.data.boyutBirim = boyutMatch[3].toLowerCase();
            }

            const priceElement = detailContainer.find('.online-auction-product__price.d-iblock span').first();
            if (priceElement.length) {
                const priceText = priceElement.text().trim();
                const priceMatch = priceText.match(/(\d+(?:,\d+)*(?:\.\d+)?)\s*TL/);
                if (priceMatch) {
                    this.data.satisFiyati = parseFloat(priceMatch[1].replace(/[.,]/g, ''));
                }
            }

            const teklifText = detailContainer.find('.online-auction-product__offer_count').text().trim();
            const teklifMatch = teklifText.match(/Teklifler:\s*(\d+)/);
            if (teklifMatch) {
                this.data.teklifSayisi = parseInt(teklifMatch[1]);
            }

            const averageText = detailContainer.find('.artamOnlineAuctionProductDetail__averagePrice').text().trim();
            if (averageText) {
                const priceRegex = /(?:Güncel Değer Ortalaması:)?\s*(\d+(?:,\d+)*(?:\.\d+)?)\s*TL\s*-\s*(\d+(?:,\d+)*(?:\.\d+)?)\s*TL/i;
                const matches = averageText.match(priceRegex);
                
                if (matches) {
                    this.data.guncelDegerOrtalamasi = `${matches[1]} TL - ${matches[2]} TL`;
                } else {
                    const numberRegex = /(\d+(?:,\d+)*(?:\.\d+)?)/g;
                    const numbers = averageText.match(numberRegex);
                    if (numbers && numbers.length >= 2) {
                        this.data.guncelDegerOrtalamasi = `${numbers[0]} TL - ${numbers[1]} TL`;
                    }
                }
                
                console.log('Güncel Değer Parse Sonucu:', {
                    rawText: averageText,
                    parsedValue: this.data.guncelDegerOrtalamasi
                });
            }

            const bitisText = detailContainer.find('.artamOnlineAuctionProductDetail__finishedTime').text().trim();
            const bitisTarihiMatch = bitisText.match(/(\d{2})\.(\d{2})\.(\d{4})\s+(\d{2}):(\d{2})/);
            if (bitisTarihiMatch) {
                this.data.tarih = new Date(
                    bitisTarihiMatch[3],
                    bitisTarihiMatch[2] - 1,
                    bitisTarihiMatch[1],
                    bitisTarihiMatch[4],
                    bitisTarihiMatch[5]
                );
            }

            const baslangicText = detailContainer.find('.artamOnlineAuctionProductDetail__openingPrice').text().trim();
            const baslangicMatch = baslangicText.match(/(\d+(?:,\d+)*(?:\.\d+)?)\s*TL/);
            if (baslangicMatch) {
                this.data.baslangicFiyati = parseFloat(baslangicMatch[1].replace(/[.,]/g, ''));
            }

            const imgUrl = $('.artamOnlineAuctionProductDetail__imgWrapper img').first().attr('src');
            this.data.imageLink = imgUrl;
            this.data.link = url;

            console.log('Parse edilen veriler:', {
                sanatciAd: this.data.sanatciAd,
                sanatciDogumOlum: this.data.sanatciDogumOlum,
                tarihi: this.data.tarihi
            });

            return this.data;

        } catch (error) {
            console.error(`Parse hatası:`, error);
            return null;
        }
    }
}

module.exports = ProductParser;
