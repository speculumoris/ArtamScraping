const {Sequelize, DataTypes} = require("sequelize");
const {sequelize} = require("../config/db");

const Esers = sequelize.define(
    "Esers",
    {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
        },
        link: {
            type: DataTypes.STRING,
        },
    },
    {
        tableName: "Esers",
        timestamps: false,
    }
);

const EserlerCsv = sequelize.define(
    "EserlersCsv",
    {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
        },
        sanatciAd: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        turu: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        eserAdi: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        lotNo: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        teklifSayisi: {
            type: DataTypes.INTEGER,
            defaultValue: 0,
        },
        muzayedeNo: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        tarih: {
            type: DataTypes.DATE,
            allowNull: false,
        },
        boyutEn: {
            type: DataTypes.INTEGER,
        },
        boyutBoy: {
            type: DataTypes.INTEGER,
        },
        boyutBirim: {
            type: DataTypes.STRING,
            defaultValue: "cm",
        },
        imzali: {
            type: DataTypes.BOOLEAN,
            defaultValue: false,
        },
        tarihi: {
            type: DataTypes.INTEGER,
            allowNull: true,
        },
        sanatciDogumOlum: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        baslangicFiyati: {
            type: DataTypes.DECIMAL(10, 2),
        },
        satisFiyati: {
            type: DataTypes.DECIMAL(10, 2),
        },
        guncelDegerOrtalamasi: {
            type: DataTypes.STRING,
        },
        baskiBilgisi: {
            type: DataTypes.STRING,
        },
        bagisBilgisi: {
            type: DataTypes.STRING,
        },
        imageLink: {
            type: DataTypes.STRING,
        },
        link: {
            type: DataTypes.STRING,
        },
        createdAt: {
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW
        },
        updatedAt: {
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW
        }
    },
    {
        tableName: "EserlerCsv"
    }
);
const LebrizLot = sequelize.define('LebrizLot', {
    image: {
        type: DataTypes.STRING,
        allowNull: true
    },
    lotNo: {
        type: DataTypes.STRING,
        allowNull: false
    },
    artist: {
        type: DataTypes.STRING,
        allowNull: false
    },
    auction: {
        type: DataTypes.STRING,
        allowNull: true
    },
    specs: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    openingPriceTRL: {
        type: DataTypes.STRING,
        allowNull: true
    },
    salePriceTRL: {
        type: DataTypes.STRING,
        allowNull: true
    },
    openingPriceUSD: {
        type: DataTypes.STRING,
        allowNull: true
    },
    salePriceUSD: {
        type: DataTypes.STRING,
        allowNull: true
    },
    openingPriceEUR: {
        type: DataTypes.STRING,
        allowNull: true
    },
    salePriceEUR: {
        type: DataTypes.STRING,
        allowNull: true
    }
}, {
    tableName: 'LebrizLots', // Tablonun ismi
    timestamps: false // Eğer createdAt ve updatedAt alanlarını istemiyorsanız
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
        await sequelize.sync({alter: true});
        console.log("Modeller güncellendi");
    } catch (error) {
        console.error("Model güncelleme hatası:", error);
    }
};

module.exports = {
    sequelize,
    Esers, // Esers modelini export et
    EserlerCsv, // Eserler modelini export et
    LebrizLot,
    syncModels,
    
};
