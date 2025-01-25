var express = require('express');
var router = express.Router();
const productFetcher = require('../src/fetcher/productFetcher');

router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

router.get('/artam/auctions', function(req, res, next) {

  const getTablesFromScraping= productFetcher.getTablesFromScraping();

});

module.exports = router;
