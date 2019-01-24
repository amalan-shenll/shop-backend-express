const mongoose = require("mongoose");//mongoose library
const Schema = mongoose.Schema;

let productsSchema = new Schema({//creating Products schema structure using mongoose schema
  productName: { type: String, required: true },
  price: { type: Number, required: true },
  description: { type: String },
  stockCount: { type: Number, required: true },
  status: { type: String, enum: ['visible', 'hide'], default: "hide" },
  productImage: { type: String, required: true },
  created: { type: Date, default: Date.now }
});

let Products = mongoose.model("Products", productsSchema);//creating mongoose model using productSchema
module.exports = Products;