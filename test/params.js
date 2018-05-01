const Hermes = require('../lib/hermes');
const hermes = new Hermes();

hermes.use('test/:number', (message, next) => {
  console.log('Number:', message.params.number);
  next();
});

hermes.use('test/:number/:action', (message, next) => {
  console.log('Number:', message.params.number);
  console.log('Action:', message.params.action);
  next();
});

hermes.injectMessage({msg: 'hello'}, {}, 'test/3');
hermes.injectMessage({msg: 'hello'}, {}, 'test/1/run');
