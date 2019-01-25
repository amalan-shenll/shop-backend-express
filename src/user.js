const express = require('express');
const router = express.Router();//creating router for express
const _ = require('lodash');
const bcrypt = require('bcrypt');
const saltRounds = 8;
const randtoken = require('rand-token');

//loading Users Schema
const Users = require("./schemas/Users");

router.post('/auth',(req, res) => {//creating endpoint for user authentication
  let data = req.body;
  let email = data.email || "";
  let password = data.password || "";
  if(!email) {
    res.json({
      status: "error",
      code: "email_required",
      message: "Email must not be empty."
    });
  } else if(!password) {
    res.json({
      status: "error",
      code: "password_required",
      message: "Password must not be empty."
    });
  } else {
    Users.findOne({email}, (err, user) => {
      if(!_.isEmpty(user)){
        bcrypt.compare(password, user.password, function(err, valid) {
          if(err) {
            res.json({
              status: "error",
              code: "server_error",
              message: "Password validation error."
            });
          } else if(valid == true) {
            let authToken = randtoken.generate(16);
            Users.updateOne({_id: user._id},{authToken}, (uerr, update)=> {
              if(uerr){
                res.json({
                  status: "error",
                  code: "server_error",
                  message: "Error while authtoken store."
                }); 
              } else {
                res.json({
                  status: "success",
                  code: "authentication_success",
                  message: "User Authenticated Successfully.",
                  role: user.role,
                  authToken
                }); 
              }
            }); 
          } else {
            res.json({
              status: "error",
              code: "invalid_password",
              message: "Invalid User password"
            });
          }
        });
      } else {
        res.json({
          status: "error",
          code: "user_not_found",
          message: "User with " + email + " not found."
        });
      }
    });
  }
});

//api endpoint for user registration
router.post('/register', (req, res) => {
  let data = req.body;
  let email = data.email || "";
  let password = data.password || "";

  var emailRegex = /^\w+@[a-zA-Z_]+?\.[a-zA-Z]{2,3}$/; //regex for email validation

  if(!email) {
    res.json({
      status: "error",
      code: "email_required",
      message: "Email must not be empty."
    });
  } else if(!emailRegex.test(email)) {//validating email with regex pattern
    res.json({
      status: "error",
      code: "invalid_email",
      message: "Please give valid email."
    });
  } else if(!password) {
    res.json({
      status: "error",
      code: "password_required",
      message: "Password must not be empty."
    });
  } else {
    Users.findOne({email}, (err, user) => {//getting user detail for given email
      if(err) {
        res.json({
          status: "error",
          code: "server_error",
          message: "Error retrieving user details."
        });
      } else if(_.isEmpty(user)){//will be empty if user not present already in db with given mail 
        bcrypt.hash(password, saltRounds, (err, hash) => {//generating password hash
          if(err) {
            res.json({
              status: "error",
              code: "server_error",
              message: "Error processing user password."
            });
          } else {
            let authToken = randtoken.generate(16);//generating authtoken
            /*
            Note:
              authtoken will be used to validated user session on api calls
            */
            let newUser = new Users({//creating new user
              email,
              password: hash,
              authToken
            });
            newUser.save((err, user) => {//saving new user to db
              if(err) {
                res.json({
                  status: "error",
                  code: "server_error",
                  message: "Error creating new user."
                });
              } else {
                /*
                  if user created successfully response with authtoken
                */
                res.json({
                  status: "success",
                  code: "user_created_success",
                  message: "User created successfully.",
                  role: user.role,
                  authToken
                });
              }
            });
          }
        });
      } else {//if user not empty means user with given email already present
        res.json({
          status: "error",
          code: "user_already_present",
          message: "User with " + email + " already present."
        });
      }
    });
  }
});

module.exports = router;

