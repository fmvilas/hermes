const EventEmitter = require('events');

class HermesMessage extends EventEmitter {
  /**
   * Instantiates a new HermesMessage.
   *
   * @param {Hermes} hermes A reference to the Hermes app.
   * @param {Any} [payload] Message payload.
   * @param {Any} [headers] Message headers.
   * @param {String} [topic] Message topic.
   */
  constructor (hermes, payload, headers, topic) {
    super();

    this.hermes = hermes;
    if (payload) this.payload = payload;
    if (headers) this.headers = headers;
    if (topic) this.topic = topic;
  }

  /**
   * Sends the message back to the server/broker.
   *
   * @param {Any} [payload] The new message payload. Pass falsy value if you don't want to change it.
   * @param {Any} [headers] The new message headers. Pass null if you want to remove them.
   * @param {String|null} [topic] The new message topic. Pass `null` if you want to remove the current topic.
   */
  reply (payload, headers, topic) {
    if (payload) this.payload = payload;

    if (headers !== undefined) {
      if (headers === null) {
        this.headers = undefined;
      } else {
        this.headers = headers;
      }
    }

    if (topic !== undefined) {
      if (topic === null) {
        this.topic = undefined;
      } else if (typeof topic === 'string') {
        this.topic = topic;
      } else {
        return console.error('HermesMessage.reply(payload, headers, topic): topic must be a string or null.');
      }
    }

    this.send();
  }

  /**
   * Tells Hermes to send the message to all the adapters.
   */
  send () {
    this.emit('send', this);
  }
}

module.exports = HermesMessage;
