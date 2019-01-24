const express = require('express');//express package
const app = express();//initializing express app
const port = 8080;//port to user for express app
const bodyParser = require('body-parser');//body-parser to process request data like json
const mongoose = require("mongoose");//mongoose library used to connect with mongodb
const bcrypt = require('bcrypt');//to encrypt user password into hash
const saltRounds = 8;//salt rounds for password encryption
const randtoken = require('rand-token');//random token generation
const _ = require('lodash');//lodash library for data stuctures 

//load schemas
const Users = require("./schemas/Users");

//mongodb connectivity with mongoose library
mongoose.connect("mongodb://localhost:27017/reactshopdb", { useNewUrlParser: true }, (error) => {
  if (error) {
    console.error("Please make sure Mongodb is installed and running!"); // eslint-disable-line no-console
    throw error;
  }
});

//this method will create default admin user if not exist in users collection
function configureAdmin() {
  console.log("Init admin config");
  let email = "admin@localhost";
  let password = "expr3s5";
  let role = "admin";
  Users.findOne({email},(err, user) => {
    if(err){
      console.log("Error getting admin details");
    } else if(_.isEmpty(user)) {
      bcrypt.hash(password, saltRounds, (err, hash) => {
        if(err) {
          console.log("Failed to configure admin")
        } else {
          let authToken = randtoken.generate(16);
          let newUser = new Users({
            email,
            password: hash,
            authToken,
            role
          });
          newUser.save((err, user) => {
            if(err){
              console.log("Error added admin to DB")
            } else {
              console.log("Admin configured successfully")
            }
          });
        }
      });
    } else {
      console.log("Admin already configured!");
    }
  })
}

//calling configureAdmin method
configureAdmin();

//to get and procress json request
app.use(bodyParser.json()); // for parsing application/json
app.use(bodyParser.urlencoded({ extended: true })); // for parsing application/x-www-form-urlencoded


//json response for root api endpoint
app.get('/', (req,res) => {
  res.json({
    status: "success",
    code: "server_started_success",
    message: "Shop backend server stated successfully."
  });
});

app.use('/user', require("./user"));

//starting the express server application and listen on given port(8080)
app.listen(port, () => {
  console.log("Shop backend server stated successfully!");
});