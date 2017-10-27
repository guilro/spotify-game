const SpotifyWebApi = require('spotify-web-api-node');
const winston = require('winston');

const conf = require('./conf');
const settings = require('./db').settings;

const spotifyApiClientToken = new SpotifyWebApi({
  clientId : conf.clientID,
  clientSecret : conf.clientSecret
});

const spotifyApiUserToken = new SpotifyWebApi({
  clientId : conf.clientID,
  clientSecret : conf.clientSecret
});

setInterval(async () => {
  let clientToken = await settings.get('clientToken');

  if (!clientToken) {
    winston.info('waiting for client token');
    return;
  }

  spotifyApiClientToken.setAccessToken(clientToken);

  let userToken = await settings.get('token');
  if (!userToken) {
    winston.info('waiting for user token');
  }

  spotifyApiUserToken.setAccessToken(userToken);
}, 1000);

module.exports = {
  spotifyApiUserToken,
  spotifyApiClientToken
};
