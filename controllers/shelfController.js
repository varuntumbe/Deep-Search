const Database=require('../db/db');
const db=new Database();

/*---------Author--------*/
//handler for GET allAuthor route
exports.getAllAuthors=(req,res)=>{
    const r=db.authorQuery();

    r.then((data)=>{
        db.endConn();
        return res.status(200).json(data);
    })
     .catch((err)=>{
        db.endConn();
        console.log(err);
        return res.end('err happended')
     })
    
}

//handler for POST addAuthor route
exports.addAuthor=(req,res)=>{
    res.json({status:'working'});
}

/*---------Books--------*/
//handler for GET allBooks route
exports.getAllBooks=(req,res)=>{
    return res.status(200).json({status:'working'});
}

//handler for POST addBook route
exports.addBook=(req,res)=>{
    res.json({status:'working'});
}