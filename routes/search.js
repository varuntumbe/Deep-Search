const express = require('express');
const {
  getWordContext,
  writeTextToDb,
} = require('../controllers/searchController');

const sroute = express.Router();

// sroute.route('/').post(getWordContext);
sroute.route('/write').post(writeTextToDb);

sroute.route('/query').get(getWordContext);

module.exports = sroute;
