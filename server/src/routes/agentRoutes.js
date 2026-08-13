const express = require("express");

const {
  updateAgentStatus,
} = require("../controllers/agentController");

const {
  protect,
  authorize,
} = require("../middleware/authMiddleware");

const router = express.Router();

router.patch(
  "/status",
  protect,
  authorize("agent"),
  updateAgentStatus
);

module.exports = router;