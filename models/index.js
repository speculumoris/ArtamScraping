const { sequelize } = require('../config/db');
const Eser = require('./Eser');
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
        await sequelize.sync({ alter: true });
        console.log('Modeller senkronize edildi');
    } catch (error) {
        console.error('Model senkronizasyon hatası:', error);
    }
};

module.exports = {
  sequelize,
  Eser,
  syncModels
}; 
