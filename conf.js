module.exports = {
  clientID: process.env.CLIENT_ID,
  clientSecret: process.env.CLIENT_SECRET,
  fiClientID: process.env.FI_CLIENT_ID,
  fiClientSecret: process.env.FI_CLIENT_SECRET,
  host: process.env.HOST || 'http://localhost:3000',
  spotifyUsername: process.env.USERNAME || 'guilro_',
  adminEmail: process.env.ADMIN_EMAIL || 'guillaume.royer@jlm2017.fr'
};
