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
  }

  //promisify the callback func
  convertToPromise(func) {
    return this.util.promisify(func).bind(this.conn);
  }

  // query about author
  async authorQuery() {
    const promisifiedQuery = this.convertToPromise(this.conn.query);
    try {
      const result = await promisifiedQuery('SELECT * from author');
      return result;
    } catch (error) {
      return Error('error in author query');
    }
  }

  //query about books
  async bookQuery() {
    const promisifiedQuery = this.convertToPromise(this.conn.query);
    try {
      const result = await promisifiedQuery('SELECT * from book');
      return result;
    } catch (error) {
      return Error('error in book query');
    }
  }

  //storing scraped pdf texts to database
  async writeScrapedData(bookName, wordData) {
    try {
      const bookResultPacket = await this.getBookId(bookName);
      const promisesArr = [];
      const bno = bookResultPacket[0].bno;
      for (let key in wordData) {
        let pno = parseInt(key);
        let text = wordData[key];
        let textArr = text.split(' ');
        //calling the function next which has waterfall :)
        const pagePromise = await this.writeDataseq(bno, pno, textArr);
        promisesArr.push(pagePromise);
      }
      Promise.all(promisesArr).then(() => {
        this.conn.commit();
        return 'everything went fine';
      });
    } catch (error) {
      return Error(error);
    }
  }

  async writeDataseq(bno, pno, textArr) {
    //writing to pageno table
    const pageNoTablePacket = await this.writeToPageNoTable(bno, pno);
    try {
      let pgId = pageNoTablePacket.insertId;
      if (pgId == 0) {
        pgId = await this.getPgId(bno, pno);
      }
      //else its insertion is not ignored and its id is
      // in insertId itself

      for (let index = 0; index < textArr.length; index++) {
        let leftWord = null;
        let rightWord = null;

        let word = textArr[index];

        if (index - 1 >= 0) {
          leftWord = textArr[index - 1];
        }
        if (index + 1 < textArr.length) {
          rightWord = textArr[index + 1];
        }

        const wordPacket = await this.writeWordToDb(word);
        let wordId = wordPacket.insertId;
        if (wordId == 0) {
          wordId = await this.getWordId(word);
        }

        //its time to write wordinstance
        const wordInstPacket = await this.writeWordInst(wordId, pgId);
        let wordInstId = wordInstPacket.insertId;
        /*i didnt write query followed by insert
        because i am sure that everytime insert to
        word inst will not ignored and i will get the
        in insertId*/

        //its time to write wordcontext
        const wordContextPacket = await this.writeWordContext(
          wordInstId,
          leftWord,
          rightWord
        );
      }
      //every operation finished
      return 'everything done successfully';
    } catch (error) {
      throw Error(error);
    }
  }

  async writeWordContext(wiid, leftWord, rightWord) {
    const promisifiedQuery = this.convertToPromise(this.conn.query);
    try {
      const result = await promisifiedQuery(
        `insert into wordctxt(wcxtid,leftword,rightword) values("${wiid}","${leftWord}","${rightWord}")`
      );
      return result;
    } catch (error) {
      throw Error('error in writeWordContext');
    }
  }

  async writeWordInst(wordId, pgId) {
    const promisifiedQuery = this.convertToPromise(this.conn.query);
    try {
      const result = await promisifiedQuery(
        `insert into wordinst(pgid,wid) values("${pgId}","${wordId}")`
      );
      return result;
    } catch (error) {
      this.conn.rollback();
      throw Error('error in writeWordInst');
    }
  }

  async getWordId(word) {
    const promisifiedQuery = this.convertToPromise(this.conn.query);
    try {
      const result = await promisifiedQuery(
        `select wid from words where word="${word}"`
      );
      return result[0].wid;
    } catch (error) {
      throw Error('error in getWordId');
    }
  }

  async writeWordToDb(word) {
    const promisifiedQuery = this.convertToPromise(this.conn.query);
    try {
      const result = await promisifiedQuery(
        `insert ignore into words(word) values("${word}")`
      );
      return result;
    } catch (error) {
      throw Error('error in writeWordToDb');
    }
  }

  async getPgId(bno, pno) {
    const promisifiedQuery = this.convertToPromise(this.conn.query);
    try {
      const result = await promisifiedQuery(
        `select pgid from pageno where pgno="${pno}" and bno="${bno}"`
      );
      return result[0].pgid;
    } catch (error) {
      throw Error('error in getPgId function');
    }
  }

  async writeToPageNoTable(bno, pno) {
    const promisifiedQuery = this.convertToPromise(this.conn.query);
    try {
      const result = await promisifiedQuery(
        `insert ignore into pageno(Pgno,bno) values("${pno}","${bno}")`
      );
      return result;
    } catch (error) {
      this.conn.rollback();
      throw Error('error in writePageNoTable');
    }
  }

  //query to get book id by its name
  async getBookId(name) {
    const promisifiedQuery = this.convertToPromise(this.conn.query);
    try {
      const result = await promisifiedQuery(
        `select bno from book where title="${name}"`
      );
      return result;
    } catch (error) {
      return Error('error in getBookId');
    }
  }

  //used to end the connection
  endConn() {
    this.conn.end();
  }
}

module.exports = Database;
