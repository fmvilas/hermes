const Hermes = require('../lib/hermes');
const Router = require('../lib/Router');

const hermes = new Hermes();
const router = new Router();

hermes.use((message, next) => {
  console.log('Mid 1', message);
  message.modified = true;
  next();
}, (message, next) => {
  console.log('Mid 1.1', message);
  next();
});

hermes.use('test/:something', (message, next) => {
  console.log(message.params);
  console.log('Mid with error', message);
  next('Error');
});

hermes.use((message, next) => {
  console.log('Mid 2', message);
  next();
});

router.use('test/router', (message, next) => {
  console.log('It is a router');
  next();
});

hermes.use((err, message, next) => {
  console.log('Mid error handler', err, message);
  next('Another error');
});

hermes.use((err, message, next) => {
  console.log('Mid error handler 2', err, message);
  next(err);
});

hermes.injectMessage({msg: 'hola'}, {}, 'test/router');
