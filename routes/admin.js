const express = require('express');
const debug = require('debug')('spotify-voter:user');
const passport = require('passport');
const router = express.Router();
const SpotifyStrategy = require('passport-spotify').Strategy;

const wrap = fn => (...args) => fn(...args).catch(args[args.length - 1]);
const conf = require('../conf');
const settings = require('../db').settings;
const db = require('../db').database;

passport.serializeUser((user, done) => done(null, user));
passport.deserializeUser(async (user, done) => {
  if (conf.admins.includes(user.id) || user.id === 'admin') {
    user.isAdmin = true;
  }

  let {voteCount} = await db.get('SELECT COUNT(*) as voteCount FROM votes WHERE user_id = ? AND created > datetime("now", "-30 minutes")', [user.id]);

  user.voteCount = voteCount;
  user.canVote = user.isAdmin || voteCount < 4;

  debug(user);

  return done(null, user);
});

passport.use(new SpotifyStrategy({
  clientID: conf.clientID,
  clientSecret: conf.clientSecret,
  callbackURL: `${conf.host}/admin/oauth_callback`
}, async (accessToken, refreshToken, profile, done) => {
  if (profile.username != conf.spotifyUsername) {
    return done(new Error('Not the right username !'));
  }

  let tokenRenew = new Date(Date.now() + 1000*50*10);

  await Promise.all([
    settings.set('token', accessToken),
    settings.set('tokenRenew', tokenRenew.toString()),
    settings.set('refreshToken', refreshToken),
  ]);

  return done(null, {
    id: 'admin',
    isAdmin: true,
    email: 'admin',
    canVote: true,
    username: profile.username,
    displayName: profile.displayName,
  });
}));

router.use('/', (req, res, next) => {
  // if user is not logged in as admin or authorized to
  if (!req.user || !req.user.isAdmin) {
    return res.send(403);
  }

  next();
});

router.get(
  '/oauth',
  passport.authenticate('spotify', {scope: [
    'user-read-playback-state',
    'user-modify-playback-state',
    'user-read-currently-playing'
  ]})
);

router.get(
  '/oauth_callback',
  passport.authenticate('spotify', { failureRedirect: '/' }),
  (req, res) => (res.redirect('/admin'))
);

router.use('/', (req, res, next) => {
  if (!req.user.isAdmin) {
    return res.redirect('/admin/oauth');
  }

  next();
});

router.get('/', wrap(async (req, res) => {
  res.render('admin', {
    displayName: req.user.displayName,
    active: await settings.get('active')
  });
}));

router.get('/toggle', wrap(async (req, res) => {
  await settings.set('active', !(await settings.get('active')));

  return res.redirect('/admin');
}));

module.exports = router;
