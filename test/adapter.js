const Hermes = require('../lib/hermes');
const ExampleAdapter = require('./example-adapter');

const hermes = new Hermes();

hermes.addAdapter(ExampleAdapter, {
  port: 6789,
});

hermes.use((message, next) => {
  console.log(message);
  next();
});

hermes.use((err, message, next) => {
  console.log('ERROR', err);
  next();
});

hermes.listen().then((adapter) => {
  hermes.send({msg: 'hello'});
}).catch(console.error);
