var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var cors = require('cors');


//======================================================================================================= config middlewares

var app = express();

//enable ALL cors requests
app.use(cors())

//parsers
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

//================================================================================================================== Data Base

//==================================================== connection to database

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
//===================================================================================== function to run
async function connect() {
  try {
    const client =  new MongoClient(uri, { useUnifiedTopology : true})
    await client.connect()
    await client.db("admin").command({ping: 1})
    console.log('NES connected to database.')

    const db = client.db(config.dbName)
    
  //======================================================== "Users" collection CRUDs

    const users= db.collection('users')

    //R header is "uid": string
    app.get('/getUser',
    async (req, res) => {
    try {
      let user = await users.findOne({ "uid" : req.headers.uid }) 
      res.status(200).send(user) 
    } catch (err) {
      res.status(404).send("Failed to GET data"+err)
    }
    })
    
    //C user is an object
    app.post('/createUser',
    async (req, res) => {
      try {
      await users.insertOne(req.body.user) 
      res.status(201).send('used added')
    } catch (err) {
      res.status(400).send("Failed to POST data"+err)
    }
    })


    //U header is "uid": string && user is an object (uid-less)
    app.put('/updateUser',
    async (req, res) => {
      try{
        let userUpdate = req.body.user
        let updatedUser = await users.findOneAndUpdate( { "uid": req.headers.uid }, { $set:
          { 
            name: userUpdate.name,
            email: userUpdate.email,
          }
          },
          {returnOriginal : false}
        )
        res.status(200).send(updatedUser.value)
      } catch (err) {
        res.status(400).send("failed to PUT data : "+err)
      }
    })
    //D header is "uid": string
    app.delete('/deleteUser',
    async (req, res) => {
      try {
        users.deleteOne( { "uid": req.headers.uid })
        res.status(200).send("data erased")
      } catch (err) {
        res.status(500).send("Failed to delete data : "+err)
      }
    })
    
    //tests
    app.post('/test', (req, res, next) => {
      console.log(req.body.message);
      console.log(req.headers);
      console.log(req.headers.authorization);
      res.status(200)
    })

  } catch (err) {
    console.log(err)
  }
  finally {
    client.close()
  }
}

// run
connect();

//========================================================================================================== export

module.exports = app
