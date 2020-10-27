var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var cors = require('cors');
var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');

//======================================================================================================= Express config

var app = express();
//enable ALL cors requests
app.use(cors())

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

app.use(logger('dev'));

app.use(express.json());


app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

//app.use('/', indexRouter);
//app.use('/users', usersRouter);


//================================================================================================================== Data Base

const { MongoClient } = require("mongodb");

// Connection URI
const config = require('./config');
const uri = "mongodb+srv://admin:"+config.dbPassword+"@cluster0.86oxo.mongodb.net/"+config.dbName+"?retryWrites=true&w=majority";

// Create a new MongoClient
const client = new MongoClient(uri, { useUnifiedTopology: true },
  (err) => {
    if (err) return console.error(err);
    else console.log('Connected to Database')
  },
);

async function run() {
  try {
    // Connect the client to the server
    await client.connect();

    // Establish and verify connection
    await client.db("admin").command({ ping: 1 });
    console.log("Connected successfully to database");

    const db = client.db(config.dbName);
// users CRUD
    const users = db.collection('users')
//C
    app.post('/test', (req, res, next) => {
      console.log(req.headers);
})
//R
    app.get('/getUser',  async (req, res) => {
        user = await users.findOne({name: "Bob"})
        .catch((err) => {console.log(err)})
        console.log(user)
        res.send(user)
        })
//U
//D
  } finally {
    // Ensures that the client will close when you finish/error
    await client.close()
    .catch((err)=>console.log(err))
  }
}
// run
run().catch(console.dir);

//============================================================================================================= Middlewares

/* app.post('/test', (req, res, next) => {
  console.log(req.body.message);
  console.log(req.headers);
  console.log(req.headers.authorization);
  res.status(200)
})

app.post('/', (req, res, next) => {
  console.log(req.body);
  next;
}) */

//================================================================================================================ export

module.exports = app
