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
  const uri = "mongodb://localhost:27017";
  const dbName = "artDatabase";


(async () => {
  let client;
  let browser;

  try {
    client = new MongoClient(uri);
    browser = await puppeteer.launch({
      headless: false,
      args: [
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--single-process",
        "--no-sandbox",
        "--window-size=1080,1024",
        "--disable-features=PasswordLeakDetection",
        "--suppress-message-center-popups",
      ]
    });

    const page = await browser.newPage();

    // Cookie yükleme
    try {
      console.log("🟡 Cookie dosyası yükleniyor...");
      if (fs.existsSync(cookiesPath)) {
        const rawCookies = fs.readFileSync(cookiesPath, "utf8");
        const cookies = JSON.parse(rawCookies);
        if (Array.isArray(cookies)) {
          await page.setCookie(...cookies);
          console.log("✅ Cookies yüklendi!");
        }
      }
    } catch (cookieError) {
      console.error("❌ Cookie yükleme hatası:", cookieError.message);
    }

    // Ana sayfa yükleme
    try {
      await page.setViewport({ width: 1080, height: 3500 });
      await page.goto("http://lebriz.com/pages/auction_DB.aspx?lang=ENG", {
        waitUntil: "domcontentloaded",
        timeout: 30000
      });
    } catch (navigationError) {
      console.error("❌ Sayfa yükleme hatası:", navigationError.message);
      // Sayfayı yeniden yüklemeyi dene
      try {
        await page.reload({ waitUntil: "domcontentloaded", timeout: 30000 });
      } catch (reloadError) {
        console.error("❌ Sayfa yenileme hatası:", reloadError.message);
      }
    }

  await sleep(1000);

    // Sanatçı listesi yükleme
    let artists = [];
    try {
      const rawArtistsData = fs.readFileSync(artistsPath, "utf-8");
      artists = JSON.parse(rawArtistsData);
    } catch (artistsError) {
      console.error("❌ Sanatçı listesi yükleme hatası:", artistsError.message);
      throw new Error("Sanatçı listesi olmadan devam edilemez");
    }

    // MongoDB bağlantısı
    try {
      await client.connect();
      console.log("✅ MongoDB'ye başarıyla bağlandı");
      const db = client.db(dbName);
      const artworksCollection = db.collection('artworks1');

      // Her sanatçı için işlem
      for (const artist of artists) {
        try {
          const artistParts = artist.split(" ");
          const artistName = artistParts.slice(0, -1).join(" ");
          console.log(`🟢 ${artistName} için arama yapılıyor...`);

          // Sanatçı arama
          try {
            await page.waitForSelector("#pnlInfo_comboArtists_Input", {
              visible: true,
              timeout: 10000
            });
            await page.click("#pnlInfo_comboArtists_Input", { clickCount: 3 });
            await page.type("#pnlInfo_comboArtists_Input", artistName, { delay: 100 });
            await sleep(1000);

            await page.waitForSelector(".rcbList li", { visible: true, timeout: 10000 });
            await sleep(1000);

            await page.evaluate(() => {
              let firstItem = document.querySelector(".rcbList li");
              if (firstItem) firstItem.click();
            });

            await page.waitForSelector("#pnlInfo_butSubmitArtists", { timeout: 10000 });
            await page.click("#pnlInfo_butSubmitArtists");
          } catch (searchError) {
            console.error(`❌ Sanatçı arama hatası (${artistName}):`, searchError.message);
            // Sayfayı yenilemeyi dene
            try {
              await page.reload({ waitUntil: "domcontentloaded", timeout: 30000 });
              continue; // Bu sanatçıyı atla, sonrakine geç
            } catch (reloadError) {
              console.error("❌ Sayfa yenileme hatası:", reloadError.message);
              continue;
            }
          }

          await sleep(2000);

          // Sayfa bilgilerini alma
          let totalPages = 1;
          try {
            const textContent = await page.$eval(
              "#aucDB_awv_pager1_tdLabels1",
              (el) => el.innerText
            );
            const pageMatch = textContent.match(/Page :\s*\b(\d+)\/(\d+)\b/);
            totalPages = pageMatch ? parseInt(pageMatch[2], 10) : 1;
          } catch (pageInfoError) {
            console.error(`❌ Sayfa bilgisi alma hatası (${artistName}):`, pageInfoError.message);
          }

          // Sayfaları dolaşma
          for (let currentPage = 1; currentPage <= totalPages; currentPage++) {
            try {
              console.log(`🔄 ${artistName} için ${currentPage}/${totalPages} sayfası işleniyor...`);

              // Thumbnail sayısını al
              let thumbnailCount = 0;
              try {
                thumbnailCount = await page.evaluate(() => {
                  return document.querySelectorAll(
                    '[id^="aucDB_awv_lstThumbs_ctl"][id$="_awd_awd_aucdb_img1"]'
                  ).length;
                });
              } catch (thumbnailCountError) {
                console.error(`❌ Thumbnail sayısı alma hatası:`, thumbnailCountError.message);
                continue;
              }

              // Her thumbnail için işlem
              for (let i = 0; i < thumbnailCount; i++) {
                try {
                  console.log(`🖼️ Thumbnail ${i + 1} detayları alınıyor...`);

                  // Thumbnail tıklama
                  try {
                    await page.evaluate((index) => {
                      const thumbs = document.querySelectorAll(
                        '[id^="aucDB_awv_lstThumbs_ctl"][id$="_awd_awd_aucdb_img1"]'
                      );
                      thumbs[index].click();
                    }, i);
                  } catch (clickError) {
                    console.error(`❌ Thumbnail tıklama hatası: ${clickError.message}`);
                    continue; // Sonraki thumbnail'a geç
                  }

                  // Detay sayfasını bekleme
                  try {
                    await page.waitForSelector("#aucDB_awv_awdFullLeft_tblFull", {
                      timeout: 10000,
                    });
                  } catch (waitError) {
                    console.error(`❌ Detay sayfası yükleme hatası: ${waitError.message}`);
                    continue; // Sonraki thumbnail'a geç
                  }

                  // Detayları çıkarma
                  let artworkDetails;
                  try {
                    artworkDetails = await page.evaluate(() => {
                      const details = {};

                      try {
                        const infoTable = document.querySelector(".awdInfoPanel");
                        const infoRows = Array.from(infoTable.querySelectorAll("tr"));

                        const artistLink = document.querySelector('a[href*="artistID"]');
                        const artistName = artistLink
                          ? artistLink.textContent.trim()
                          : infoRows[0].textContent.trim();
                        details.artist = artistName;
                        details.title =
                          infoRows
                            .find((row) => {
                              const rowText = row.textContent.trim();
                              return (
                                rowText.length > 0 &&
                                rowText !== artistName &&
                                !rowText.includes("cm.") &&
                                !rowText.includes("in.") &&
                                !rowText.toLowerCase().includes("oil") &&
                                !rowText.toLowerCase().includes("canvas") &&
                                !rowText.toLowerCase().includes("signed") &&
                                !rowText.toLowerCase().includes("provenance") &&
                                !rowText.toLowerCase().includes("auction") &&
                                !/^\d{4}('s)?$/.test(rowText) &&
                                !rowText.toLowerCase().includes(" on ") &&
                                !rowText.toLowerCase().includes("opening price") &&
                                !rowText.toLowerCase().includes("estimate") &&
                                !rowText.toLowerCase().includes("unknown") &&
                                !rowText.toLowerCase().includes("sale price") &&
                                !rowText.toLowerCase().includes("not sold") &&
                                !/\d+(\s*-\s*\d+)?(\s*[A-Z]{3})?$/.test(rowText) &&
                                !["trl", "usd", "eur", "gbp"].some((currency) =>
                                  rowText.toLowerCase().includes(currency)
                                )
                              );
                            })
                            ?.textContent.trim() || null;

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

                        // Yıl
                        const yearRow = infoRows.find((row) => {
                          const yearText = row.textContent.trim();
                          return (
                            /^\d{4}$/.test(yearText) ||
                            /^\d{4}'s$/.test(yearText) ||
                            /^Early \d{4}'s$/.test(yearText) ||
                            /^Late \d{4}'s$/.test(yearText) ||
                            /^\d{4}-\d{4}$/.test(yearText) ||
                            /^\d{4}'s - \d{4}'s$/.test(yearText)
                          );
                        });
                        details.year = yearRow ? yearRow.textContent.trim() : "";

                        // Malzeme
                        const materials = [
                          "oil",
                          "watercolor",
                          "acrylic",
                          "mixed media",
                          "tempera",
                          "gouache",
                        ];
                        // Bilinen yüzey türleri
                        const surfaces = [
                          "canvas",
                          "paper",
                          "cardboard",
                          "wood",
                          "panel",
                          "plywood",
                          "hardboard",
                        ];

                        const materialRow = infoRows.find(
                          (row) =>
                            (row.textContent.toLowerCase().includes("on") &&
                              materials.some((material) =>
                                row.textContent.toLowerCase().includes(material)
                              )) ||
                            surfaces.some((surface) =>
                              row.textContent.toLowerCase().includes(surface)
                            )
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
                          const priceTable = priceRow.querySelector("table");
                          if (!priceTable) return [];

                          return Array.from(priceTable.querySelectorAll("tr"))
                            .map((tr) => {
                              const cells = tr.querySelectorAll("td");
                              let price = "";
                              let currency = "";

                              const img = cells[0].querySelector("img");
                              if (img) {
                                price =
                                  new URL(img.src).searchParams.get("t") ||
                                  cells[0].textContent.trim();
                                price = price.replace(/,/g, "");
                              } else {
                                price = cells[0]?.textContent.trim() || "";
                                price = price.replace(/,/g, "");
                              }

                              if (price.includes("-")) {
                                const [min, max] = price.split("-").map((p) => p.trim());
                                price = `${min}.00 - ${max}.00`;
                              } else {
                                price = `${price}.00`;
                              }

                              price = price.replace(/\.00\.00$/, ".00");

                              currency = cells[1]?.textContent.trim() || "";

                              return { price, currency };
                            })
                            .filter((item) => item.price);
                        };

                        const priceRows = infoRows.filter(
                          (row) =>
                            row.textContent.includes("Estimate :") ||
                            row.textContent.includes("Opening price :") ||
                            row.textContent.includes("Sale price :")
                        );

                        const estimateRow = priceRows.find((row) =>
                          row.textContent.includes("Estimate :")
                        );
                        const openingPriceRow = priceRows.find((row) =>
                          row.textContent.includes("Opening price :")
                        );
                        const salePriceRow = priceRows.find((row) =>
                          row.textContent.includes("Sale price :")
                        );

                        details.prices = {
                          estimate: estimateRow ? extractPrices(estimateRow) : null,
                          opening: openingPriceRow
                            ? extractPrices(openingPriceRow, true)
                            : null,
                          sale: salePriceRow ? extractPrices(salePriceRow) : null,
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
                        if (details.artist === "" && artistName.includes(details.title)) {
                          details.artist = details.title;
                        }
                      }

                      return details;
                    });
                  } catch (evaluateError) {
                    console.error(`❌ Detay çıkarma hatası: ${evaluateError.message}`);
                    artworkDetails = {
                      error: true,
                      errorMessage: evaluateError.message,
                      artist: artist, // En azından sanatçı bilgisini kaydet
                      extractionError: true
                    };
                  }

                  // MongoDB'ye kaydetme
                  try {
                    await artworksCollection.insertOne({
                      artist: artist,
                      artwork: artworkDetails,
                      createdAt: new Date(),
                      source: 'lebriz',
                      hasError: artworkDetails.error || false
                    });
                    console.log(`✅ ${artist} - Artwork details saved to MongoDB`);
                  } catch (dbError) {
                    console.error(`❌ MongoDB kayıt hatası: ${dbError.message}`);
                  }

                  // Geri gitme
                  try {
                    await page.goBack();
                    await page.waitForSelector(
                      '[id^="aucDB_awv_lstThumbs_ctl"][id$="_awd_awd_aucdb_img1"]',
                      { timeout: 10000 }
                    );
                  } catch (navigationError) {
                    console.error(`❌ Geri dönüş hatası: ${navigationError.message}`);
                    // Sayfayı yeniden yüklemeyi dene
                    try {
                      await page.reload();
                      await page.waitForSelector(
                        '[id^="aucDB_awv_lstThumbs_ctl"][id$="_awd_awd_aucdb_img1"]',
                        { timeout: 10000 }
                      );
                    } catch (reloadError) {
                      console.error(`❌ Sayfa yenileme hatası: ${reloadError.message}`);
                      continue; // Sonraki thumbnail'a geç
                    }
                  }

                } catch (thumbnailError) {
                  console.error(`❌ Thumbnail işleme hatası:`, thumbnailError.message);
                  // Hata kaydı
                  try {
                    await artworksCollection.insertOne({
                      artist: artist,
                      error: true,
                      errorMessage: thumbnailError.message,
                      createdAt: new Date(),
                      source: 'lebriz',
                      hasError: true,
                      pageNumber: currentPage,
                      thumbnailIndex: i
                    });
                  } catch (dbError) {
                    console.error(`❌ Hata kaydı oluşturma hatası:`, dbError.message);
                  }
                  continue;
                }

                await sleep(2000);
              }

              // Sonraki sayfaya geçiş
              if (currentPage < totalPages) {
                try {
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
                  await sleep(2000);
                } catch (pageNavigationError) {
                  console.error(`❌ Sayfa geçiş hatası:`, pageNavigationError.message);
                  // Sayfayı yenilemeyi dene
                  try {
                    await page.reload();
                    await sleep(2000);
                  } catch (reloadError) {
                    console.error(`❌ Sayfa yenileme hatası:`, reloadError.message);
                    break; // Bu sanatçının diğer sayfalarını atla
                  }
                }
              }
            } catch (pageProcessError) {
              console.error(`❌ Sayfa işleme hatası:`, pageProcessError.message);
              continue;
            }
          }
        } catch (artistError) {
          console.error(`❌ Sanatçı işleme hatası (${artist}):`, artistError.message);
          continue;
        }
      }
    } catch (dbError) {
      console.error("❌ MongoDB işlem hatası:", dbError.message);
    }
  } catch (generalError) {
    console.error("❌ Genel hata:", generalError.message);
  } finally {
    try {
      if (client) await client.close();
      if (browser) await browser.close();
      console.log("✅ Bağlantılar kapatıldı");
    } catch (closeError) {
      console.error("❌ Bağlantı kapatma hatası:", closeError.message);
    }
  }
})();

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
