const HermesAdapter = require('../lib/adapter');

const sleep = time => new Promise(resolve => setTimeout(resolve, time));

class ExampleAdapter extends HermesAdapter {
  constructor (hermes, options) {
    super(hermes, options);

    console.log('ExampleAdapter initialized with options:', options);
  }

  async connect () {
    await sleep(2000);

    console.log('ExampleAdapter is listening...');
    return this;
  }

  async send (message) {
    await sleep(3000);
    console.log('Sending message:', message);
    return this;
  }
}

module.exports = ExampleAdapter;
