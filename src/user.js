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

module.exports = router;

