const { Eserler } = require('../../models');
const puppeteer = require('puppeteer');
const LackDataParser = require('../parser/LackDataParser');
const {Op} = require("sequelize");
const sequelize = require('sequelize');

const browserConfig = {
    headless: false,
    args: ['--no-sandbox']
};

const findLackingRecords = async () => {
    try {
        return await Eserler.findAll({
            where: {
                [Op.and]: [
                    {
                        [Op.or]: [
                            {sanatciAd: ''},
                            {sanatciAd: null},
                        ]
                    }
                ]
            },
            attributes: ['id', 'link']
        });
    } catch (error) {
        console.error('Eksik kayıt arama hatası:', error);
        throw error;
    }
};

const isDifferentDay = (date1, date2) => {
    if (!date1 || !date2) return false;
    
    const d1 = new Date(date1);
    const d2 = new Date(date2);
    
    return d1.getDate() !== d2.getDate() ||
           d1.getMonth() !== d2.getMonth() ||
           d1.getFullYear() !== d2.getFullYear();
};

const updateLackingRecord = async (record) => {
    const browser = await puppeteer.launch(browserConfig);
    
    try {
        const page = await browser.newPage();
        await page.goto(record.link, {
            waitUntil: 'networkidle0',
            timeout: 30000
        });

        const html = await page.content();
        const parser = new LackDataParser();
        const updatedData = parser.parseProductDetail(html, record.link);

        if (updatedData && updatedData.sanatciAd) {
            const currentRecord = await Eserler.findByPk(record.id);
            if (isDifferentDay(currentRecord.updatedAt, currentRecord.createdAt)) {
                console.log(`⚠️ ID: ${record.id} farklı günde güncellenmiş, atlıyorum`);
                return false;
            }

            await Eserler.update({
                sanatciAd: updatedData.sanatciAd.toUpperCase()
            }, {
                where: { 
                    id: record.id,
                    [Op.or]: [
                        { sanatciAd: null },
                        { sanatciAd: '' }
                    ]
                }
            });

            console.log(`✅ ID: ${record.id} güncellendi - Yeni sanatçı adı: ${updatedData.sanatciAd.toUpperCase()}`);
            return true;
        }

        return false;
    } catch (error) {
        console.error(`❌ ID: ${record.id} güncellenirken hata:`, error);
        return false;
    } finally {
        await browser.close();
    }
};

const fixLackingRecords = async () => {
    try {
        const lackingRecords = await findLackingRecords();
        console.log(`${lackingRecords.length} eksik kayıt bulundu`);

        const results = {
            total: lackingRecords.length,
            updated: 0,
            failed: 0,
            failedRecords: []
        };

        for (const record of lackingRecords) {
            const success = await updateLackingRecord(record);
            
            if (success) {
                results.updated++;
            } else {
                results.failed++;
                results.failedRecords.push(record.link);
            }

           
            await new Promise(resolve => setTimeout(resolve, 2000));
        }

        return results;

    } catch (error) {
        console.error('Fix işlemi hatası:', error);
        throw error;
    }
};

module.exports = {
    fixLackingRecords
}; 
