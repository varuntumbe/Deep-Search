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

  writeDataseq(bno, pno, textArr) {
    const finalCallback = (err, results) => {
      if (err) {
        //here have to rollback;
        this.conn.rollback();
        return Error('error while writing texts to db');
      } else {
        //here have to commit everything
        this.conn.commit();
      }
    };

    //here waterfall starts
    this.async.waterfall(
      [
        //first function to write to pageno table
        (callback) => {
          //query to insert pageno and booknum
          this.conn.query(
            //FIXME: this inside the function is undefined  (SOL:::: got fixed automatically when i used arrow functions ) GODDAMN WHY ???
            `insert ignore into pageno(Pgno,bno) values("${pno}","${bno}")`,
            (err, result) => {
              if (err) {
                this.conn.rollback();
                console.log('error in 1st method of waterfall');
                callback(err, 'finished in error');
              } else {
                console.log('byeeee');
                callback(null, pno, bno, textArr);
              }
            }
          );
        },
        //query to get pgId from pageno table
        //2nd function of waterfall to fetch the id of pageTable
        (pno, bno, textArr, callback) => {
          try {
            this.conn.query(
              `select pgid from pageno where pgno="${pno}" and bno="${bno}"`,
              (err, result) => {
                let pgId = result[0].pgid;
                callback(null, pgId, textArr);
              }
            );
          } catch (error) {
            callback(Error('error in getPageTableId'));
          }
        },

        //query to insert all the words of a pert page of a pert book to database
        //3rd function of waterfall to write words to db
        async (pgId, textArr, callback) => {
          try {
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

              await this.conn.query(
                `insert ignore into words(word) values("${word}")`,
                async (err, result) => {
                  if (err) {
                    this.conn.rollback();
                    callback(Error('error in addWordToDb func'));
                  } else {
                    let wordId = 0; // assuming every insert is ignored (if performance issue happened look here to optmise)
                    await this.conn.query(
                      `select wid from words where word="${word}"`,
                      (err, result) => {
                        if (err) {
                          callback(
                            Error(
                              'error in addWordToDb func while fetching wordId'
                            )
                          );
                        } else {
                          wordId = result[0].wid;
                          console.log(wordId);
                          callback(null, wordId, pgId, leftWord, rightWord);
                        }
                      }
                    );
                  }
                }
              );
            }
            callback(null, 'everything went fine');
          } catch (error) {
            callback(Error('error in writeWordToDb'));
          }
        },

        //4th function of waterfall
        //writes word instance of each word in to the database
        (wordId, pgId, leftWord, rightWord, callback) => {
          try {
            this.conn.query(
              `insert into wordinst(pgid,wid) values("${pgId}"."${wordId}")`,
              (err, result) => {
                if (err) {
                  this.conn.rollback();
                  callback(
                    Error('error in 4th func while writing to wordinst')
                  );
                }
                let wiid = result.insertId; //NOTE : here i havent made any special search query to get wiid because i dont have to ;)
                callback(null, wiid, leftWord, rightWord);
              }
            );
          } catch (error) {
            callback(Error('error in dealing with wordInstance'));
          }
        },

        //5th function of waterfall
        //writes word context to each word TODO:
        (wiid, leftWord, rightWord, callback) => {
          try {
            this.conn.query(
              `insert into wordctxt(wcxtid,leftword,rightword) values("${wiid}","${leftWord}","${rightWord}")`,
              (err, result) => {
                if (err) {
                  this.conn.rollback();
                  callback(
                    Error('error in 5th func of waterfall while writing')
                  );
                }
              }
            );
          } catch (error) {
            callback(Error('error in 5th waterfall func'));
          }
        },
      ],
      //will get executed when every waterfall fucntions get over
      finalCallback
    );
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
