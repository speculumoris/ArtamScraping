const { Sequelize, DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Esers = sequelize.define('Esers', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    link: {
        type: DataTypes.STRING
    }
}, {
    tableName: 'Esers',
    timestamps: false
});

const Eserler = sequelize.define('Eserlers', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    sanatciAd: {
        type: DataTypes.STRING,
        allowNull: false
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
        allowNull: false
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
        type: DataTypes.STRING,
        defaultValue: 'cm'
    },
    imzali: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    tarihi: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    sanatciDogumOlum: {
        type: DataTypes.STRING,
        allowNull: true
    },
    baslangicFiyati: {
        type: DataTypes.DECIMAL(10, 2)
    },
    satisFiyati: {
        type: DataTypes.DECIMAL(10, 2)
    },
    guncelDegerOrtalamasi: {
        type: DataTypes.STRING
    },
    imageLink: {
        type: DataTypes.STRING
    },
    link: {
        type: DataTypes.STRING
    }
}, {
    tableName: 'Eserlers',
    timestamps: false
});

/*const ArtWork = require('./ArtWork');
const Sanatci = require('./Sanatci');
const Fiyat = require('./Fiyat');

// İlişkileri tanımlayalım
ArtWork.belongsTo(Sanatci);
Sanatci.hasMany(ArtWork);

ArtWork.belongsTo(Eser);
Eser.hasOne(ArtWork);

ArtWork.hasOne(Fiyat);
Fiyat.belongsTo(ArtWork);
ArtWork,
  Sanatci,
  Eser,
  Fiyat

 */

// Modelleri senkronize et
const syncModels = async () => {
    try {
        // Force: true ile tabloları silip yeniden oluşturur
        await sequelize.sync({ force: true });
        console.log('Modeller senkronize edildi');
    } catch (error) {
        console.error('Model senkronizasyon hatası:', error);
    }
};

module.exports = {
    sequelize,
    Esers,      // Esers modelini export et
    Eserler,    // Eserler modelini export et
    syncModels
}; 
