const { Sequelize, DataTypes } = require('sequelize');
const sequelize = require('../path/to/your/sequelize/instance'); // Sequelize instance'ınızı doğru yoldan import edin

const EserlerCsv = sequelize.define('EserlerCsv', {
    sanatciAd: {
        type: DataTypes.STRING,
        allowNull: false
    },
    sanatciDogumOlum: {
        type: DataTypes.STRING,
        allowNull: true
    },
    bagisBilgisi: {
        type: DataTypes.STRING,
        allowNull: true
    },
    baskiBilgisi: {
        type: DataTypes.STRING,
        allowNull: true
    },
    turu: {
        type: DataTypes.STRING,
        allowNull: true
    },
    eserAdi: {
        type: DataTypes.STRING,
        allowNull: false
    },
    lotNo: {
        type: DataTypes.STRING,
        allowNull: true
    },
    teklifSayisi: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    muzayedeNo: {
        type: DataTypes.STRING,
        allowNull: true
    },
    tarih: {
        type: DataTypes.DATE,
        allowNull: true
    },
    boyutEn: {
        type: DataTypes.FLOAT,
        allowNull: true
    },
    boyutBoy: {
        type: DataTypes.FLOAT,
        allowNull: true
    },
    boyutBirim: {
        type: DataTypes.STRING,
        allowNull: true
    },
    imzali: {
        type: DataTypes.BOOLEAN,
        allowNull: true
    },
    tarihi: {
        type: DataTypes.STRING,
        allowNull: true
    },
    baslangicFiyati: {
        type: DataTypes.FLOAT,
        allowNull: true
    },
    satisFiyati: {
        type: DataTypes.FLOAT,
        allowNull: true
    },
    guncelDegerOrtalamasi: {
        type: DataTypes.FLOAT,
        allowNull: true
    },
    link: {
        type: DataTypes.STRING,
        allowNull: false
    },
    imageLink: {
        type: DataTypes.STRING,
        allowNull: true
    }
}, {
    tableName: 'EserlerCsv', // Tablonun ismi
});

module.exports = EserlerCsv; 