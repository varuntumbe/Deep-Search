const express=require('express');
const morgan = require('morgan');
const authorRouter=require('./routes/shelf').aRouter;
const bookRouter=require('./routes/shelf').bRouter;
const app=express();

//routes
if(process.env.NODE_ENV=='development'){
    app.use(morgan('dev'));
}

//home page route
app.get('/',(req,res)=>{
    return res.status(200).send('req recieved');
});

//binding routes to router instances
app.use('/allAuthors',authorRouter);
app.use('/allbooks',bookRouter);

module.exports=app;
