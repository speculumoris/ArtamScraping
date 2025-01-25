const { Sequelize } = require('sequelize');

const sequelize = new Sequelize(process.env.DATABASE_URL, {
  dialect: 'postgres',
  logging: false
});

const connectDB = async () => {
  try {
    await sequelize.authenticate();
    await sequelize.sync();
    console.log('PostgreSQL bağlantısı başarılı');
  } catch (error) {
    console.error(`Hata: ${error.message}`);
    process.exit(1);
  }
};

module.exports = { connectDB, sequelize }; 