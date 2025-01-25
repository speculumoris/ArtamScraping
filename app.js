var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
require('dotenv').config();
const { connectDB, sequelize } = require('./config/db');
const { syncModels } = require('./models');

var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);
app.use('/users', usersRouter);

// Veritabanı bağlantısını ve model senkronizasyonunu yap
const initializeDatabase = async () => {
    try {
        await connectDB();
        console.log('Veritabanı bağlantısı başarılı');
        
        await sequelize.authenticate();
        console.log('Sequelize bağlantısı başarılı');
        
        await syncModels();
    } catch (error) {
        console.error('Veritabanı başlatma hatası:', error);
        process.exit(1);
    }
};

initializeDatabase();

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
