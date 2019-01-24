const express = require('express');
const router = express.Router();//creating router for express
const _ = require('lodash');

const Users = require("./schemas/Users");//loading Users Schema
const Products = require("./schemas/Products");//loading Products Schema

//middleware to check if requesting user is admin
function isAdmin(req, res, next) {
  let authToken = req.get("xy-authtoken");
  if(authToken) {
    Users.findOne({authToken}, (err, user) => {
      if(_.isEmpty(user)) {
        res.json({
          status: "error",
          code: "invalid_authtoken",
          message: "Invalid authtoken."
        });
      } else if(user.role === "admin") {
        next();
      } else {
        res.json({
          status: "error",
          code: "access_error",
          message: "You are not admin to perform this task."
        });
      }
    });
  } else {
    res.json({
      status: "error",
      code: "authtoken_missing",
      message: "Authtoken is missing."
    });
  }
}

router.post('/addProduct', isAdmin, (req, res) => {
  let data = req.body;
  let productName = data.productName || "";
  let price = data.price || "";
  let description = data.description || "";
  let stockCount = data.stockCount || "";
  let productImage = data.productImage || "";
  if(!productName) {
    res.json({
      status: "error",
      code: "productName_required",
      message: "Product name must not be empty."
    });
  } else if(!price) {
    res.json({
      status: "error",
      code: "price_required",
      message: "Product price must not be empty."
    });
  } else if(!_.isNumber(price)) {
    res.json({
      status: "error",
      code: "price_must_numeric",
      message: "Price must be a number."
    });
  } else if(!description) {
    res.json({
      status: "error",
      code: "description_required",
      message: "Product description must not be empty."
    });
  } else if(!stockCount) {
    res.json({
      status: "error",
      code: "stockCount_required",
      message: "Stock Count must not be empty."
    });
  } else if(!_.isNumber(stockCount)) {
    res.json({
      status: "error",
      code: "stockCount_must_numeric",
      message: "Stock Count must be a number."
    });
  } else if(!productImage) {
    res.json({
      status: "error",
      code: "productImage_required",
      message: "Product Image url must not be empty."
    });
  } else {
    let newProduct = Products({
      productName,
      price,
      description,
      stockCount,
      productImage,
    });
    newProduct.save((err, product) => {
      if(err) {
        res.json({
          status: "error",
          code: "server_error",
          message: "Error while saving the product."
        });
      } else {
        res.json({
          status: "success",
          code: "add_product_success",
          message: "Product added successfully."
        });
      }
    });
  }
});

router.get('/list', (req, res) => {
  let page = req.params.page || 0 ;
  Products.find({status:"visible"})
          .skip(20 * page)
          .limit(20)
          .exec((err, products) => {
            if(err) {
              res.json({
                status: "error",
                code: "server_error",
                message: "Error while loading the products."
              });
            } else {
              res.json({
                status: "success",
                code: "products_loaded_success",
                message: "Products loaded successfully.",
                products: products
              })
            }
          });
});

module.exports = router;