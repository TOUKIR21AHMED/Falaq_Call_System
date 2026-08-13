const express = require("express");

const {
  createCustomer,
  getCustomerByPhone,
} = require("../controllers/customerController");

const {
  protect,
  authorize,
} = require("../middleware/authMiddleware");

const router = express.Router();

router.post(
  "/",
  protect,
  authorize("admin", "agent"),
  createCustomer
);

router.get(
  "/phone/:phone",
  protect,
  authorize("admin", "agent"),
  getCustomerByPhone
);

module.exports = router;