const Database = require('../db/db');
const db = new Database();

exports.getWordContext = (req, res) => {
  const queryText = req.query.text;
  if (queryText.length == 0) {
    return res.status(200).end('No text was sent');
  }
  db.queryTextInDb(queryText)
    .then((data) => {
      return res.status(200).json(data);
    })
    .catch((err) => {
      return res.status(500).end('Error happened in server');
    });
};

exports.writeTextToDb = (req, res) => {
  const scrapeData = req.body;
  const bookName = scrapeData.data.bookName;
  const wordData = scrapeData.data.wordData;

  db.writeScrapedData(bookName, wordData)
    .then((data) => {
      console.log(data);
      return res.status(200).end('success');
    })
    .catch((err) => {
      return res.status(404).end('failed');
    });
};
