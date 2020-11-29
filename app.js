const express=require('express');
const app=express()

//routes
app.get('/',(req,res)=>{
    return res.status(200).send('req recieved');
});


module.exports=app;
