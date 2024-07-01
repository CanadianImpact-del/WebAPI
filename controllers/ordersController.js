const { v4: uuidv4 } = require("uuid");
const { Mutex } = require("async-mutex");
const Joi = require("joi");
const xss = require("xss");

let orders = [];
const ordersMutex = new Mutex();

const sizePrices = {
  small: 10,
  medium: 12,
  large: 15,
};

const toppingPrice = 2;

const orderSchema = Joi.object({
  size: Joi.string().valid("small", "medium", "large").required(),
  toppings: Joi.array().items(Joi.string()).required(),
  quantity: Joi.number().integer().min(1).required(),
});

const validateOrderId = (req, res, next) => {
  const { orderId } = req.params;
  const uuidPattern =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[4][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  if (!orderId || !uuidPattern.test(orderId)) {
    return res.status(400).json({ error: "Invalid order ID" });
  }
  next();
};

const sanitizeInput = (req, res, next) => {
  if (req.body) {
    req.body = {
      size: xss(req.body.size),
      toppings: req.body.toppings.map((topping) => xss(topping)),
      quantity: xss(req.body.quantity),
    };
  }
  next();
};

const errorHandler = (err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: "Internal server error" });
};

const createOrder = async (req, res) => {
  const { error } = orderSchema.validate(req.body);
  if (error) {
    return res
      .status(400)
      .json({ error: "Invalid order data", details: error.details });
  }

  const { size, toppings, quantity } = req.body;

  const order = {
    id: uuidv4(),
    size,
    toppings,
    quantity,
    status: "pending",
  };

  await ordersMutex.runExclusive(() => {
    orders.push(order);
  });

  res.status(201).json(order);
};

const listOrders = async (req, res) => {
  let allOrders;
  await ordersMutex.runExclusive(() => {
    allOrders = orders.map((order) => ({
      ...order,
      size: xss(order.size),
      toppings: order.toppings.map((topping) => xss(topping)),
      quantity: xss(order.quantity),
    }));
  });
  res.json(allOrders);
};

const getOrder = async (req, res) => {
  let order;
  await ordersMutex.runExclusive(() => {
    order = orders.find((o) => o.id === req.params.orderId);
  });
  if (!order) {
    return res.status(404).json({ error: "Order not found" });
  }
  order.size = xss(order.size);
  order.toppings = order.toppings.map((topping) => xss(topping));
  order.quantity = xss(order.quantity);
  res.json(order);
};

const updateOrder = async (req, res) => {
  const { error } = orderSchema.validate(req.body);
  if (error) {
    return res
      .status(400)
      .json({ error: "Invalid order data", details: error.details });
  }

  const { size, toppings, quantity } = req.body;
  let updatedOrder;

  await ordersMutex.runExclusive(() => {
    const order = orders.find((o) => o.id === req.params.orderId);
    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }
    order.size = size;
    order.toppings = toppings;
    order.quantity = quantity;

    updatedOrder = order;
  });

  res.json(updatedOrder);
};

const deleteOrder = async (req, res) => {
  await ordersMutex.runExclusive(() => {
    const orderIndex = orders.findIndex((o) => o.id === req.params.orderId);
    if (orderIndex === -1) {
      return res.status(404).json({ error: "Order not found" });
    }
    orders.splice(orderIndex, 1);
  });
  res.status(204).end();
};

const completeOrder = async (req, res) => {
  let orderSummary;

  await ordersMutex.runExclusive(() => {
    const orderIndex = orders.findIndex((o) => o.id === req.params.orderId);
    if (orderIndex === -1) {
      return res.status(404).json({ error: "Order not found" });
    }

    const order = orders[orderIndex];

    const basePrice = sizePrices[order.size.toLowerCase()] || 0;
    const toppingsPrice = order.toppings.length * toppingPrice;
    const totalPrice = (basePrice + toppingsPrice) * order.quantity;

    orders.splice(orderIndex, 1);

    orderSummary = {
      id: order.id,
      size: xss(order.size),
      toppings: order.toppings.map((topping) => xss(topping)),
      quantity: xss(order.quantity),
      status: "completed",
      totalPrice: totalPrice,
    };
  });

  if (!orderSummary) {
    return res.status(404).json({ error: "Order not found" });
  }

  res.json(orderSummary);
};

module.exports = {
  createOrder,
  listOrders,
  getOrder,
  updateOrder,
  deleteOrder,
  completeOrder,
  validateOrderId,
  sanitizeInput,
  errorHandler,
};
