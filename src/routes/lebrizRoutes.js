const express = require("express");
const router = express.Router();
const { getLebrizData } = require("../fetcher/lebrizFetcher");

router.get("/lebriz", async (req, res) => {
    try {
        await getLebrizData();
        res.status(200).send("Lebriz verileri başarıyla alındı.");
    } catch (error) {
        res.status(500).send("Lebriz verileri alınırken hata oluştu.");
    }
});

module.exports = router; 