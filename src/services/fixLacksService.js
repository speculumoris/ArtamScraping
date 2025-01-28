const { Eserler } = require('../../models');
const puppeteer = require('puppeteer');
const ProductParser = require('../parser/ProductParser');
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
                            {turu: ''},
                            {turu: null}
                        ]
                    },
                    {
                        baskiBilgisi: {
                            [Op.or]: [
                                {[Op.eq]: ''},
                                {[Op.eq]: null}
                            ]
                        }
                    },
                    {
                        [Op.or]: [
                            {updated_at: null},
                            sequelize.where(
                                sequelize.col('updated_at'),
                                '=',
                                sequelize.col('created_at')
                            )
                        ]
                    }
                ]
            },
            attributes: ['id', 'link', 'created_at', 'updated_at']
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
        const parser = new ProductParser();
        const updatedData = parser.parseProductDetail(html, record.link);

        if (updatedData) {
            const currentRecord = await Eserler.findByPk(record.id);
            if (isDifferentDay(currentRecord.updated_at, currentRecord.created_at)) {
                console.log(`⚠️ ID: ${record.id} farklı günde güncellenmiş, atlıyorum`);
                return false;
            }

            await Eserler.update({
                sanatciAd: updatedData.sanatciAd,
                turu: updatedData.turu,
                baskiBilgisi: updatedData.baskiBilgisi
            }, {
                where: { id: record.id }
            });

            console.log(`✅ ID: ${record.id} güncellendi`);
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
