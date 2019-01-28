const express = require('express');
const router = express.Router();//creating router for express
const _ = require('lodash');
const bcrypt = require('bcrypt');
const saltRounds = 8;
const randtoken = require('rand-token');

//loading Schemas
const Users = require("./schemas/Users");//loading Users Schema
const Products = require("./schemas/Products");//loading Products Schema
const Cart = require('./schemas/Cart');//loading Carts Schema
const Orders = require('./schemas/Orders');//loading Orders Schema


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

//api endpoint for add product to cart
router.post('/addToCart', (req, res) => {
  let authToken = req.get("xy-authtoken");
  let data = req.body;
  let productId = data.productId || "";
  if(!authToken) {
    res.json({
      status: "error",
      code: "authToken_required",
      message: "Please provide xy-authtoken with request header."
    });
  } else if(!productId) {
    res.json({
      status: "error",
      code: "productId_required",
      message: "Please provide product id."
    });
  } else {
    Users.findOne({authToken}, (err, user) => {
      if(err) {
        res.json({
          status: "error",
          code: "server_error",
          message: "Error validating authtoken."
        });
      } else if(!_.isEmpty(user)) {
        Products.findOne({_id: productId}, (err, product) => {
          if(err) {
            res.json({
              status: "error",
              code: "server_error",
              message: "Error validating product id."
            });
          } else if(!_.isEmpty(product)) {
            let productToAdd = Cart({
              userId: user._id,
              product: product._id
            });
            productToAdd.save((err, prod) => {
              if(err) {
                res.json({
                  status: "error",
                  code: "server_error",
                  message: "Error while adding product to cart."
                });
              } else {
                res.json({
                  status: "success",
                  code: "add_to_cart_success",
                  message: "Product added to cart successfully."
                });
              }
            });
          } else {
            res.json({
              status: "error",
              code: "invalid_productId",
              message: "Product with id " + productId + " not found."
            });
          }
        });
      } else {
        res.json({
          status: "error",
          code: "invalid_authtoken",
          message: "Invalid authtoken."
        });
      }
    });
  }
});

router.get('/getCart', (req, res) => {
  let authToken = req.get("xy-authtoken");
  if(!authToken) {
    res.json({
      status: "error",
      code: "authToken_required",
      message: "Please provide xy-authtoken with request header."
    });
  } else {
    Users.findOne({authToken}, (err, user) => {
      if(err) {
        res.json({
          status: "error",
          code: "server_error",
          message: "Error validating authtoken."
        });
      } else if(!_.isEmpty(user)) {
        Cart.find({userId: user._id})
        .populate('product')
        .exec((err, cart) => {
          if(err) {
            res.json({
              status: "error",
              code: "server_error",
              message: "Error getting cart information."
            });
          } else {
            res.json({
              status: "success",
              code: "cart_loaded_success",
              message: "Cart loaded successfully.",
              cart
            });
          }
        });
      } else {
        res.json({
          status: "error",
          code: "invalid_authtoken",
          message: "Invalid authtoken."
        });
      }
    });
  }
});

router.post('/removeFromCart', (req, res) => {
  let authToken = req.get("xy-authtoken");
  let data = req.body;
  let cartId = data.cartId || "";
  if(!authToken) {
    res.json({
      status: "error",
      code: "authToken_required",
      message: "Please provide xy-authtoken with request header."
    });
  } else if(!cartId) {
    res.json({
      status: "error",
      code: "productId_required",
      message: "Please provide product id."
    });
  } else {
    Users.findOne({authToken}, (err, user) => {
      if(err) {
        res.json({
          status: "error",
          code: "server_error",
          message: "Error validating authtoken."
        });
      } else if(!_.isEmpty(user)) {
        Cart.deleteOne({_id: cartId, userId: user._id}, (err) => {
          if(err) {
            res.json({
              status: "error",
              code: "product_remove_failed",
              message: "Failed to remove product from cart."
            });
          } else {
            res.json({
              status: "success",
              code: "product_removed_from_cart",
              message: "Product removed from the cart successfully."
            });
          }
        });
      } else {
        res.json({
          status: "error",
          code: "invalid_authtoken",
          message: "Invalid authtoken."
        });
      }
    });
  }
});

router.post('/placeOrder', (req, res) => {
  let authToken = req.get("xy-authtoken");
  let data = req.body;
  let paymentMethod = data.paymentMethod || "";
  let transactionId = data.transactionId || "";
  if(!authToken) {
    res.json({
      status: "error",
      code: "authToken_required",
      message: "Please provide xy-authtoken with request header."
    });
  } else if(!paymentMethod) {
    res.json({
      status: "error",
      code: "paymentMethod_required",
      message: "Please provide paymentMethod."
    });
  } else if(!transactionId) {
    res.json({
      status: "error",
      code: "transactionId_required",
      message: "Please provide transactionId."
    });
  } else {
    Users.findOne({authToken}, (err, user) => {
      if(err) {
        res.json({
          status: "error",
          code: "server_error",
          message: "Error validating authtoken."
        });
      } else if(!_.isEmpty(user)) {
        Cart.find({userId: user._id})
        .populate('product')
        .exec((err, cartItems) => {
          if(err) {
            res.json({
              status: "error",
              code: "server_error",
              message: "Error loading cart items."
            });
          } else if(cartItems.length >= 1){
            let products = [];
            let totalPrice = 0;
            cartItems.map((cartItem) => {
              products.push(cartItem.product);
              totalPrice += cartItem.product.price;
            });

            let paymentSchema = {
              paymentMethod,
              totalPrice,
              transactionId
            };
            
            let orderToPlace = Orders({
              userId: user._id,
              products,
              shippingAddress: user.address,
              payment: paymentSchema,
            });

            orderToPlace.save((err, order) => {
              if(err) {
                res.json({
                  status: "error",
                  code: "server_error",
                  message: "Error while placing order."
                });
              } else {
                res.json({
                  status: "success",
                  code: "order_placed_success",
                  message: "Order placed successfully.",
                  order
                });
              }
            });

          } else {
            res.json({
              status: "error",
              code: "empty_cart",
              message: "Cart items not found for given cartIds."
            });
          }
        });
      } else {
        res.json({
          status: "error",
          code: "invalid_authtoken",
          message: "Invalid authtoken."
        });
      }
    });
  }
});


router.get('/orders', (req, res) => {
  let authToken = req.get("xy-authtoken");
  if(!authToken) {
    res.json({
      status: "error",
      code: "authToken_required",
      message: "Please provide xy-authtoken with request header."
    });
  } else {
    Users.findOne({authToken}, (err, user) => {
      if(err) {
        res.json({
          status: "error",
          code: "server_error",
          message: "Error validating authtoken."
        });
      } else if(!_.isEmpty(user)) {
        Orders.find({userId: user._id})
        .exec((err, orders) => {
          if(err) {
            res.json({
              status: "error",
              code: "server_error",
              message: "Error while retrieving orders."
            });
          } else {
            res.json({
              status: "success",
              code: "user_orders_loaded",
              message: "User order loaded successfully.",
              orders
            });
          }
        });
      } else {
        res.json({
          status: "error",
          code: "invalid_authtoken",
          message: "Invalid authtoken."
        });
      }
    });
  }
});

module.exports = router;

