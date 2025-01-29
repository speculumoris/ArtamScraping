const cheerio = require('cheerio');

class ProductParser {
    constructor() {
        this.data = {
            sanatciAd: ""
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

            // İlk elementi dene
            let sanatciElement = detailContainer.find('.online-auction-product__name.artamOnlineAuctionProductDetail__name').first();
            let sanatciText = sanatciElement.text().trim();

            // Eğer ilk element boşsa, ikinci elementi al
            if (!sanatciText) {
                sanatciElement = detailContainer.find('.online-auction-product__name.artamOnlineAuctionProductDetail__name').eq(1);
                sanatciText = sanatciElement.text().trim();
            }

            if (sanatciText) {
                this.data.sanatciAd = sanatciText;
            }

            console.log('Parse edilen sanatçı bilgileri:', {
                sanatciAd: this.data.sanatciAd
            });

            return this.data;

        } catch (error) {
            console.error(`Parse hatası:`, error);
            return null;
        }
    }
}

module.exports = ProductParser;
