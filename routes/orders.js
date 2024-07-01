const express = require("express");
const expressBasicAuth = require("express-basic-auth");
const ordersController = require("../controllers/ordersController");

const router = express.Router();

const authenticate = expressBasicAuth({
  users: { admin: "password" }, // Replace with a more secure password or authentication method in production
  challenge: true,
  unauthorizedResponse: (req) => "Unauthorized",
});

router.post(
  "/api/orders",
  ordersController.sanitizeInput,
  ordersController.createOrder
);
router.get("/api/orders", ordersController.listOrders);
router.get(
  "/api/orders/:orderId",
  ordersController.validateOrderId,
  ordersController.getOrder
);
router.put(
  "/api/orders/:orderId",
  ordersController.validateOrderId,
  ordersController.sanitizeInput,
  ordersController.updateOrder
);
router.delete(
  "/api/orders/:orderId",
  ordersController.validateOrderId,
  ordersController.deleteOrder
);
router.post(
  "/api/orders/:orderId/complete",
  ordersController.validateOrderId,
  authenticate,
  ordersController.completeOrder
);

module.exports = router;
