const mongoose = require("mongoose");//mongoose library
const Schema = mongoose.Schema;

let shippingAddressSchema = new Schema({
  doorNumber: { type: String },
  street: { type: String },
  region: { type: String },
  city: { type: String },
  state: { type: String },
  country: { type: String },
  zipcode: { type: String },
  phone: { type: String }
});

let paymentSchema = new Schema({
  paymentMethod: {type: String, required: true},
  totalPrice: {type: Number, required: true},
  transactionId: {type: String, required: true}
});

let ordersSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, required: true },
  products: [{ type: Schema.Types.ObjectId, required: true, ref: 'Products' }],
  orderStatus: { type: String, enum: ['created', 'cancelled', 'confirmed', 'packed', 'inshipping', 'delivered', 'returned'], default: "created" },
  shippingAddress: shippingAddressSchema,
  payment: paymentSchema,
  created: { type: Date, default: Date.now }
});

let Orders = mongoose.model("Orders", ordersSchema);//creating mongoose model using ordersSchema
module.exports = Orders;