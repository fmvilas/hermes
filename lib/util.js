const pathToRegexp = require('path-to-regexp');
const Message = require('./message');

const util = module.exports;

/**
 * Creates a HermesMessage from any payload and topic.
 *
 * @param {Hermes} hermes A reference to the Hermes app.
 * @param {Any} payload The payload of the message.
 * @param {Any} headers The headers of the message.
 * @param {String} [topic] The topic of the message.
 * @return {HermesMessage}
 */
util.createMessage = (hermes, payload, headers, topic) => {
  return (payload instanceof Message ? payload : new Message(hermes, payload, headers, topic));
};

/**
 * Duplicates a HermesMessage.
 *
 * @param {HermesMessage} message The message to duplicate.
 * @return {HermesMessage}
 */
util.duplicateMessage = (message) => {
  const newMessage = new Message(message.hermes, message.payload, message.headers, message.topic);
  newMessage.inbound = message.inbound;
  newMessage.outbound = message.outbound;
  return newMessage;
};

/**
 * Determines if a path matches a topic.
 *
 * @param {String} path The path.
 * @param {String} topic The topic.
 * @return {Boolean}
 */
util.matchTopic = (path, topic) => {
  return (this.getParams(path, topic) !== null);
};

/**
 * Determines if a path matches a topic, and returns an array of matching params.
 *
 * @param {String} path The path.
 * @param {String} topic The topic.
 * @return {Object|null}
 */
util.getParams = (path, topic) => {
  if (path === undefined) return {};

  const keys = [];
  const re = pathToRegexp(path, keys);
  const result = re.exec(topic);

  if (result === null) return null;

  return keys.map((key, index) => ({ [key.name]: result[index+1] })).reduce((prev, val) => ({
    ...prev,
    ...val,
  }), {});
};
