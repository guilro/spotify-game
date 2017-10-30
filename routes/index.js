const axios = require('axios');
const express = require('express');
const passport = require('passport');
const OAuth2Strategy = require('passport-oauth2').Strategy;
const router = express.Router();
const winston = require('winston');

const conf = require('../conf');
const wrap = fn => (...args) => fn(...args).catch(args[args.length - 1]);
const settings = require('../db').settings;
const db = require('../db').database;
const { spotifyApiClientToken } = require('../spotify');

const fiStrategy = new OAuth2Strategy({
  authorizationURL: 'https://auth.lafranceinsoumise.fr/autoriser',
  tokenURL: 'https://auth.lafranceinsoumise.fr/token',
  clientID: conf.fiClientID,
  clientSecret: conf.fiClientSecret,
  callbackURL: `${conf.host}/oauth_callback`,
  scope: 'view_profile'
}, async (accessToken, refreshToken, profile, done) => {
  let user = await db.get('SELECT * FROM users WHERE id = ?', profile._id);
  return done(null, {
    id: profile._id,
    email: profile.email,
    lastVote: user && user.last_vote && new Date(user.last_vote),
  });
});

fiStrategy.userProfile = async (accessToken, done) => {
  try {
    let res = await axios('https://api.lafranceinsoumise.fr/legacy/people/me', {
      headers: {
        Authorization: `Bearer ${accessToken}`
      }
    });

    return done(null, res.data);
  } catch (e) {
    return done(e);
  }
};

passport.use('fi', fiStrategy);

router.get('/login', passport.authenticate('fi'));

router.get(
  '/oauth_callback',
  passport.authenticate('fi', {failureRedirect: '/'}),
  (req, res) => {
    res.redirect('/');
  }
);

// Index with current playing and current ladder
router.get('/', wrap(async (req, res) => {
  let songs = await db.all('SELECT * FROM songs WHERE votes > 0 ORDER BY votes DESC');

  res.render('index', {
    state: await settings.get('state') || 'paused',
    track: {
      name: await settings.get('currentSongName'),
      artists: await settings.get('currentSongArtists')
    },
    songs,
    user: req.user
  });
}));

router.get('/wait', wrap(async (req, res) => {
  return res.send('Vous avez joué trop récemment, attendez un petit peu !');
}));

// User must be logged in to search and vote, and can vote every 10 minutes
const canVote = (req, res, next) => {
  if (!req.user) {
    return res.redirect('/login');
  }

  if (!req.user.canVote) {
    return res.redirect('/wait');
  }

  next();
};

// Search for a song
router.get('/search', canVote, wrap(async (req, res) => {
  let query = req.query.q;

  if (!query) {
    return res.sendStatus(404);
  }

  try {
    var data = await spotifyApiClientToken.searchTracks(query);

    return res.render('search', {tracks: data.body.tracks.items});
  } catch (err) {
    winston.error(err);
    throw new Error('Error connecting to Spotify API.');
  }
}));

// Vote for a a song
router.get('/vote/:id', canVote, wrap(async (req, res) => {
  let song = await db.get('SELECT * FROM songs WHERE id = ?', req.params.id);

  if (song) {
    await db.run('UPDATE songs SET votes = votes +1 WHERE id = ?', req.params.id);
  } else {
    try {
      var track = (await spotifyApiClientToken.getTrack(req.params.id)).body;
    } catch (err) {
      winston.error(err);
      throw new Error('Error connecting to Spotify API.');
    }

    let description = `${track.name} - ${track.artists.map(artist => artist.name).join(', ')}`;
    await db.run(
      'INSERT INTO songs (id, votes, count, description) VALUES (?, ?, ?, ?)',
      [req.params.id, 1, 0, description]
    );
  }

  let date = new Date().toString();
  db.run('INSERT OR REPLACE INTO users(id, last_vote) VALUES(?, ?)', [req.user.id, date]);
  req.user.lastVote = date;

  winston.info(`new vote for ${req.params.id} by ${req.user.id}`);

  res.redirect('/');
}));

module.exports = router;
