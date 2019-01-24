const express = require('express');
const app = express();
const port = 8080;


app.get('/', (req,res) => {
  res.json({
    status: "success",
    code: "server_started_success",
    message: "Shop backend server stated successfully."
  });
});

app.listen(port, () => {
  console.log("Shop backend server stated successfully!");
});