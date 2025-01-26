const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

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
  sanatcıDogumOlum: {
    type: DataTypes.DATE
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
  link: {
    type: DataTypes.STRING
  }
});

module.exports = Eser; 
