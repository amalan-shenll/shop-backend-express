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

router.post('/addProduct', isAdmin, (req, res) => {//endpoint to add products
  let data = req.body;//getting request body from json request
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
  } else if(!_.isNumber(price)) {//checking whether given input is number
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
    let newProduct = Products({//created data to insert into db
      productName,
      price,
      description,
      stockCount,
      productImage,
    });
    newProduct.save((err, product) => {//save method will insert data to db
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


/*
  .skip(20 * page)
  .limit(20)
  those are used to limit the results in response
  eg: considers there are 100 products in Products collection
  if you pass "/list?page=1" in url then you are requesting for page 1
  then first 1-20 records will be returned
  if you pass "/list?page=2" then your requesting next 20 records
  then 21-40 records will be returned
*/

router.get('/list', (req, res) => {//endpoint to list products
  let pageParam = req.params.page || 1 ;//reading url param for page eg: /list?page=1
  page = _.isNumber(pageParam) ? pageParam : 1 ;
  page = page > 0 ? page : 1;
  Products.find({status:"visible"})//query to find products with status visible
          .skip(20 * (page-1))//first 20 * page results skipped
          .limit(20)//to set limit for how many records to return
          .exec((err, products) => {//to execute the query 'products' will have results
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
                products: products//sendind products with response
              })
            }
          });
});

module.exports = router;