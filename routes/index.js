const express = require('express');
const router = express.Router();
const linkFetcher = require('../src/fetcher/linkFetcher');
const productFetcher = require('../src/fetcher/productFetcher');
const { Esers, Eserler } = require('../models');

router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

router.get('/artam/auctions', function(req, res, next) {
  const getTablesFromScraping= linkFetcher.getTablesFromScraping();
    res.json();

});

router.get('/eser-links', async (req, res) => {
    try {
        // Esers tablosundan linkleri al
        const links = await Esers.findAll({
            attributes: ['link'],
            raw: true
        });

        const linkList = links.map(item => item.link);
        const results = {
            success: [],
            failed: []
        };

        // Her link için
        for (const link of linkList) {
            try {
                const productInfo = await productFetcher.getProductInformations(link);
                if (productInfo) {
                    results.success.push(link);
                    console.log(`${link} başarıyla işlendi`);
                } else {
                    results.failed.push({ link, reason: 'Veri alınamadı' });
                }
            } catch (error) {
                results.failed.push({ link, reason: error.message });
                console.error(`${link} işlenirken hata:`, error);
            }
        }

        res.json({
            success: true,
            data: {
                total: linkList.length,
                success: results.success.length,
                failed: results.failed.length,
                failedLinks: results.failed
            }
        });

    } catch (error) {
        console.error('İşlem sırasında hata:', error);
        res.status(500).json({
            success: false,
            error: 'İşlem başarısız'
        });
    }
});

module.exports = router;
