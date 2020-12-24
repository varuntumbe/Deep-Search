class Database {
  //initializing the database connection
  constructor() {
    this.mysql = require('mysql');
    this.util = require('util');
    this.async = require('async');
    this.dbUsername = process.env.dbUsername;
    this.dbPassword = process.env.dbPassword;
    this.dbName = process.env.dbName || 'deep_search';
    this.conn = this.mysql.createConnection({
      host: 'localhost',
      user: this.dbUsername,
      password: this.dbPassword,
      database: this.dbName,
    });
    this.conn.connect();
    this.promisifiedQuery = this.convertToPromise(this.conn.query);
  }

  //promisify the callback func
  convertToPromise(func) {
    return this.util.promisify(func);
  }

  // query about author
  authorQuery() {
    return new Promise((resolve, reject) => {
      this.conn.query('SELECT * from author', function (error, results) {
        if (error) reject('err');

        resolve(results);
      });
    });

    // const results=await promisifiedQuery('select * from book');
    // console.log('heyy')
    // console.log(results);
    // try {

    //     let nresults=results.map((val)=>JSON.parse(JSON.stringify(val)));
    //     return nresults;
    // } catch (error) {
    //     console.log(error);
    //     return error;
    // }
  }

  //query about books
  bookQuery() {
    return new Promise((resolve, reject) => {
      this.conn.query('select * from book', (err, results) => {
        if (err) reject('err');

        resolve(results);
      });
    });
  }

  //storing scraped pdf texts to database
  async writeScrapedData(bookName, wordData) {
    try {
      const bookResultPacket = await this.getBookId(bookName);
      const bno = bookResultPacket[0].bno;
      for (let key in wordData) {
        let pno = parseInt(key);
        let text = wordData[key];
        let textArr = text.split(' ');
        //calling the function next which has waterfall :)
        await this.writeDataseq(bno, pno, textArr);
      }
      return 'everything went fine';
    } catch (error) {
      return Error(error);
    }
  }

  //query to get book id by its name
  getBookId(name) {
    return new Promise((resolve, reject) => {
      this.conn.query(
        `select bno from book where title="${name}"`,
        (err, results) => {
          if (err) reject('err');

          resolve(results);
        }
      );
    });
  }

  //used to end the connection
  endConn() {
    this.conn.end();
  }
}

module.exports = Database;
