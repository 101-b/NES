var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var cors = require('cors');

const config = require('./config');

//======================================================================================================= config middlewares

var app = express();

//enable ALL cors requests
app.use(cors())

//parsers
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

//firebase Auth

var admin = require('firebase-admin');

const serviceAccount = config.firebaseServiceKey;

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://hapi-d99bc.firebaseio.com"
});

async function token2Uid(idToken) { //à appeler à l'intérieur d'un bloc try/catch
    verifiedToken = await admin.auth().verifyIdToken(idToken)
//    console.log(verifiedToken.uid)
    return verifiedToken.uid;
}

//================================================================================================================== Data Base

//==================================================== connection to database

const { MongoClient } = require("mongodb");

// Connection URI
const uri = "mongodb+srv://admin:"+config.dbPassword+"@cluster0.86oxo.mongodb.net/"+config.dbName+"?retryWrites=true&w=majority";

// Create a new MongoClient
const client = new MongoClient(uri, { useUnifiedTopology: true },
  (err) => {
    if (err) return console.error(err);
    else console.log('Connected to Database')
  },
);
//===================================================================================== function to run
async function connect(uid) {
  try {
    const client =  new MongoClient(uri, { useUnifiedTopology : true})
    await client.connect()
    await client.db("admin").command({ping: 1})
    console.log('NES connected to database.')

    const db = client.db(config.dbName)
    

  //======================================================== users collection CRUDs

    const users= db.collection('users')

    //R header is "uid": string
    app.get('/getUser',
    async (req, res) => {
    try {
      let uid = await token2Uid(req.headers.idtoken)
      let user = await users.findOne({ "uid" : uid })
//      console.log(uid)
//      console.log(user)
      res.status(200).send(user) 
    } catch (err) {
      res.status(404).send("Failed to GET data : " + err.message)
    }
    })
    
    //C user is an object
    app.post('/createUser',
    async (req, res) => {
      try {
      let uid = await token2Uid(req.headers.idtoken)
      await users.insertOne(
        {
          "uid": uid,
          "name": req.body.user.name,
          "email": req.body.user.email,
          //...
        }) 
      res.status(201).send('used added')
    } catch (err) {
      res.status(400).send("Failed to POST data : " + err.message)
    }
    })


    //U header is "uid": string && user is an object (uid-less)
    app.put('/updateUser',
    async (req, res) => {
      try{
        let uid = await token2Uid(req.headers.idtoken)
        let userUpdate = req.body.user
        let updatedUser = await users.findOneAndUpdate( { "uid": await uid }, { $set:
          { 
            name: userUpdate.name,
            email: userUpdate.email,
            //...
          }
          },
          {returnOriginal : false}
        )
        res.status(200).send(updatedUser.value)
      } catch (err) {
        res.status(400).send("Failed to PUT data : " + err.message)
      }
    })
    //D header is "uid": string
    app.delete('/deleteUser',
    async (req, res) => {
      try {
        let uid = await token2Uid(req.headers.idtoken)
        users.deleteOne( { "uid": uid })
        res.status(200).send("data erased")
      } catch (err) {
        res.status(500).send("Failed to delete data : " + err.message) // fuite de l'uid en retour err en cas de conflit d'index. Important ?
      }
    })
    
  // =============================================================== products CRUD
    const products= db.collection('products')

    //R get ALL products
    app.get('/getproducts',
      async (req, res) => {
      try {
        const result = await products.find({ stock: {$gt: 0 }}).toArray()
        res.status(200).send(result) 
      } catch (err) {
        res.status(404).send("Failed to GET data : " + err.message)
      }
      })
    //R get ONE product
    

    //tests
    app.post('/test', (req, res, next) => {
      console.log(req.body.message);
      console.log(req.headers);
      console.log(req.headers.authorization);
      res.status(200)
    })

  //===================================================== error handler and finally block
  } catch (err) {
    console.log(err.message)
  }
  finally {
    client.close()
  }
}

// run
connect();



//========================================================================================================== export

module.exports = app
