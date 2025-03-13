const puppeteer = require("puppeteer");
const fs = require("fs");
const { join } = require("path");
const { MongoClient } = require('mongodb');

const cookiesPath =
  "/Users/yusufsefabayindir/Desktop/puppeteer/artscraping/cookies.json";
const artistsPath =
  "/Users/yusufsefabayindir/Desktop/puppeteer/artscraping/artist1.json";
const outputPath =
  "/Users/yusufsefabayindir/Desktop/puppeteer/artscraping/artworks3.json";

// MongoDB URI ve veritabanı adı
const uri = "mongodb://localhost:27017";
const dbName = "artDatabase";

(async () => {
  const browser = await puppeteer.launch({
    headless: true,
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
  }

  console.log("🟡 Artam giriş sayfasına gidiliyor...");
  await page.setViewport({ width: 1080, height: 3500 });

  await page.goto("http://lebriz.com/pages/auction_DB.aspx?lang=ENG", {
    waitUntil: "domcontentloaded",
  });

  await sleep(1000);

  console.log("🔍 Sanatçılar JSON dosyasından okunuyor...");
  const rawArtistsData = fs.readFileSync(artistsPath, "utf-8");
  const artists = JSON.parse(rawArtistsData);

  let allArtworks = [];

  const startPage = 12; 

  const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });
  try {
    await client.connect();
    const db = client.db(dbName);
    const artworksCollection = db.collection('artworks');

    for (const artist of artists) {
      const artistParts = artist.split(" ");
      const artistName = artistParts.slice(0, -1).join(" ");

      console.log(`🟢 ${artistName} için arama yapılıyor...`);
      await page.waitForSelector("#pnlInfo_comboArtists_Input", {
        visible: true,
      });
      await page.click("#pnlInfo_comboArtists_Input", { clickCount: 3 });
      await page.type("#pnlInfo_comboArtists_Input", artistName, { delay: 100 });

      await sleep(1000);

      await page.waitForSelector(".rcbList li", { visible: true });
      await sleep(1000);
      await page.evaluate(() => {
        let firstItem = document.querySelector(".rcbList li");
        if (firstItem) firstItem.click();
      });

      await page.waitForSelector("#pnlInfo_butSubmitArtists");
      await page.click("#pnlInfo_butSubmitArtists");

      await sleep(2000);

      const textContent = await page.$eval('#aucDB_awv_pager1_tdLabels1', el => el.innerText);

      const worksMatch = textContent.match(/Total number of works :\s*\b([\d,]+)\b/);
      const pageMatch = textContent.match(/Page :\s*\b(\d+)\/(\d+)\b/);

      const totalWorks = worksMatch ? parseInt(worksMatch[1].replace(/,/g, ''), 10) : null;
      const totalPages = pageMatch ? parseInt(pageMatch[2], 10) : null;
      

      if (totalPages === 0) {
        console.warn("🚨 Hiç sayfa veya thumbnail bulunamadı!");
      }

      for (let currentPage = 1; currentPage <= totalPages; currentPage++) {
        if (currentPage < startPage) {
          try {
            await page.select(
              '#aucDB_awv_pager1_drpPage', 
              startPage.toString()
            );

            await page.evaluate(() => {
              const dropdown = document.getElementById('aucDB_awv_pager1_drpPage');
              if (dropdown) {
                __doPostBack('aucDB$awv$pager1$drpPage', '');
              }
            });

            await page.waitForNavigation({ 
              waitUntil: 'networkidle0', 
              timeout: 15000 
            });

            await page.waitForSelector(
              '[id^="aucDB_awv_lstThumbs_ctl"][id$="_awd_awd_aucdb_img1"]', 
              { visible: true, timeout: 10000 }
            );

            await sleep(2000);

            currentPage = startPage;
          } catch (navigationError) {
            console.error('Sayfa geçişi sırasında hata:', navigationError);
            continue;
          }
        }

        console.log(
          `🔄 ${artistName} için ${currentPage}/${totalPages} sayfası işleniyor...`
        );

        const thumbnailCount = await page.evaluate(() => {
          const thumbs = document.querySelectorAll(
            '[id^="aucDB_awv_lstThumbs_ctl"][id$="_awd_awd_aucdb_img1"]'
          );
          return thumbs.length;
        });

        for (let i = 0; i < thumbnailCount; i++) {
          console.log(`🖼️ Thumbnail ${i + 1} detayları alınıyor...`);

          await page.evaluate((index) => {
            const thumbs = document.querySelectorAll(
              '[id^="aucDB_awv_lstThumbs_ctl"][id$="_awd_awd_aucdb_img1"]'
            );
            thumbs[index].click();
          }, i);

          await page.waitForSelector("#aucDB_awv_awdFullLeft_tblFull", {
            timeout: 10000,
          });
          await sleep(2000);

          const artworkDetails = await page.evaluate(() => {
            const details = {};

            try {
              const infoTable = document.querySelector(".awdInfoPanel");
              const infoRows = Array.from(infoTable.querySelectorAll("tr"));

              const artistLink = document.querySelector('a[href*="artistID"]');
              const artistName = artistLink ? artistLink.textContent.trim() : '';
              details.artist = artistName;
              details.title = infoRows.find(row => {
                  const rowText = row.textContent.trim();
                  return (
                      rowText.length > 0 && 
                      rowText !== artistName &&
                      !rowText.includes('cm.') && 
                      !rowText.includes('in.') && 
                      !rowText.toLowerCase().includes('oil') && 
                      !rowText.toLowerCase().includes('canvas') && 
                      !rowText.toLowerCase().includes('signed') &&
                      !rowText.toLowerCase().includes('provenance') &&
                      !rowText.toLowerCase().includes('auction') &&
                      !/^\d{4}('s)?$/.test(rowText) &&
                      !rowText.toLowerCase().includes(' on ') &&
                      !rowText.toLowerCase().includes('opening price') &&
                      !rowText.toLowerCase().includes('estimate') &&
                      !rowText.toLowerCase().includes('sale price') &&
                      !rowText.toLowerCase().includes('not sold') &&
                      !/\d+(\s*-\s*\d+)?(\s*[A-Z]{3})?$/.test(rowText) &&
                      !['trl', 'usd', 'eur', 'gbp'].some(currency => 
                          rowText.toLowerCase().includes(currency)
                      )
                  );
              })?.textContent.trim() || null;

              const dimensionRows = infoRows.filter((row) =>
                /(\d+(\.\d+)?\s*x\s*\d+(\.\d+)?)\s*(cm\.|in\.)/.test(
                  row.textContent
                )
              );
              details.dimensions = {
                metric:
                  dimensionRows
                    .find((row) => row.textContent.includes("cm."))
                    ?.textContent.trim() || "",
                imperial:
                  dimensionRows
                    .find((row) => row.textContent.includes("in."))
                    ?.textContent.trim() || "",
              };

              const yearRow = infoRows.find((row) => {
                const yearText = row.textContent.trim();
                return (
                  /^\d{4}$/.test(yearText) || // Tam yıl (1940)
                  /^\d{4}'s$/.test(yearText) || // 1940's
                  /^Early \d{4}'s$/.test(yearText) || // Early 1940's
                  /^Late \d{4}'s$/.test(yearText) || // Late 1940's
                  /^\d{4}-\d{4}$/.test(yearText) || // Yıl aralığı
                  /^\d{4}'s - \d{4}'s$/.test(yearText) // Dönem aralığı
                );
              });
              details.year = yearRow ? yearRow.textContent.trim() : "";

              const materialRow = infoRows.find(
                (row) =>
                  row.textContent.toLowerCase().includes("on") &&
                  (row.textContent.toLowerCase().includes("oil") ||
                    row.textContent.toLowerCase().includes("canvas"))
              );
              details.material = materialRow
                ? materialRow.textContent
                    .trim()
                    .split("on")
                    .map((part) => part.trim())
                    .join("(") + ")"
                : "";

              details.isSigned = infoRows.some(
                (row) => row.textContent.trim().toLowerCase() === "signed"
              );

              const auctionRow = infoRows.find((row) =>
                row.textContent.includes("Auction :")
              );
              if (auctionRow) {
                const auctionParts = auctionRow.textContent
                  .replace("Auction :", "")
                  .trim()
                  .split("-");
                details.auction = {
                  house: auctionParts[0].trim(),
                  date: auctionParts[1]?.trim() || "",
                };
              }

              const extractPrices = (priceRow, isOpeningPrice = false) => {
                const priceTable = priceRow.querySelector('table');
                if (!priceTable) return [];

                return Array.from(priceTable.querySelectorAll('tr')).map(tr => {
                  const cells = tr.querySelectorAll('td');
                  let price = '';
                  let currency = '';

                  const img = cells[0].querySelector('img');
                  if (img) {
                    price = new URL(img.src).searchParams.get('t') || cells[0].textContent.trim();
                    price = price.replace(/,/g, '');
                  } else {
                    price = cells[0]?.textContent.trim() || '';
                    price = price.replace(/,/g, '');
                  }

                  if (price.includes('-')) {
                    const [min, max] = price.split('-').map(p => p.trim());
                    price = `${min}.00 - ${max}.00`;
                  } else {
                    price = `${price}.00`;
                  }

                  price = price.replace(/\.00\.00$/, '.00');

                  currency = cells[1]?.textContent.trim() || '';

                  return { price, currency };
                }).filter(item => item.price);
              };

              const priceRows = infoRows.filter(
                row => 
                  row.textContent.includes('Estimate :') || 
                  row.textContent.includes('Opening price :') || 
                  row.textContent.includes('Sale price :')
              );

              const estimateRow = priceRows.find(row => row.textContent.includes('Estimate :'));
              const openingPriceRow = priceRows.find(row => row.textContent.includes('Opening price :'));
              const salePriceRow = priceRows.find(row => row.textContent.includes('Sale price :'));

              details.prices = {
                estimate: estimateRow ? extractPrices(estimateRow) : null,
                opening: openingPriceRow ? extractPrices(openingPriceRow, true) : null,
                sale: salePriceRow ? extractPrices(salePriceRow) : null
              };

              const provenanceRow = infoRows.find((row) =>
                row.textContent.toLowerCase().includes("provenance")
              );
              details.provenance = provenanceRow
                ? provenanceRow.textContent.replace("Provenance:", "").trim()
                : "";
            } catch (error) {
              console.error("Artwork details extraction error:", error);
              details.extractionError = error.toString();
            }

            return details;
          });

          let existingData = [];
          if (fs.existsSync(outputPath)) {
            const rawData = fs.readFileSync(outputPath, "utf-8");
            existingData = JSON.parse(rawData);
          }

          existingData.push({
            artist: artist,
            artwork: artworkDetails,
          });

          try {
            await artworksCollection.insertOne({
              artist: artist,
              artwork: artworkDetails,
            });
            console.log(`✅ ${artworkDetails.artist} - Artwork details saved to MongoDB`);
          } catch (insertError) {
            console.error(`❌ Error saving artwork details for ${artist}: ${insertError}`);
          }

          await page.goBack();
          await page.waitForSelector(
            '[id^="aucDB_awv_lstThumbs_ctl"][id$="_awd_awd_aucdb_img1"]'
          );
        }

        if (currentPage < totalPages) {
          try {
            // Sonraki sayfaya geçiş kodları
            await page.select(
              "#aucDB_awv_pager1_drpPage",
              (currentPage + 1).toString()
            );

            await page.evaluate(() => {
              __doPostBack('aucDB$awv$pager1$drpPage', '');
            });

            await page.waitForNavigation({ 
              waitUntil: 'networkidle0', 
              timeout: 15000 
            });

            await page.waitForSelector(
              '[id^="aucDB_awv_lstThumbs_ctl"][id$="_awd_awd_aucdb_img1"]', 
              { visible: true, timeout: 10000 }
            );

            await sleep(2000);
          } catch (navigationError) {
            console.error('Sayfa geçişi sırasında hata:', navigationError);
          }
        }
      }
    }
  } catch (connectionError) {
    console.error(`❌ MongoDB connection error: ${connectionError}`);
  } finally {
    await client.close();
  }

  await browser.close();
})();

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
