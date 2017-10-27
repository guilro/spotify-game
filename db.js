const bluebird = require('bluebird');
const db = require('sqlite');
const redis = require('redis');
const winston = require('winston');

bluebird.promisifyAll(redis.RedisClient.prototype);
bluebird.promisifyAll(redis.Multi.prototype);

const redisClient = redis.createClient();

(async function init() {
  await db.open('./database.sqlite', { Promise });
  await db.migrate();
})().catch(err => {
  winston.error(err);
  process.exit(-1);
});

module.exports = {
  settings: {
    set: async (name, value) => {
      winston.debug(`set ${name} setting to ${value}`);

      if (value === null || typeof value === 'undefined') {
        return redisClient.delAsync(`spotify-voter:settings:${name}`);
      }

      return redisClient.setAsync(`spotify-voter:settings:${name}`, value);
    },
    get: async (name) => {
      let value = await redisClient.getAsync(`spotify-voter:settings:${name}`);

      if (['true', 'false'].includes(value)) {
        value = value === 'true';
      }

      return value;
    },
  },
  database: db
};
