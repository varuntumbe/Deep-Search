const { validationResult } = require('express-validator');
const Database = require('../db/db');
const db = new Database();

/*---------Author--------*/
//handler for GET allAuthor route
exports.getAllAuthors = (req, res) => {
  const r = db.authorQuery();

  r.then((data) => {
    db.endConn();
    return res.status(200).json(data);
  }).catch((err) => {
    db.endConn();
    return res.status(500).end('server error');
  });
};

//handler for POST addAuthor route
exports.addAuthor = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({ errors: errors.array() });
  }
  try {
    console.log(req.body);
    const authorName = req.body.authorName;
    const nationality = req.body.nationality;
    const dob = req.body.dob || '1828-08-09';
    const death = req.body.death || '1828-08-09';
    const era = req.body.era || 20; //default is 20th century

    console.log(authorName, nationality, era);

    const pid = await db.writePeriod(parseInt(era));
    const result = await db.writeAuthorDetail(
      authorName,
      nationality,
      dob,
      death,
      pid
    );
    return res.status(200).send('success in adding author data');
  } catch (error) {
    console.log(error);
    return res.status(500).send('error while adding author data');
  }
};

exports.getSpecificAuthor = async (req, res) => {
  const id = parseInt(req.query.id);
  const authorInfo = await db.authorInfo(id);
  const allBooksByAuthor = await db.allBooksByAuthor(id);
  console.log(authorInfo, allBooksByAuthor);
  res.status(200).render('pages/author', {
    authorInfo: authorInfo,
    allBooksByAuthor: allBooksByAuthor,
  });
};

/*---------Books--------*/
//handler for GET allBooks route
exports.getAllBooks = (req, res) => {
  const r = db.bookQuery();

  r.then((data) => {
    db.endConn();
    return res.status(200).json(data);
  }).catch((err) => {
    return res.status(500).end('server error');
  });
};

//handler for POST addBook route
exports.addBook = (req, res) => {
  res.json({ status: 'working' });
};
