const Hermes = require('../lib/hermes');
const Router = require('../lib/router');

const hermes = new Hermes();
const router = new Router();

router.use(':test/*', (message, next) => {
  console.log('It is a test');
  next();
});

router.use(':test/hello', (message, next) => {
  console.log('It is another test');
  message.reply();
});

router.useOutbound(':test/hello', (message, next) => {
  console.log('Outbound message:');
  console.log(message.payload);
  next();
});

hermes.use('test', router);

hermes.injectMessage({msg: 'hello'}, {}, 'test/1/hello');

setTimeout(() => {
  hermes.send({msg: 'An outbound message'}, {}, 'test/1/hello');
}, 1000);
