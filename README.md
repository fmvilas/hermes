<p align="center"><img src="hermes.png"></p>
<p align="center" style="font-size:30px;">
  <strong>HermesJS</strong>
</p>
<p align="center">
  <em>Build message-driven APIs with ease.</em>
</p>
<br>

## Install

```
npm install hermesjs
```

## Example

Create a simple app to receive messages from a MQTT broker:

```js
const Hermes = require('hermesjs');
const MqttAdapter = require('hermesjs-mqtt');

const app = new Hermes();

app.add(MqttAdapter, {
  host_url: 'mqtt://test.mosquitto.org',
  topics: 'hello/#'
});

app.use((message, next) => {
  console.log(message.payload);

  try {
    message.payload = JSON.parse(message.payload);
    next(null, message);
  } catch (e) {
    next('Message payload must be in JSON format');
  }
});

app.use((err, message, next) => {
  console.error(err);
  console.error('Received payload:');
  console.error(message.payload);
  next();
});

app.connect();
```

## API

### App

#### Constructor

```js
const Hermes = require('hermesjs');
const app = new Hermes();
```

#### app.addAdapter(Adapter, options)

Adds a connection adapter. Adapters are built independently, as Node.js packages.

For instance, using a MQTT example:

```js
const MqttAdapter = require('hermesjs-mqtt');

app.add(MqttAdapter, {
  host_url: 'mqtt://test.mosquitto.org',
  topics: 'hello/#'
});
```

#### app.use(...fn)
#### app.use(HermesRouter)
#### app.use(route, ...fn)
#### app.use(route, HermesRouter)

Use middlewares and routes. If you know how Connect/Express works, it's exactly the same, but instead of getting `req` and `res`, you get a `message` object.

**Middlewares:**

```js
app.use((message, next) => {
  console.log(message.payload);
  // > '{"key": "value", "key2": 5}'
  message.payload = JSON.parse(message.payload);

  // Pass the modified message as the second
  // argument to forward it to the next middleware.
  next(null, message);
});

app.use((message, next) => {
  // Now `message.payload` is an object.
  console.log(message.payload);
  // > { key: 'value', key2: 5 }
  next();
});
```

**Routes:**

```js
app.use('hello/:name', (message, next) => {
  console.log(`Hello ${message.params.name}!`);
  next();
});
```

**HermesRouter**

`index.js`
```js
const hello = require('./routes/hello');

app.use('hello', hello);
```

`routes/hello.js`
```js
const Router = require('hermesjs/lib/router');
const router = new Router();

router.use(':name', (message, next) => {
  console.log(`Hello ${message.params.name}!`);
  next();
});

router.use('world', (message, next) => {
  console.log(`Hello world!`);
  next();
});

module.exports = router;
```

**Catch Errors**

```js
app.use((err, message, next) => {
  console.log('Handle error here...');
  next(err); // Optionally forward error to next middleware
});
```

#### app.useOutbound(...fn)
#### app.useOutbound(HermesRouter)
#### app.useOutbound(route, ...fn)
#### app.useOutbound(route, HermesRouter)

This is the same as `app.use` but for the outbound communication. The middlewares you specify here will be used before sending a message to the server or broker.

```js
app.use((message, next) => {
  // Set `sentAt` attribute to every message before they are sent.
  message.payload.sentAt = Date.now();
  next(null, message);
});
```

#### app.send(payload, headers, topic)
#### app.send(HermesMessage)

It sends a message to the server. The message will go through all the outbound middlewares before it reaches the adapters.

```js
app.send('Hello!', {}, 'hello/guest');
```

#### app.connect()

Starts the application and connects to the server using the adapters.

```js
app.connect();
```

> You can also use the `app.listen()` alias.

### Message

#### message.reply(payload, headers, topic)

Replies back to the server.

```js
app.use('hello/:name', (message, next) => {
  message.reply('Hello server!', undefined, `hello/${message.params.name}/response`);
});
```

#### message.params

Object containing all the params in the message topic, i.e.:

```js
app.in.broker.use('hello/:name/:surname', (message, next) => {
  // Given the `hello/tim/burton` topic, the params will look like:
  // message.params == {
  //   name: 'tim',
  //   surname: 'burton'
  // }
}
});
```

## Adapters

* MQTT adapter: https://github.com/hitchhq/hermes-mqtt
* AMQP adapter: https://github.com/hitchhq/hermes-amqp
* Socket.IO adapter: https://github.com/hitchhq/hermes-socketio

## Author

Fran Méndez ([fmvilas.com](https://fmvilas.com))
