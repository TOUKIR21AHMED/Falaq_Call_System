const express = require("express");

const {
  getAgents,
  getOverview,
} = require(
  "../controllers/adminController"
);

const {
  protect,
  authorize,
} = require(
  "../middleware/authMiddleware"
);

const router = express.Router();

router.get(
  "/agents",
  protect,
  authorize("admin"),
  getAgents
);

router.get(
  "/overview",
  protect,
  authorize("admin"),
  getOverview
);

module.exports = router;