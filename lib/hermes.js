const EventEmitter = require('events');
const async = require('async');
const debug = require('debug')('hermes');
const Adapter = require('./adapter');
const Router = require('./router');
const HermesMessage = require('./message');
const util = require('./util');

class Hermes extends EventEmitter {
  /**
   * Instantiates Hermes.
   *
   * @param {Object} [options={}]
   * @param {String} [options.pathSeparator='/'] The character to use when joining paths.
   */
  constructor (options = {}) {
    super();

    const routerOptions = {};
    if (options.pathSeparator) routerOptions.pathSeparator = options.pathSeparator;

    this.router = new Router(routerOptions);
    this.adapters = [];
  }

  /**
   * Adds a connection adapter.
   *
   * @param {HermesAdapter} adapter The adapter.
   * @param {Object} [options] Options to pass to the adapter at initialization.
   */
  addAdapter (Adapter, options) {
    this.adapters.push({Adapter, options});
  }

  /**
   * Use a middleware for inbound messages.
   * @param {String} [topic] The topic you want to scope the middleware to.
   * @param {Function|HermesRouter} ...middlewares A function or HermesRouter to use as a middleware.
   */
  use (...args) {
    this.router.use(...args);
  }

  /**
   * Use a middleware for outbound messages.
   * @param {String} [topic] The topic you want to scope the middleware to.
   * @param {Function|HermesRouter} ...middlewares A function or HermesRouter to use as a middleware.
   */
  useOutbound (...args) {
    this.router.useOutbound(...args);
  }

  /**
   * Send a message to the adapters.
   *
   * @param {Object|HermesMessage} message The payload of the message you want to send.
   * @param {Any} [headers] The headers of the message you want to send.
   * @param {String} [topic] The topic in which you want to send the message.
   */
  send (payload, headers, topic) {
    let message;

    if (payload.__isHermesMessage) {
      message = payload;
      topic = payload.topic;
    } else {
      message = util.createMessage(this, payload, headers, topic);
    }

    message.inbound = false;
    message.outbound = true;

    this._processMessage(
      this.router.getOutboundMiddlewares(),
      this.router.getOutboundErrorMiddlewares(),
      message
    );
  }

  /**
   * Tells the adapters to connect.
   *
   * @param {Object} options Free-form object to pass options to the adapter.
   * @return {Promise}
   */
  async connect (options) {
    const promises = [];

    this.adapters.forEach(a => {
      a.instance = new a.Adapter(this, a.options);
      promises.push(a.instance.connect(options));
    });

    return Promise.all(promises);
  }

  /**
   * Alias for `connect`.
   *
   * @param {Object} options Free-form object to pass options to the adapter.
   * @return {Promise}
   */
  async listen (options) {
    return this.connect(options);
  }

  /**
   * Injects a message into the Hermes inbound middleware chain.
   *
   * @param {Object|HermesMessage} message The payload of the message you want to send.
   * @param {Any} [headers] The headers of the message you want to send.
   * @param {String} [topic] The topic of the message.
   */
  injectMessage (payload, headers, topic) {
    let message;

    if (payload.__isHermesMessage) {
      message = payload;
      topic = payload.topic;
    } else {
      message = util.createMessage(this, payload, headers, topic);
    }

    message.inbound = true;
    message.outbound = false;

    this._processMessage(
      this.router.getMiddlewares(),
      this.router.getErrorMiddlewares(),
      message
    );
  }

  /**
   * Injects an error into the Hermes inbound error middleware chain.
   *
   * @param {Any} error The error.
   * @param {String} [topic] The topic of the error.
   */
  injectError (error, topic) {
    this._processError(
      this.router.getErrorMiddlewares(),
      error,
      { topic }
    );
  }

  /**
   * Starts executing the middlewares for the given message.
   *
   * @param {Array} middlewares The middleware chain to execute.
   * @param {Array} errorMiddlewares The middlewares chain to execute in case of error.
   * @param {HermesMessage} message The message to pass to the middlewares.
   * @private
   */
  _processMessage (middlewares, errorMiddlewares, message) {
    const mws =
      middlewares
        .filter(mw => util.matchTopic(mw.topic, message.topic))
        .map(mw => (msg, next) => {
          const msgForMiddleware = util.duplicateMessage(msg);
          msgForMiddleware.params = util.getParams(mw.topic, msgForMiddleware.topic);

          msgForMiddleware.on('send', (m) => {
            m.inbound = false;
            m.outbound = true;
            this._processMessage(
              this.router.getOutboundMiddlewares(),
              this.router.getOutboundErrorMiddlewares(),
              m
            );
          });

          mw.fn.call(mw.fn, msgForMiddleware, (err, newMessage) => {
            const nextMessage = newMessage || msgForMiddleware;
            nextMessage.topic = message.topic; // This is to avoid the topic to be modified.
            next(err, nextMessage);
          } );
        });

    async.seq(...mws)(message, (err, msg) => {
      if (err) {
        this._processError(errorMiddlewares, err, msg);
        return;
      }

      if (middlewares === this.router.getOutboundMiddlewares()) {
        debug('Outbound pipeline finished. Sending message...');
        debug(msg);
        this.adapters.forEach(a => {
          if (a.instance) {
            a.instance.send(msg).catch((e) => {
              this._processError(errorMiddlewares, e, msg);
            });
          }
        });
      } else {
        debug('Inbound pipeline finished.');
      }
    });
  }

  /**
   * Starts executing the middlewares for the given error and message.
   *
   * @param {Array} errorMiddlewares The error middlewares chain to execute.
   * @param {Any} error The error to pass to the middleware.
   * @param {HermesMessage} message The message to pass to the middlewares.
   * @private
   */
  _processError (errorMiddlewares, error, message) {
    const emws = errorMiddlewares.filter(emw => util.matchTopic(emw.topic, message.topic));
    if (!emws.length) return;

    this._execErrorMiddleware(emws, 0, error, message);
  }

  _execErrorMiddleware (emws, index, error, message) {
    emws[index].fn(error, message, (err) => {
      if (!emws[index+1]) return;
      this._execErrorMiddleware.call(null, emws, index+1, err, message);
    });
  }
}

Hermes.Message = HermesMessage;
Hermes.Adapter = Adapter;
Hermes.Router = Router;

module.exports = Hermes;
