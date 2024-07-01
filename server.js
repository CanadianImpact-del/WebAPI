const express = require("express");
const bodyParser = require("body-parser");
const ordersRoutes = require("./routes/orders");
const ordersController = require("./controllers/ordersController");

const app = express();
const port = 3000;

app.use(bodyParser.json());
app.use(ordersRoutes);
app.use(ordersController.errorHandler);

app.listen(port, () => {
  console.log(`Pizza API running at http://localhost:${port}`);
});
