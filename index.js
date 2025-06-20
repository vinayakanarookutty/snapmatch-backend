var express = require('express')
var app = express()
const cors = require('cors');
var bodyparser = require('body-parser')

// CORS configuration MUST come BEFORE other middleware
const allowedOrigin = 'https://d1mmkc91smmqma.cloudfront.net';
app.use(cors({
  origin: allowedOrigin,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true, // enable if you use cookies or auth headers
}));

// Body parser middleware
app.use(bodyparser.urlencoded({extended: true, limit: '10mb'}))
app.use(bodyparser.json({ limit: '10mb' }));
app.use(express.json());

// Static file serving
app.use(express.static('public'));
app.use(express.static('models'));
app.use('/models', express.static('public'));

// Routes
var home = require('./home')
app.use("/", home)

app.listen("3001", () => {
    console.log("Server Started on port 3001")
})
