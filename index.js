var express=require('express')
var app=express()
const cors = require('cors');
var bodyparser=require('body-parser')
app.use(bodyparser.urlencoded({extended:true}))
var home=require('./home')
const { createProxyMiddleware } = require('http-proxy-middleware');
app.use(cors({
    origin: 'http://localhost:3000',
  }));  
app.use(
    '/firebase-api',
    createProxyMiddleware({
      target: 'https://firebasestorage.googleapis.com',
      changeOrigin: true,
      pathRewrite: {
        '^/firebase-api': '', // remove the '/firebase-api' prefix when forwarding
      },
    })
  );
app.use(bodyparser.json({ limit: '10mb' }));
app.use(bodyparser.urlencoded({ extended: true, limit: '10mb' }));
app.use(cors());
app.listen("3001",()=>
{
    console.log("Server Started")
})
app.use("/",home)