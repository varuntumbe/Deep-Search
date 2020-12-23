const { resolve } = require('path');

class Database {
  //initializing the database connection
  constructor() {
    this.mysql = require('mysql');
    this.util = require('util');
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

    /*  FIXME: -------------- promisifying using util causes typecast error--------------*/
    // const promisifiedQuery=this.convertToPromise(this.conn.query);
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

  async writeScrapeData(bno, pno, textArr) {
    return new Promise((resolve, reject) => {
      //transaction begins
      this.conn.beginTransaction((err) => {
        if (err) {
          reject('err');
        }
        this.conn.query(
          `insert ignore into pageno(Pgno,bno) values(${pno},${bno})`,
          async (err, results) => {
            if (err) {
              this.conn.rollback();
              console.log('error in writeScrapeData method');
              reject('err');
            }

            //if earrlier op went successfully then continue with the next one
            try {
              const pgId = results.insertId;
              //TODO: fixing insertid when its 0;

              if (pgId == 0) {
                try {
                  const pageObj = await this.getPageId(pno, bno);
                  console.log('pageobj : ', pageObj);
                  pgId = pageObj[0].pgid;
                } catch (error) {
                  reject('error while doing some operation in getting PageId');
                }
              }

              await this.iterateTextArr(textArr, pgId); //this function does db operation
              resolve('success');
            } catch (error) {
              console.log(error);
              this.conn.rollback();
              reject('error');
            }
          }
        );

        //commiting everything if everything went successfull
        this.conn.commit((err) => {
          if (err) {
            this.conn.rollback((err) => {
              throw 'err';
            });
          }

          console.log('transaction completed successfully');
        });
      });
    });
  }

  writeWord(word) {
    return new Promise((resolve, reject) => {
      console.log(word);
      this.conn.query(
        `insert ignore into words(word) values("${word}")`,
        async (err, result) => {
          if (err) {
            reject('err');
            console.log('error in writeWord method');
          }
          let wordId = result.insertId;
          //if this fails write a sep function to get word idFIXME:
          //TODO: fixing insertid when its 0;
          if (result.insertId == 0) {
            try {
              let wordobj = await this.getWordId(word);
              wordId = wordobj[0].wid;
            } catch (error) {
              reject('error while operating on getting wordId');
            }
          }

          //resolving
          resolve(wordId);
        }
      );
    });
  }

  writeWordInst(wordId, pgId) {
    console.log(`wordId : ${wordId} pgId: ${pgId}`);
    return new Promise((resolve, reject) => {
      this.conn.query(
        `insert ignore into wordinst(pgid,wid) values("${pgId}","${wordId}")`,
        async (err, results) => {
          if (err) {
            console.log('error in writeWordInst method');
            reject('err');
          }

          let wiid = results.insertId;
          //TODO: fixing insertid when its 0;
          if (wiid == 0) {
            try {
              let wiidobj = await this.getWordInstanceId(pgId, wordId);
              wiid = wiidobj[0].wiid;
            } catch (error) {
              reject('error while getting wordinstance id');
            }
          }

          resolve(wiid);
        }
      );
    });
  }

  writeWordContext(wcxtid, left, right) {
    console.log(wcxtid, left, right);
    return new Promise((resolve, reject) => {
      this.conn.query(
        `insert into wordctxt(wcxtid,leftword,rightword) values("${wcxtid}","${left}","${right}")`,
        (err, results) => {
          if (err) {
            reject('error in writeWordContext');
            console.log('error in writeWordContext method');
          }

          resolve('resolved');
        }
      );
    });
  }

  async iterateTextArr(textArr, pgId) {
    for (let index = 0; index < textArr.length; index++) {
      const word = textArr[index];
      console.log(word);
      try {
        console.log(word);
        let left = null;
        let right = null;

        if (index - 1 >= 0) {
          left = textArr[index - 1];
        }

        if (index + 1 < textArr.length) {
          right = textArr[index + 1];
        }

        const wordId = await this.writeWord(word);
        console.log(wordId);
        const contextId = await this.writeWordInst(wordId, pgId);
        console.log(contextId);
        await this.writeWordContext(contextId, left, right);
      } catch (error) {
        this.conn.rollback();
        console.log(error);
        return Error('some error went in iterateTextArr function');
      }
    }
  }

  //getting ids of each table
  getPageId(pno, bno) {
    return new Promise((resolve, reject) => {
      this.conn.query(
        `select pgid from pageno where pno="${pno}" and bno="${bno}"`,
        (err, results) => {
          if (err) {
            console.log('error in getPageId');
            reject('getPageId error');
          }
          resolve(results);
        }
      );
    });
  }

  getWordId(word) {
    return new Promise((resolve, reject) => {
      this.conn.query(
        `select wid from words where word="${word}"`,
        (err, results) => {
          if (err) {
            console.log('error in getWordId');
            reject('getWordId error');
          }
          console.log(results);
          resolve(results);
        }
      );
    });
  }

  getWordInstanceId(pgId, wordId) {
    return new Promise((resolve, reject) => {
      this.conn.query(
        `select wiid from wordinst where pgid="${pgId}" and wid=${wordId}`,
        (err, results) => {
          if (err) {
            console.log('error in getWordInstanceId');
            reject('getWordInstanceId error');
          }
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
