
class Database{

    //initializing the database connection
    constructor(){
        this.mysql = require('mysql');
        this.dbUsername = process.env.dbUsername || 'root';
        this.dbPassword = process.env.dbPassword || 'varalaxmi';
        this.dbName = process.env.dbName || '4ni18cs107_dup';
        this.conn = this.mysql.createConnection({
            host     : 'localhost',
            user     : this.dbUsername,
            password : this.dbPassword,
            database : this.dbName,
          });
        this.conn.connect();
    }

    // test connection
    test_query(){

        this.conn.query('SELECT * from employee', function (error, results) {
            if (error) throw error;
            let nresults=results.map((val)=>JSON.parse(JSON.stringify(val)));
            console.log(typeof( nresults));
          });
           
    }

    //used to end the connection
    end_conn(){

        this.conn.end();
    }
}

const db=new Database();

db.test_query();

db.end_conn();