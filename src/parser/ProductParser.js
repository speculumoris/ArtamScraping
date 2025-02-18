const cheerio = require("cheerio");

function convertTurkishChars(str) {
  const turkishChars = {
    ç: "c",
    Ç: "C",
    ğ: "g",
    Ğ: "G",
    ı: "i",
    I: "I",
    İ: "I",
    i: "i",
    ö: "o",
    Ö: "O",
    ş: "s",
    Ş: "S",
    ü: "u",
    Ü: "U",
  };
  return str.replace(/[çÇğĞıİöÖşŞüÜ]/g, (char) => turkishChars[char] || char);
}

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
      baslangicFiyati: 0.0,
      satisFiyati: null,
      guncelDegerOrtalamasi: "",
      baskiBilgisi: "",
      bagisBilgisi: "",
      link: "",
      imageLink: "",
    };
  }

  parseProductDetail(html, url) {
    const $ = cheerio.load(html);

    try {
      const detailContainer = $(".artamOnlineAuctionProductDetail");
      if (!detailContainer.length) {
        console.error("Detay container bulunamadı");
        return null;
      }

      const parts = url.split("/");
      const sanatciEser = parts[parts.length - 1];
      const regex = /^(.*?)-(\d{4}(?:-\d{4})?)-(.*?)(?:-(\d+))?$/;
      const match = sanatciEser.match(regex);

      if (match) {
        this.data.sanatciAd = convertTurkishChars(
          match[1].replace(/-/g, " ").trim()
        );
        this.data.sanatciDogumOlum = match[2];
        this.data.eserAdi = convertTurkishChars(
          match[3].replace(/-/g, " ").trim()
        );

        if (match[4]) {
          this.data.eserAdi += ` ${match[4]}`;
        }
      }

      if (!this.data.sanatciAd || !this.data.sanatciDogumOlum) {
        const sanatciElement = detailContainer
          .find(
            ".online-auction-product__name.artamOnlineAuctionProductDetail__name"
          )
          .first();
        const sanatciText = sanatciElement.text().trim();
        const sanatciMatch = sanatciText.match(/(.*?)\s*\((\d{4}-\d{4})\)/);

        if (sanatciMatch) {
          this.data.sanatciAd = convertTurkishChars(sanatciMatch[1].trim());
          this.data.sanatciDogumOlum = sanatciMatch[2];
        }
      }

      if (!this.data.eserAdi) {
        const eserAdi = detailContainer
          .find(
            ".online-auction-product__name.artamOnlineAuctionProductDetail__name"
          )
          .eq(1)
          .text()
          .trim();
        this.data.eserAdi = convertTurkishChars(eserAdi);
      }

      const lotNoText = detailContainer
        .find(
          ".online-auction-product__lotno.artamOnlineAuctionProductDetail__lotno"
        )
        .text()
        .trim();
      this.data.lotNo = parseInt(lotNoText.replace(/[^0-9]/g, ""));
      this.data.muzayedeNo = "396";

      const descText = detailContainer
        .find(
          ".online-auction-product__desc.artamOnlineAuctionProductDetail__desc"
        )
        .text()
        .trim();

      const baskiRegex =
        /(?:Baskı\.\s*Edition:\s*([^.]+)|müze\s+baskısı|museum\s+print|Baskı)/i;
      const baskiMatch = descText.match(baskiRegex);

      if (baskiMatch) {
        if (baskiMatch[1]) {
          this.data.baskiBilgisi = convertTurkishChars(baskiMatch[1].trim());
        } else {
          const muzeMatch = url.match(/muze-baskisi-(.+)$/);
          if (muzeMatch) {
            this.data.baskiBilgisi = `Müze Baskısı - ${convertTurkishChars(
              muzeMatch[1].replace(/-/g, " ").trim()
            )}`;
          } else {
            this.data.baskiBilgisi = "Baskı";
          }
        }
      }

      const cleanDesc = descText.replace(/\d+x\d+cm-\s*/, "");
      const bagisMatch = cleanDesc.match(
        /([^.]+(?:derneği|vakfı|kurumu)[^.]*bağış[^.]*\.)/i
      );
      if (bagisMatch) {
        this.data.bagisBilgisi = convertTurkishChars(bagisMatch[1].trim());
      }

      const teknikMatch = descText.match(/([^,.]+) üzerine ([^,.]+)/);
      if (teknikMatch) {
        this.data.turu = convertTurkishChars(
          `${teknikMatch[2]} (${teknikMatch[1]})`
        );
      } else {
        const parts = descText.split(/[.,]/).map((part) => part.trim());
        console.log("Parçalar:", parts); // Debugging amaçlı

        let teknik = parts[0].split(/\s+/)[0];
        let yuzey = "";

        for (const part of parts) {
          console.log("İncelenen Parça:", part); // Hangi parça inceleniyor?
          const parantezMatch = part.match(/\(([^)]+)\)/);
          if (parantezMatch) {
            yuzey = parantezMatch[1].trim();
            console.log("Parantez İçeriği:", yuzey);
            break;
          }
        }

        let turu = yuzey ? `${teknik} (${yuzey})` : teknik;
        console.log("Sonuçlanan Türü:", turu);
        this.data.turu = convertTurkishChars(turu);
      }

      this.data.imzali = descText.toLowerCase().includes("imzalı");

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

      const priceElement = detailContainer
        .find(".online-auction-product__price.d-iblock span")
        .first();
      if (priceElement.length) {
        const priceText = priceElement.text().trim();
        const priceMatch = priceText.match(/(\d+(?:,\d+)*(?:\.\d+)?)\s*TL/);
        if (priceMatch) {
          this.data.satisFiyati = parseFloat(
            priceMatch[1].replace(/[.,]/g, "")
          );
        }
      }

      const teklifText = detailContainer
        .find(".online-auction-product__offer_count")
        .text()
        .trim();
      const teklifMatch = teklifText.match(/Teklifler:\s*(\d+)/);
      if (teklifMatch) {
        this.data.teklifSayisi = parseInt(teklifMatch[1]);
      }

      const averageText = detailContainer
        .find(".artamOnlineAuctionProductDetail__averagePrice")
        .text()
        .trim();
      if (averageText) {
        const cleanText = averageText.replace(/\./g, "");

        const priceRegex =
          /(?:Güncel Değer Ortalaması:)?\s*(\d+(?:,\d+)*)\s*TL\s*-\s*(\d+(?:,\d+)*)\s*TL/i;
        const matches = cleanText.match(priceRegex);

        if (matches) {
          const firstPrice = matches[1].replace(/,/g, ".");
          const secondPrice = matches[2].replace(/,/g, ".");

          this.data.guncelDegerOrtalamasi = `${firstPrice} TL - ${secondPrice} TL`;

          console.log("Güncel Değer Parse Sonucu:", {
            rawText: averageText,
            cleanText: cleanText,
            parsedValue: this.data.guncelDegerOrtalamasi,
          });
        }
      }

      const bitisText = detailContainer
        .find(".artamOnlineAuctionProductDetail__finishedTime")
        .text()
        .trim();
      const bitisTarihiMatch = bitisText.match(
        /(\d{2})\.(\d{2})\.(\d{4})\s+(\d{2}):(\d{2})/
      );
      if (bitisTarihiMatch) {
        this.data.tarih = new Date(
          bitisTarihiMatch[3],
          bitisTarihiMatch[2] - 1,
          bitisTarihiMatch[1],
          bitisTarihiMatch[4],
          bitisTarihiMatch[5]
        );
      }

      const baslangicText = detailContainer
        .find(".artamOnlineAuctionProductDetail__openingPrice")
        .text()
        .trim();
      const baslangicMatch = baslangicText.match(
        /(\d+(?:,\d+)*(?:\.\d+)?)\s*TL/
      );
      if (baslangicMatch) {
        this.data.baslangicFiyati = parseFloat(
          baslangicMatch[1].replace(/[.,]/g, "")
        );
      }

      const imgUrl = $(".artamOnlineAuctionProductDetail__imgWrapper img")
        .first()
        .attr("src");
      this.data.imageLink = imgUrl;
      this.data.link = url;

      console.log("Parse edilen sanatçı bilgileri:", {
        sanatciAd: this.data.sanatciAd,
        sanatciDogumOlum: this.data.sanatciDogumOlum,
      });

      return this.data;
    } catch (error) {
      console.error(`Parse hatası:`, error);
      return null;
    }
  }
}

module.exports = ProductParser;
