const Database = require('../db/db');
const db = new Database();

exports.getWordContex = () => {};

exports.writeTextToDb = (req, res) => {
  const scrapeData = req.body;
  const bookName = scrapeData.data.bookName;
  const wordData = scrapeData.data.wordData;

  db.getBookId(bookName)
    .then((data) => {
      const bno = data[0].bno;

      for (let key in wordData) {
        let pno = parseInt(key);
        let text = wordData[key];
        let textArr = text.split(' ');
        console.log(bno, pno);
        db.writeScrapeData(bno, pno, textArr);
      }
    })
    .catch((err) => {
      console.error(err);
      return res.status(404).end('hihi');
    });
};
