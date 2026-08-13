const express = require("express");



const {
  protect,
  authorize,
} = require("../middleware/authMiddleware");

const router = express.Router();
const {
  simulateIncomingCall,
  acceptCall,
  rejectCall,
  endCall,
  getCallHistory,
} = require("../controllers/callController");

router.get(
  "/history",
  protect,
  authorize("agent", "admin"),
  getCallHistory
);

router.post(
  "/simulate-incoming",
  protect,
  authorize("admin", "agent"),
  simulateIncomingCall
);
router.patch(
  "/:callId/accept",
  protect,
  authorize("agent"),
  acceptCall
);

router.patch(
  "/:callId/reject",
  protect,
  authorize("agent"),
  rejectCall
);

router.patch(
  "/:callId/end",
  protect,
  authorize("agent"),
  endCall
);


module.exports = router;