const express = require('express');
const path = require('path');
const logger = require('morgan');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const session = require('express-session');
const passport = require('passport');
const RedisStore = require('connect-redis')(session);
const winston = require('winston');

const index = require('./routes/index');
const admin = require('./routes/admin');

winston.configure({
  transports: [
    new (winston.transports.Console)({
      level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
      json: process.env.NODE_ENV === 'production',
      stringify: process.env.NODE_ENV === 'production',
      handleExceptions: true,
      humanReadableUnhandledException: true
    }),
  ]
});

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
process.env.NODE_ENV == 'production' || app.use(logger('dev'));
app.use(express.static(path.join(__dirname, 'public')));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());

app.use('/', session({store: new RedisStore(), secret: 'prout', resave: false, saveUninitialized: true}));
app.use('/', passport.initialize());
app.use('/', passport.session());

app.use('/admin', admin);

app.use('/', index);

// catch 404 and forward to error handler
app.use((req, res, next) => {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handler
app.use((err, req, res, next) => { // eslint-disable-line no-unused-vars
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
