/* eslint-env node, mocha */
const assert = require('assert');

const settings = require('../db').settings;

describe('Settings interface', function() {
  it('works', async function() {
    await settings.set('settingName', 'value');
    let value = await settings.get('settingName');
    assert.equal(value, 'value');
  });
});
