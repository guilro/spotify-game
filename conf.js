module.exports = {
  secret: process.env.SECRET,
  clientID: process.env.CLIENT_ID,
  clientSecret: process.env.CLIENT_SECRET,
  fiClientID: process.env.FI_CLIENT_ID,
  fiClientSecret: process.env.FI_CLIENT_SECRET,
  host: process.env.HOST || 'http://localhost:3000',
  spotifyUsername: process.env.USERNAME || 'guilro_',
  admins: process.env.ADMINS.split(','),
};
