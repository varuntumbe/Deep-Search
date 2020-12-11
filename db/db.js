
class Database{

    //initializing the database connection
    constructor(){
        this.mysql = require('mysql');
        this.util = require('util');
        this.dbUsername = process.env.dbUsername 
        this.dbPassword = process.env.dbPassword 
        this.dbName = process.env.dbName || 'deep_search';
        this.conn = this.mysql.createConnection({
            host     : 'localhost',
            user     : this.dbUsername,
            password : this.dbPassword,
            database : this.dbName,
          });
        this.conn.connect();
    }

    //promisify the callback func
    convertToPromise(func){
        return this.util.promisify(func);
    }

    // query about author
    authorQuery(){

        return new Promise((resolve,reject)=>{
             this.conn.query('SELECT * from author', function (error, results) {
                if (error) reject('err');

                resolve(results);
              });
              
        })

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
    bookQuery(){
        return new Promise((resolve,reject)=>{
            this.conn.query('select * from book',(err,results)=>{
                if(err)
                reject('err');

                resolve(results);
            })
        });
    }
    

    //used to end the connection
    endConn(){

        this.conn.end();
    }
}

module.exports=Database;