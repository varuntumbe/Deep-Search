const express=require('express');
const {getAllAuthors,addAuthor,getAllBooks,addBook} = require('../controllers/shelfController');

//creating author route instance
const aRouter=express.Router()

aRouter.route('/')
    .get(getAllAuthors)
    .post(addAuthor)


//creating author route instance
const bRouter=express.Router()
    
bRouter.route('/')
    .get(getAllBooks)
    .post(addBook)
    

exports.aRouter=aRouter;
exports.bRouter=bRouter;
