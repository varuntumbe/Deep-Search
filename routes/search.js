const express = require('express');
const {
  getWordContext,
  writeTextToDb,
} = require('../controllers/searchController');

const sroute = express.Router();

// sroute.route('/').post(getWordContext);
sroute.route('/write').post(writeTextToDb);

module.exports = sroute;
