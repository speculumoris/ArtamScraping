const express = require('express');
const router = express.Router();
const linkFetcher = require('../src/fetcher/linkFetcher');
const { Esers, EserlerCsv } = require('../models');
const fixLacksService = require('../src/services/fixLacksService');
const lebrizFetcher = require('../src/fetcher/lebrizFetcher');

router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

router.get('/artam/auctions', async function(req, res, next) {
    try {
        const results = await linkFetcher.getTablesFromScraping();
        res.json({
            success: true,
            data: results
        });
    } catch (error) {
        console.error('Link toplama hatası:', error);
        res.status(500).json({
            success: false,
            error: 'Link toplama işlemi başarısız'
        });
    }
});
router.get('/artam/fix-lacks', async function(req, res, next) {
    try {
        const results = await fixLacksService.fixLackingRecords();
        res.json({
            success: true,
            data: results
        });
    } catch (error) {
        console.error('Eksik kayıt düzeltme hatası:', error);
        res.status(500).json({
            success: false,
            error: 'Eksik kayıt düzeltme işlemi başarısız'
        });
    }
});

router.get('/lebriz', async (req, res) => {
    try {
        const data = await lebrizFetcher();
        res.json(data);
    } catch (error) {
        res.status(500).send('Bir hata oluştu: ' + error.message);
    }
});

module.exports = router;
