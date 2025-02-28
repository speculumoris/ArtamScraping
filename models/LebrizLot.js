const { Sequelize, DataTypes } = require('sequelize');
const sequelize = require('../path/to/your/sequelize/instance'); // Sequelize instance'ınızı doğru yoldan import edin

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

module.exports = LebrizLot; 