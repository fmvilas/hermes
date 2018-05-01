const EventEmitter = require('events');

class HermesAdapter extends EventEmitter {
  /**
   * Instantiates a Hermes adapter.
   *
   * @param {Hermes} hermes  A reference to the Hermes app.
   * @param {Object} [options] A free-form configuration object.
   */
  constructor (hermes, options) {
    super();

    this.hermes = hermes;
    this.options = options;

    this.on('error', err => { this.hermes.injectError(err); });
    this.on('message', message => { this.hermes.injectMessage(message); });

    this.on('connect', (...args) => {
      this.hermes.emit('adapter:connect', ...args);
    });
  }

  /**
   * Connects to the remote server.
   *
   * @param {Object} options Free-form object to pass options to the adapter.
   * @return {Promise}
   */
  async connect (options) {
    throw new Error('Method `connect` is not implemented.');
  }

  /**
   * Sends a message to the remote server.
   *
   * @param {HermesMessage} message The message to send.
   * @param {Object} [options] Optional configuration for sending.
   * @return {Promise}
   */
  async send (message, options) {
    throw new Error('Method `send` is not implemented.');
  }
}

module.exports = HermesAdapter;
