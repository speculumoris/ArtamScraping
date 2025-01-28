const {DataTypes} = require('sequelize');
const {sequelize} = require('../config/db');

const Eser = sequelize.define('Eser', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    sanatciAd: {
        type: DataTypes.STRING,
        allowNull: false,
        trim: true
    },
    turu: {
        type: DataTypes.STRING,
        allowNull: false
    },
    eserAdi: {
        type: DataTypes.STRING,
        allowNull: false
    },
    lotNo: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    teklifSayisi: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    },
    muzayedeNo: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    tarih: {
        type: DataTypes.DATE,
        allowNull: false
    },
    boyutEn: {
        type: DataTypes.INTEGER
    },
    boyutBoy: {
        type: DataTypes.INTEGER
    },
    boyutBirim: {
        type: DataTypes.ENUM('cm', 'mm', 'm'),
        defaultValue: 'cm'
    },
    imzali: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    tarihi: {
        type: DataTypes.DATE
    },
    sanatciDogumOlum: {
        type: DataTypes.STRING
    },
    baslangicFiyati: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false
    },
    satisFiyati: {
        type: DataTypes.DECIMAL(10, 2)
    },
    guncelDegerOrtalamasi: {
        type: DataTypes.DECIMAL(10, 2)
    },
    baskiBilgisi: {
        type: DataTypes.STRING
    },
    bagisBilgisi: {
        type: DataTypes.STRING
    },
    link: {
        type: DataTypes.STRING
    },
    imageLink: {
        type: DataTypes.STRING
    },
    createdAt: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
    },
    updatedAt: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
    }

});

module.exports = Eser; 
