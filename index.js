var express=require('express')
var app=express()
const cors = require('cors');
var bodyparser=require('body-parser')
app.use(bodyparser.urlencoded({extended:true}))
var home=require('./home')
const path = require('path'); 

  app.use(express.static('public'));
  app.use(express.static('models'));
  // Serve models from the 'models' directory
  app.use('/models', express.static('public'));
  app.use(express.json());

app.use(bodyparser.json({ limit: '10mb' }));
app.use(bodyparser.urlencoded({ extended: true, limit: '10mb' }));
app.use(cors());
app.listen("3001",()=>
{
    console.log("Server Started")
})
app.use("/",home)