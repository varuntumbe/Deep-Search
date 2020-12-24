const Database = require('../db/db');
const db = new Database();

exports.getWordContex = () => {};

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
      console.error(err);
      return res.status(404).end('failed');
    });
};
