const express = require('express');

const morgan = require('morgan');
const bodyParser = require('body-parser');

const authorRouter = require('./routes/shelf').aRouter;
const bookRouter = require('./routes/shelf').bRouter;
const searchRouter = require('./routes/search');
const app = express();

//routes
if (process.env.NODE_ENV == 'development') {
  app.use(morgan('dev'));
}

//home page route
app.get('/', (req, res) => {
  return res.status(200).send('req recieved');
});

//using 3rd party middleware body-parser
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

//binding routes to router instances
app.use('/allAuthors', authorRouter);
app.use('/allbooks', bookRouter);
app.use('/search', searchRouter);

module.exports = app;
