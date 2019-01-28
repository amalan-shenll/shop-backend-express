const mongoose = require("mongoose");//mongoose library
const Schema = mongoose.Schema;

let cartSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, required: true },
  product: { type: Schema.Types.ObjectId, required: true, ref: 'Products' },
  created: { type: Date, default: Date.now }
});

let Cart = mongoose.model("Cart", cartSchema);//creating mongoose model using productSchema
module.exports = Cart;