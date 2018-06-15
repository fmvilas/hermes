class HermesRouter {
  /**
   * Instantiates a HermesRouter.
   *
   * @param {Object} options
   * @param {String} [options.pathSeparator='/'] The character to use when joining paths.
   */
  constructor (options) {
    this.options = {
      ...{
        pathSeparator: '/'
      },
      ...options
    };
    this.middlewares = [];
    this.outboundMiddlewares = [];
    this.errorMiddlewares = [];
    this.outboundErrorMiddlewares = [];
  }

  /**
   * Use a middleware for inbound messages. Please, note that when passing a HermesRouter as a param,
   * this function will make use of inbound and outbound middlewares.
   *
   * @param {String} [topic] The topic you want to scope the middleware to.
   * @param {Function|HermesRouter} ...middlewares A function or HermesRouter to use as a middleware.
   */
  use (...args) {
    if (!args || !args.length) {
      console.error(`HermesRouter.use() requires at least one argument.`);
      return;
    }

    if (args.length === 1 && args[0] instanceof HermesRouter) {
      this.addMiddlewares(args[0].getMiddlewares());
      this.addErrorMiddlewares(args[0].getErrorMiddlewares());
      this.addOutboundMiddlewares(args[0].getOutboundMiddlewares());
      this.addOutboundErrorMiddlewares(args[0].getOutboundErrorMiddlewares());
    } else if (args.length === 2 && typeof args[0] === 'string' && args[1] instanceof HermesRouter) {
      this.addMiddlewares(args[1].getMiddlewares(), args[0]);
      this.addErrorMiddlewares(args[1].getErrorMiddlewares(), args[0]);
      this.addOutboundMiddlewares(args[1].getOutboundMiddlewares(), args[0]);
      this.addOutboundErrorMiddlewares(args[1].getOutboundErrorMiddlewares(), args[0]);
    } else {
      let topic;
      let functions = [];

      if (typeof args[0] === 'string') {
        topic = args[0];
        functions = args.splice(1);
      } else {
        functions = args;
      }

      const mws = functions.map(fn => ({ topic, fn }));

      mws.forEach(mw => {
        if (typeof mw.fn !== 'function') return;

        if (mw.fn.length <= 2) {
          this.addMiddlewares([mw]);
        } else {
          this.addErrorMiddlewares([mw]);
        }
      });
    }
  }

  /**
   * Use a middleware for outbound messages.
   *
   * @param {String} [topic] The topic you want to scope the middleware to.
   * @param {Function|HermesRouter} ...middlewares A function or HermesRouter to use as a middleware.
   */
  useOutbound (...args) {
    if (!args || !args.length) {
      console.error(`HermesRouter.useOutbound() requires at least one argument.`);
      return;
    }

    if (args.length === 1 && args[0] instanceof HermesRouter) {
      this.addOutboundMiddlewares(args[0].getOutboundMiddlewares());
      this.addOutboundErrorMiddlewares(args[0].getOutboundErrorMiddlewares());
    } else if (args.length === 2 && typeof args[0] === 'string' && args[1] instanceof HermesRouter) {
      this.addOutboundMiddlewares(args[1].getOutboundMiddlewares(), args[0]);
      this.addOutboundErrorMiddlewares(args[1].getOutboundErrorMiddlewares(), args[0]);
    } else {
      let topic;
      let functions = [];

      if (typeof args[0] === 'string') {
        topic = args[0];
        functions = args.splice(1);
      } else {
        functions = args;
      }

      const mws = functions.map(fn => ({ topic, fn }));

      mws.forEach(mw => {
        if (typeof mw.fn !== 'function') return;

        if (mw.fn.length <= 2) {
          this.addOutboundMiddlewares([mw]);
        } else {
          this.addOutboundErrorMiddlewares([mw]);
        }
      });
    }
  }

  /**
   * Returns all the inbound middlewares.
   * @return {Array<Function>}
   */
  getMiddlewares () {
    return this.middlewares;
  }

  /**
   * Returns all the outbound middlewares.
   * @return {Array<Function>}
   */
  getOutboundMiddlewares () {
    return this.outboundMiddlewares;
  }

  /**
   * Returns all the inbound error middlewares.
   * @return {Array<Function>}
   */
  getErrorMiddlewares () {
    return this.errorMiddlewares;
  }

  /**
   * Returns all the outbound error middlewares.
   * @return {Array<Function>}
   */
  getOutboundErrorMiddlewares () {
    return this.outboundErrorMiddlewares;
  }

  /**
   * Adds a normalized middleware to a target collection.
   *
   * @param {Array} target The target collection.
   * @param {Array} middlewares The middlewares to add to the collection.
   * @param {String} [topic] The scope topic.
   * @private
   */
  _addMiddlewares (target, middlewares, topic) {
    middlewares.forEach(mw => {
      if (topic) {
        const compoundTopic = mw.topic ? `${topic}${this.options.pathSeparator}${mw.topic}` : topic;
        target.push({ ...mw, ...{ topic: compoundTopic } });
      } else {
        target.push(mw);
      }
    });
  }

  /**
   * Adds a normalized middleware to the inbound middlewares collection.
   *
   * @param {Array} middlewares The middlewares to add to the collection.
   * @param {String} [topic] The scope topic.
   */
  addMiddlewares (middlewares, topic) {
    this._addMiddlewares(this.middlewares, middlewares, topic);
  }

  /**
   * Adds a normalized middleware to the outbound middlewares collection.
   *
   * @param {Array} middlewares The middlewares to add to the collection.
   * @param {String} [topic] The scope topic.
   */
  addOutboundMiddlewares (middlewares, topic) {
    this._addMiddlewares(this.outboundMiddlewares, middlewares, topic);
  }

  /**
   * Adds a normalized middleware to the inbound error middlewares collection.
   *
   * @param {Array} errorMiddlewares The middlewares to add to the collection.
   * @param {String} [topic] The scope topic.
   */
  addErrorMiddlewares (errorMiddlewares, topic) {
    this._addMiddlewares(this.errorMiddlewares, errorMiddlewares, topic);
  }

  /**
   * Adds a normalized middleware to the outbound error middlewares collection.
   *
   * @param {Array} errorMiddlewares The middlewares to add to the collection.
   * @param {String} [topic] The scope topic.
   */
  addOutboundErrorMiddlewares (errorMiddlewares, topic) {
    this._addMiddlewares(this.outboundErrorMiddlewares, errorMiddlewares, topic);
  }
}

module.exports = HermesRouter;
